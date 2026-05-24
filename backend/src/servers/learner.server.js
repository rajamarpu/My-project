import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const app = express()
const port = Number(process.env.LEARNER_PORT || 5002)
const jwtSecret = process.env.JWT_SECRET || 'learner-secret-change-me'

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'celebrity_academy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

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
  res.json({ success: true, service: 'celebrity-academy-learner' })
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
    const exists = await pool.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email.toLowerCase()])
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please login instead.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const userRes = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role) 
       VALUES ($1, lower($2), $3, $4, $5) 
       RETURNING *`,
      [fullName, email, phone, passwordHash, role],
    )

    const token = signToken(userRes.rows[0])
    res.status(201).json({ success: true, token, user: toSafeJSON(userRes.rows[0]) })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(503).json({ success: false, message: 'Database connection failed. Please ensure PostgreSQL is running.' })
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
    let userQuery = 'SELECT * FROM users WHERE lower(email) = lower($1)'
    const params = [loginEmail]

    if (role) {
      userQuery += ' AND role = $2'
      params.push(role)
    }

    const userRes = await pool.query(userQuery, params)
    const user = userRes.rows[0]

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please create an account first.',
      })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' })
    }
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `This account is registered as ${user.role}.` })
    }

    await pool.query(
      'INSERT INTO login_activity (user_id, email, ip, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, user.email, req.ip, req.headers['user-agent'] || ''],
    )

    const token = signToken(user)
    res.json({ success: true, token, user: toSafeJSON(user) })
  } catch (error) {
    console.error('Login error:', error)
    res.status(503).json({ success: false, message: 'Database connection failed. Please ensure PostgreSQL is running.' })
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
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub])
    const user = userRes.rows[0]

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

    await pool.query(
      `INSERT INTO learner_progress (learner_id, course_id, progress_percent, completed_lessons) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (learner_id, course_id) 
       DO UPDATE SET progress_percent = $3, completed_lessons = $4, last_accessed = CURRENT_TIMESTAMP`,
      [payload.sub, courseId, progressPercent, JSON.stringify(completedLessons)],
    )

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

    const progressRes = await pool.query(
      'SELECT * FROM learner_progress WHERE learner_id = $1 ORDER BY last_accessed DESC',
      [payload.sub],
    )

    res.json({ success: true, courses: progressRes.rows })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token.' })
  }
})

app.listen(port, () => {
  console.log(`Learner Portal API running on http://localhost:${port}`)
})