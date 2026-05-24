import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { normalizeRole, publicUser, signToken } from '../utils/tokens.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.post('/register', async (req, res, next) => {
  try {
    const { name, fullName, email, password, confirmPassword, role = 'learner' } = req.body
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
        passwordHash: await bcrypt.hash(password, 12),
        role: normalizeRole(role),
      },
    })

    const safeUser = publicUser(user)
    await prisma.analyticsEvent.create({ data: { userId: user.id, eventType: 'user_registered' } })
    res.status(201).json({ success: true, token: signToken(user), user: safeUser })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const cleanEmail = String(req.body.email || req.body.username || '').trim().toLowerCase()
    const { password, role } = req.body
    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' })
    }

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' })
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been disabled.' })
    }
    if (role && normalizeRole(role) !== user.role) {
      return res.status(403).json({ success: false, message: `This account is registered as ${user.role.toLowerCase()}.` })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    await prisma.analyticsEvent.create({ data: { userId: user.id, eventType: 'user_login' } })

    res.json({ success: true, token: signToken(updated), user: publicUser(updated) })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user })
})

export default router
