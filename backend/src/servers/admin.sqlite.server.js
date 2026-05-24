import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, getUserByEmail, createUser, logLoginActivity, getLearners, getInstructors, logAdminAction } from '../config/db.sqlite.js'
import { initializeDatabase } from '../config/db.sqlite.js'

const app = express()
const port = Number(process.env.ADMIN_PORT || 5001)
const jwtSecret = process.env.JWT_SECRET || 'admin-secret-change-me'

// Initialize database on startup
initializeDatabase().catch(console.error)

app.use(cors({ origin: 'http://localhost:5175', credentials: true }))
app.use(express.json({ limit: '2mb' }))

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' },
  )
}

function toSafeJSON(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatar_url,
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'uptoskills-admin' })
})

// Admin login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const loginEmail = (email || '').toLowerCase().trim()

  if (!loginEmail || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' })
  }

  try {
    const user = await getUserByEmail(loginEmail)

    if (!user || !['admin', 'instructor'].includes(user.role)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    await logLoginActivity({
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    })

    const token = signToken(user)
    res.json({ success: true, token, user: toSafeJSON(user) })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get admin profile
app.get('/api/auth/me', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE id = ?', [payload.sub])
    await db.close()

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' })
    }

    res.json({ success: true, user: toSafeJSON(user) })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
})

// Get all learners (admin only)
app.get('/api/admin/learners', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' })
    }

    const learners = await getLearners()
    res.json({ success: true, learners })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token.' })
  }
})

// Get all instructors (admin only)
app.get('/api/admin/instructors', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' })
    }

    const instructors = await getInstructors()
    res.json({ success: true, instructors })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token.' })
  }
})

// Create admin/instructor user
app.post('/api/admin/users', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required.' })
    }

    const { fullName, email, phone, role = 'instructor', password } = req.body

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({ fullName, email, phone, passwordHash, role })

    await logAdminAction({
      adminId: payload.sub,
      action: 'create_user',
      details: { createdUser: email, role },
    })

    res.status(201).json({ success: true, user: toSafeJSON(user) })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

app.listen(port, () => {
  console.log(`Admin Portal API running on http://localhost:${port}`)
})