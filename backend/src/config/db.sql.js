import pg from 'pg'
import dotenv from 'dotenv'

const { Pool } = pg
dotenv.config()

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'celebrity_academy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function query(text, params) {
  const start = Date.now()
  const res = await pool.query(text, params)
  const duration = Date.now() - start
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: res.rowCount })
  }
  return res
}

export async function getUserByEmail(email) {
  const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
  return res.rows[0]
}

export async function getUserById(id) {
  const res = await query('SELECT * FROM users WHERE id = $1', [id])
  return res.rows[0]
}

export async function createUser({ fullName, email, phone, passwordHash, role }) {
  const res = await query(
    `INSERT INTO users (full_name, email, phone, password_hash, role) 
     VALUES ($1, $2, $3, $4, $5) 
     RETURNING *`,
    [fullName, email.toLowerCase(), phone, passwordHash, role],
  )
  return res.rows[0]
}

export async function logLoginActivity({ userId, email, ip, userAgent }) {
  await query(
    'INSERT INTO login_activities (user_id, email, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
    [userId, email, ip, userAgent],
  )
}

export async function logAdminAction({ adminId, action, details }) {
  await query(
    'INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, $2, $3)',
    [adminId, action, details ? JSON.stringify(details) : null],
  )
}

export async function getLearners() {
  const res = await query("SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = 'learner' ORDER BY created_at DESC")
  return res.rows
}

export async function getAdmins() {
  const res = await query("SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC")
  return res.rows
}

export default pool