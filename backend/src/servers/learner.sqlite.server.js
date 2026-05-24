import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, getUserByEmail, createUser, logLoginActivity, initializeDatabase } from '../config/db.sqlite.js'

const app = express()
const port = Number(process.env.LEARNER_PORT || 5002)
const jwtSecret = process.env.JWT_SECRET || 'learner-secret-change-me'

// Initialize database on startup
initializeDatabase().catch(console.error)

app.use(cors({ origin: 'http://localhost:5176', credentials: true }))
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
  res.json({ success: true, service: 'uptoskills-learner' })
})

// Learner registration
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, phone, password, confirmPassword, role = 'learner' } = req.body

  if (!fullName || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'All registration fields are required.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' })
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' })
  }

  try {
    const existing = await getUserByEmail(email)
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await createUser({ fullName, email, phone, passwordHash, role })

    const token = signToken(user)
    res.status(201).json({ success: true, token, user: toSafeJSON(user) })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Learner login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body
  const loginEmail = (email || '').toLowerCase().trim()

  if (!loginEmail || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' })
  }

  try {
    const db = await getDb()
    let query = 'SELECT * FROM users WHERE email = ?'
    const params = [loginEmail]

    if (role) {
      query += ' AND role = ?'
      params.push(role)
    }

    const user = await db.get(query, params)

    if (!user) {
      await db.close()
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      await db.close()
      return res.status(401).json({ success: false, message: 'Invalid email or password.' })
    }

    if (role && user.role !== role) {
      await db.close()
      return res.status(403).json({ success: false, message: `This account is registered as ${user.role}.` })
    }

    await logLoginActivity({
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    })

    await db.close()

    const token = signToken(user)
    res.json({ success: true, token, user: toSafeJSON(user) })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get current user
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

// Update learner progress
app.post('/api/learner/progress', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload.role !== 'learner') {
      return res.status(403).json({ success: false, message: 'Learner access required.' })
    }

    const { courseId, progressPercent, completedLessons = [] } = req.body
    const db = await getDb()

    // Check if progress record exists
    const existing = await db.get(
      'SELECT id FROM learner_progress WHERE learner_id = ? AND course_id = ?',
      [payload.sub, courseId],
    )

    if (existing) {
      await db.run(
        'UPDATE learner_progress SET progress_percent = ?, completed_lessons = ?, last_accessed = CURRENT_TIMESTAMP WHERE learner_id = ? AND course_id = ?',
        [progressPercent, JSON.stringify(completedLessons), payload.sub, courseId],
      )
    } else {
      await db.run(
        'INSERT INTO learner_progress (learner_id, course_id, progress_percent, completed_lessons) VALUES (?, ?, ?, ?)',
        [payload.sub, courseId, progressPercent, JSON.stringify(completedLessons)],
      )
    }
    await db.close()

    res.json({ success: true, message: 'Progress saved.' })
  } catch (error) {
    console.error('Progress update error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Get learner dashboard data
app.get('/api/learner/dashboard', async (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload.role !== 'learner') {
      return res.status(403).json({ success: false, message: 'Learner access required.' })
    }

    const db = await getDb()
    const courses = await db.all(
      'SELECT * FROM learner_progress WHERE learner_id = ? ORDER BY last_accessed DESC',
      [payload.sub],
    )
    await db.close()

    res.json({ success: true, courses })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token.' })
  }
})

app.listen(port, () => {
  console.log(`Learner Portal API running on http://localhost:${port}`)
})