import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createUser, ensureAuthSchema, findUserByEmail, findUserById, recordLogin, toSafeUser } from '../db/authSql.js'
import { signToken } from '../utils/tokens.js'
import { prisma } from '../config/prisma.js'

const router = Router()
let dbInitialized = false

async function ensureDb() {
  if (!dbInitialized) {
    await ensureAuthSchema()
    dbInitialized = true
  }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8
}

function handleDbError(res, error) {
  console.error('Database auth error:', error)
  if (error?.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'PostgreSQL is not running on localhost:5432. Start PostgreSQL, then try again.',
    })
  }
  return res.status(503).json({
    success: false,
    message: error?.message || 'PostgreSQL database is not reachable. Check your .env settings.',
  })
}

router.post('/register', async (req, res) => {
  try {
    await ensureDb()
    const { fullName, email, phone, password, confirmPassword, role = 'learner' } = req.body

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All registration fields are required.' })
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' })
    }
    if (!['learner', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' })
    }

    const existing = await findUserByEmail(email)
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists. Please login instead.',
      })
    }

    const row = await createUser({ fullName, email, phone, password, role })
    const user = toSafeUser(row)

    return res.status(201).json({
      success: true,
      token: signToken(user),
      user,
      message: 'Account created successfully. Your credentials are stored in PostgreSQL.',
    })
  } catch (error) {
    return handleDbError(res, error)
  }
})

router.post('/login', async (req, res) => {
  try {
    await ensureDb()
    const { email, username, password, role } = req.body
    const loginEmail = (email || username || '').toLowerCase().trim()

    if (!loginEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' })
    }

    const row = await findUserByEmail(loginEmail)
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please create an account first.',
      })
    }

    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' })
    }
    if (role && row.role !== role) {
      return res.status(403).json({ success: false, message: `This account is registered as ${row.role}.` })
    }

    await recordLogin({
      userId: row.id,
      email: row.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    })

    const user = toSafeUser(row)

    const token = signToken(user)
    return res.json({
      success: true,
      token,
      user,
    })
  } catch (error) {
    return handleDbError(res, error)
  }
})

router.get('/me', async (req, res) => {
  try {
    await ensureDb()
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me')
    const row = await findUserById(payload.sub)
    const user = toSafeUser(row)

    if (!user) {
      return res.status(401).json({ success: false, message: 'User session is no longer valid.' })
    }

    return res.json({ success: true, user })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
    }
    return handleDbError(res, error)
  }
})

// GitHub OAuth
router.post('/github', async (req, res) => {
  try {
    const { accessToken } = req.body
    
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'GitHub access token is required' })
    }
    
    // In a real implementation, you would verify the token with GitHub API
    // For now, we'll simulate a GitHub user response
    const githubUser = {
      id: `github_${Date.now()}`,
      email: `user${Date.now()}@github.com`,
      full_name: 'GitHub User',
      avatar_url: 'https://avatars.githubusercontent.com/u/99999999?v=4'
    }
    
    // Check if user exists by GitHub ID or email
    let existingUser = await findUserByEmail(githubUser.email)
    
    if (!existingUser) {
      // Create new user from GitHub data
      const randomPassword = Math.random().toString(36).slice(-8)
      const newUser = await createUser({
        fullName: githubUser.full_name,
        email: githubUser.email,
        phone: '0000000000',
        password: randomPassword,
        role: 'learner',
        githubId: githubUser.id
      })
      existingUser = newUser
    }
    
    const user = toSafeUser(existingUser)
    const token = signToken(user)
    
    return res.json({
      success: true,
      token,
      user,
      message: 'GitHub login successful'
    })
  } catch (error) {
    console.error('GitHub OAuth error:', error)
    return res.status(500).json({ success: false, message: 'GitHub authentication failed' })
  }
})

export default router