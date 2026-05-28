import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../config/prisma.js'
import { normalizeRole, publicUser, roleToDatabase, signToken } from '../utils/tokens.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const otpStore = new Map()
const oauthStateStore = new Map()

const appBaseUrl = () => (process.env.APP_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const apiBaseUrl = () => (process.env.API_BASE_URL || `http://localhost:${process.env.API_PORT || process.env.PORT || 5000}`).replace(/\/$/, '')
const googleRedirectUri = () => process.env.GOOGLE_REDIRECT_URI || `${apiBaseUrl()}/api/auth/google/callback`
const githubRedirectUri = () => process.env.GITHUB_REDIRECT_URI || `${apiBaseUrl()}/api/auth/github/callback`

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    const error = new Error(`${name} is not configured.`)
    error.statusCode = 503
    throw error
  }
  return value
}

function createOAuthState(provider, role, intent = 'login') {
  const state = crypto.randomBytes(24).toString('hex')
  oauthStateStore.set(state, {
    provider,
    role: normalizeRole(role),
    intent: intent === 'register' ? 'register' : 'login',
    expiresAt: Date.now() + 10 * 60 * 1000,
  })
  return state
}

function consumeOAuthState(state, provider) {
  const record = oauthStateStore.get(state)
  oauthStateStore.delete(state)
  if (!record || record.provider !== provider || record.expiresAt < Date.now()) {
    const error = new Error('OAuth session expired. Please try again.')
    error.statusCode = 400
    throw error
  }
  return record
}

async function redirectWithSession(req, res, user) {
  const safeUser = publicUser(user)
  const token = signToken(user)
  await createSessionRecord(req, user, token)
  const encodedUser = Buffer.from(JSON.stringify(safeUser)).toString('base64url')
  const url = new URL('/auth/callback', appBaseUrl())
  url.searchParams.set('token', token)
  url.searchParams.set('user', encodedUser)
  url.searchParams.set('role', safeUser.role)
  return res.redirect(url.toString())
}

async function createSessionRecord(req, user, token) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  await prisma.session.upsert({
    where: { tokenHash },
    update: {
      revokedAt: null,
      expiresAt,
      lastSeenAt: new Date(),
    },
    create: {
      userId: user.id,
      tokenHash,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      expiresAt,
    },
  })
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: 'auth_session_created',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  })
}

function redirectWithOAuthError(res, error) {
  const url = new URL('/login', appBaseUrl())
  url.searchParams.set('error', error.message || 'OAuth login failed.')
  return res.redirect(url.toString())
}

function createOtp(email, purpose = 'login') {
  const otp = String(crypto.randomInt(100000, 999999))
  otpStore.set(`${purpose}:${email}`, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })
  return otp
}

function consumeOtp(email, otp, purpose = 'login') {
  const key = `${purpose}:${email}`
  const record = otpStore.get(key)
  if (!record || record.expiresAt < Date.now() || record.otp !== String(otp || '').trim()) return false
  otpStore.delete(key)
  return true
}

function providerEmail(provider, value) {
  return String(value || `${provider}-${Date.now()}@social.uptoskills.local`).trim().toLowerCase()
}

async function findOrCreateSocialUser({ provider, email, name, avatarUrl, role = 'learner' }) {
  const cleanEmail = providerEmail(provider, email)
  const displayName = String(name || `${provider[0].toUpperCase()}${provider.slice(1)} Learner`).trim()
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })

  if (existing) {
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: existing.name || displayName,
        avatarUrl: existing.avatarUrl || avatarUrl || '',
        approvalStatus: 'APPROVED',
      },
    })
    return { user, created: false }
  }

  const user = await prisma.user.create({
    data: {
      name: displayName,
      email: cleanEmail,
      phone: '',
      avatarUrl: avatarUrl || '',
      passwordHash: await bcrypt.hash(`${provider}:${crypto.randomUUID()}`, 12),
      role: normalizeRole(role),
      approvalStatus: 'APPROVED',
    },
  })
  return { user, created: true }
}

async function exchangeGoogleCode(code) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirect_uri: googleRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await response.json()
  if (!response.ok) throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed.')

  const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profile = await profileResponse.json()
  if (!profileResponse.ok || !profile.email || profile.email_verified === false) {
    throw new Error('Google account email could not be verified.')
  }

  return {
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture,
  }
}

async function exchangeGithubCode(code) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      client_id: requireEnv('GITHUB_CLIENT_ID'),
      client_secret: requireEnv('GITHUB_CLIENT_SECRET'),
      redirect_uri: githubRedirectUri(),
    }),
  })
  const tokenData = await response.json()
  if (!response.ok || tokenData.error) throw new Error(tokenData.error_description || tokenData.error || 'GitHub token exchange failed.')

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${tokenData.access_token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const [userResponse, emailResponse] = await Promise.all([
    fetch('https://api.github.com/user', { headers }),
    fetch('https://api.github.com/user/emails', { headers }),
  ])
  const profile = await userResponse.json()
  const emails = emailResponse.ok ? await emailResponse.json() : []
  if (!userResponse.ok) throw new Error(profile.message || 'GitHub profile fetch failed.')

  const primaryEmail = Array.isArray(emails)
    ? emails.find((item) => item.primary && item.verified)?.email || emails.find((item) => item.verified)?.email
    : null
  if (!primaryEmail) throw new Error('GitHub account does not expose a verified email.')

  return {
    email: primaryEmail,
    name: profile.name || profile.login,
    avatarUrl: profile.avatar_url,
  }
}

async function recordAnalytics(data) {
  try {
    await prisma.analyticsEvent.create({ data })
  } catch (error) {
    console.warn('Analytics event skipped:', error.message)
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, fullName, email, phone, password, confirmPassword, role = 'USER' } = req.body
    const cleanEmail = String(email || '').trim().toLowerCase()
    const displayName = String(name || fullName || '').trim()

    if (!displayName || !cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' })
    }
    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' })
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
    }

    const user = await prisma.user.create({
      data: {
        name: displayName,
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        passwordHash: await bcrypt.hash(password, 12),
        role: roleToDatabase(role),
        approvalStatus: 'APPROVED',
      },
    })

    const safeUser = publicUser(user)
    const token = signToken(user)
    await createSessionRecord(req, user, token)
    await recordAnalytics({ userId: user.id, eventType: 'user_registered' })
    res.status(201).json({ success: true, token, user: safeUser })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    // Support more common field names from different frontend forms
    const loginId = String(req.body.email || req.body.username || req.body.loginId || '').trim()
    const cleanEmail = loginId.toLowerCase()
    const { password, role } = req.body

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Credentials and password are required.' })
    }
    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
    }

    const user = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
      },
    })

    // Validate existence and compare bcrypt hash
    const isPasswordValid = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been disabled.' })
    }
    if (['REJECTED', 'SUSPENDED'].includes(String(user.approvalStatus || 'APPROVED').toUpperCase())) {
      return res.status(403).json({ success: false, message: 'This account is not currently approved.' })
    }

    // Strict Role Enforcement
    if (role && roleToDatabase(role) !== user.role) {
      return res.status(403).json({ success: false, message: `Access denied. Authorized role: ${user.role}` })
    }

    const token = signToken(user)
    await createSessionRecord(req, user, token)
    await recordAnalytics({ userId: user.id, eventType: 'user_login' })

    res.json({ success: true, token, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.get('/google/start', (req, res, next) => {
  try {
    const state = createOAuthState('google', req.query.role, req.query.intent)
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', requireEnv('GOOGLE_CLIENT_ID'))
    url.searchParams.set('redirect_uri', googleRedirectUri())
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('scope', 'openid email profile')
    url.searchParams.set('state', state)
    url.searchParams.set('prompt', 'select_account')
    res.redirect(url.toString())
  } catch (error) {
    next(error)
  }
})

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state) throw new Error('Google callback is missing code or state.')
    const oauthState = consumeOAuthState(String(state), 'google')
    const profile = await exchangeGoogleCode(String(code))
    const { user, created } = await findOrCreateSocialUser({
      provider: 'google',
      ...profile,
      role: oauthState.role,
    })
    await recordAnalytics({ userId: user.id, eventType: created ? 'google_register' : 'google_login' })
    return redirectWithSession(req, res, user)
  } catch (error) {
    return redirectWithOAuthError(res, error)
  }
})

router.get('/github/start', (req, res, next) => {
  try {
    const state = createOAuthState('github', req.query.role, req.query.intent)
    const url = new URL('https://github.com/login/oauth/authorize')
    url.searchParams.set('client_id', requireEnv('GITHUB_CLIENT_ID'))
    url.searchParams.set('redirect_uri', githubRedirectUri())
    url.searchParams.set('scope', 'read:user user:email')
    url.searchParams.set('state', state)
    res.redirect(url.toString())
  } catch (error) {
    next(error)
  }
})

router.get('/github/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    if (!code || !state) throw new Error('GitHub callback is missing code or state.')
    const oauthState = consumeOAuthState(String(state), 'github')
    const profile = await exchangeGithubCode(String(code))
    const { user, created } = await findOrCreateSocialUser({
      provider: 'github',
      ...profile,
      role: oauthState.role,
    })
    await recordAnalytics({ userId: user.id, eventType: created ? 'github_register' : 'github_login' })
    return redirectWithSession(req, res, user)
  } catch (error) {
    return redirectWithOAuthError(res, error)
  }
})

router.post('/otp/send', async (req, res, next) => {
  try {
    const cleanEmail = String(req.body.email || req.body.username || '').trim().toLowerCase()
    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
    }
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) return res.status(404).json({ success: false, message: 'No account found for this email.' })
    const otp = createOtp(cleanEmail, 'login')
    console.log(`Development OTP for ${cleanEmail}: ${otp}`)
    res.json({ success: true, message: 'OTP sent. In development, check the backend console.' })
  } catch (error) {
    next(error)
  }
})

router.post('/otp/verify', async (req, res, next) => {
  try {
    const cleanEmail = String(req.body.email || req.body.username || '').trim().toLowerCase()
    if (!consumeOtp(cleanEmail, req.body.otp, 'login')) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' })
    }
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) return res.status(404).json({ success: false, message: 'No account found for this email.' })
    if (req.body.role && roleToDatabase(req.body.role) !== user.role) {
      return res.status(403).json({ success: false, message: `This account is registered as ${user.role.toLowerCase()}.` })
    }
    const token = signToken(user)
    await createSessionRecord(req, user, token)
    await recordAnalytics({ userId: user.id, eventType: 'otp_login' })
    res.json({ success: true, token, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/password/forgot', async (req, res, next) => {
  try {
    const cleanEmail = String(req.body.email || '').trim().toLowerCase()
    if (!emailPattern.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
    }
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user) return res.status(404).json({ success: false, message: 'No account found for this email.' })
    const otp = createOtp(cleanEmail, 'reset')
    console.log(`Development password reset OTP for ${cleanEmail}: ${otp}`)
    res.json({ success: true, message: 'Reset code sent. In development, check the backend console.' })
  } catch (error) {
    next(error)
  }
})

router.post('/password/reset', async (req, res, next) => {
  try {
    const cleanEmail = String(req.body.email || '').trim().toLowerCase()
    const newPassword = String(req.body.newPassword || req.body.password || '')
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
    }
    if (!consumeOtp(cleanEmail, req.body.otp, 'reset')) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' })
    }
    const user = await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    })
    await recordAnalytics({ userId: user.id, eventType: 'password_reset' })
    res.json({ success: true, message: 'Password updated successfully.' })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user })
})

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (token) {
      await prisma.session.updateMany({
        where: { tokenHash: crypto.createHash('sha256').update(token).digest('hex'), revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    await prisma.activityLog.create({ data: { userId: req.user.id, action: 'user_logout', ipAddress: req.ip, userAgent: req.get('user-agent') } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
