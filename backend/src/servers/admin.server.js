import 'dotenv/config'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') })
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'

const app = express()
const port = Number(process.env.ADMIN_PORT || 5001)
const jwtSecret = process.env.JWT_SECRET || 'admin-secret-change-me'

// PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'uptoskills',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

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
  res.json({ success: true, service: 'celebrity-academy-admin' })
})

// Admin login - allows admin and instructor roles
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const loginEmail = (email || '').toLowerCase().trim()

  if (!loginEmail || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' })
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1) AND role IN (\'admin\', \'instructor\')', [loginEmail])
    const user = userRes.rows[0]

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No admin account found with this email. Please check your credentials or contact support.',
      })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' })
    }

    await pool.query(
      'INSERT INTO login_activity (user_id, email, ip, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, user.email, req.ip, req.headers['user-agent'] || ''],
    )

    const token = signToken(user)
    res.json({ success: true, token, user: toSafeJSON(user) })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(503).json({ success: false, message: 'Database connection failed. Please ensure PostgreSQL is running.' })
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

    const learnersRes = await pool.query('SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = \'learner\' ORDER BY created_at DESC')
    res.json({ success: true, learners: learnersRes.rows })
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

    const instructorsRes = await pool.query('SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = \'instructor\' ORDER BY created_at DESC')
    res.json({ success: true, instructors: instructorsRes.rows })
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token.' })
  }
})

// Create admin user
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

    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'User with this email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const userRes = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [fullName, email.toLowerCase(), phone, passwordHash, role],
    )

    res.status(201).json({ success: true, user: toSafeJSON(userRes.rows[0]) })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

app.listen(port, () => {
  console.log(`Admin Portal API running on http://localhost:${port}`)
})