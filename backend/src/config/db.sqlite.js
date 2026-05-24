import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, '../../../data/uptoskills.db')

export async function getDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  })
  return db
}

export async function initializeDatabase() {
  const db = await getDb()

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'admin')),
      avatar_url TEXT DEFAULT '',
      headline TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      location TEXT DEFAULT '',
      theme TEXT DEFAULT 'dark',
      email_notifications INTEGER DEFAULT 1,
      product_updates INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS login_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      email TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS learner_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      learner_id INTEGER NOT NULL,
      course_id INTEGER,
      progress_percent INTEGER DEFAULT 0,
      completed_lessons TEXT DEFAULT '[]',
      last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      action_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create indexes
  await db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
  await db.exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)')

  // Insert default admin if not exists
  const adminExists = await db.get('SELECT id FROM users WHERE email = ?', ['admin@example.com'])
  if (!adminExists) {
    const adminHash = await bcrypt.hash('Admin@12345', 12)
    await db.run(
      'INSERT INTO users (full_name, email, phone, password_hash, role, headline) VALUES (?, ?, ?, ?, ?, ?)',
      ['Platform Admin', 'admin@example.com', '9999999999', adminHash, 'admin', 'System Administrator'],
    )
  }

  // Insert demo learner if not exists
  const learnerExists = await db.get('SELECT id FROM users WHERE email = ?', ['learner@example.com'])
  if (!learnerExists) {
    const learnerHash = await bcrypt.hash('password', 12)
    await db.run(
      'INSERT INTO users (full_name, email, phone, password_hash, role, headline) VALUES (?, ?, ?, ?, ?, ?)',
      ['Demo Learner', 'learner@example.com', '1234567890', learnerHash, 'learner', 'Student'],
    )
  }

  console.log('SQLite database initialized at', DB_PATH)
  await db.close()
}

// User operations
export async function getUserByEmail(email) {
  const db = await getDb()
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()])
  await db.close()
  return user
}

export async function getUserById(id) {
  const db = await getDb()
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
  await db.close()
  return user
}

export async function createUser({ fullName, email, phone, passwordHash, role }) {
  const db = await getDb()
  const result = await db.run(
    'INSERT INTO users (full_name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [fullName, email.toLowerCase(), phone, passwordHash, role],
  )
  const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID])
  await db.close()
  return user
}

export async function logLoginActivity({ userId, email, ip, userAgent }) {
  const db = await getDb()
  await db.run(
    'INSERT INTO login_activities (user_id, email, ip_address, user_agent) VALUES (?, ?, ?, ?)',
    [userId, email, ip, userAgent],
  )
  await db.close()
}

export async function logAdminAction({ adminId, action, details }) {
  const db = await getDb()
  await db.run(
    'INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)',
    [adminId, action, details ? JSON.stringify(details) : null],
  )
  await db.close()
}

export async function getLearners() {
  const db = await getDb()
  const learners = await db.all('SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = \'learner\' ORDER BY created_at DESC')
  await db.close()
  return learners
}

export async function getInstructors() {
  const db = await getDb()
  const instructors = await db.all('SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = \'instructor\'')
  await db.close()
  return instructors
}

export async function getAdmins() {
  const db = await getDb()
  const admins = await db.all('SELECT id, full_name, email, phone, role, created_at FROM users WHERE role = \'admin\'')
  await db.close()
  return admins
}