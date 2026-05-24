import bcrypt from 'bcryptjs'
import { ensureDatabaseExists, getOne, query } from './postgres.js'

let schemaReady = false

const userColumns = `
  id,
  full_name,
  email,
  phone,
  password_hash,
  role,
  avatar_url,
  headline,
  bio,
  location,
  theme,
  email_notifications,
  product_updates
`

export function toSafeUser(row) {
  if (!row) return null

  return {
    id: row.id,
    _id: String(row.id),
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.avatar_url || '',
    profile: {
      headline: row.headline || '',
      bio: row.bio || '',
      location: row.location || '',
    },
    settings: {
      theme: row.theme || 'dark',
      emailNotifications: row.email_notifications !== false,
      productUpdates: row.product_updates !== false,
    },
  }
}

export async function ensureAuthSchema() {
  if (schemaReady) return

  await ensureDatabaseExists()

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL DEFAULT '',
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner','instructor','admin')),
      avatar_url VARCHAR(512) NOT NULL DEFAULT '',
      headline VARCHAR(255) NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      location VARCHAR(255) NOT NULL DEFAULT '',
      theme VARCHAR(10) NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark')),
      email_notifications BOOLEAN NOT NULL DEFAULT true,
      product_updates BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));

    CREATE TABLE IF NOT EXISTS login_activity (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      ip VARCHAR(45) NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS login_activities (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      ip_address VARCHAR(45) NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_login_activity_user ON login_activity (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_login_activities_user ON login_activities (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS learner_progress (
      id SERIAL PRIMARY KEY,
      learner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      course_id INT NOT NULL,
      progress_percent INT NOT NULL DEFAULT 0,
      completed_lessons JSONB NOT NULL DEFAULT '[]',
      last_accessed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(learner_id, course_id)
    );

    CREATE INDEX IF NOT EXISTS idx_learner_progress_learner ON learner_progress (learner_id, last_accessed DESC);

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await seedUser({
    fullName: 'Demo Learner',
    email: 'learner@example.com',
    phone: '1234567890',
    password: 'password123',
    role: 'learner',
  })
  await seedUser({
    fullName: 'Platform Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
    phone: '9999999999',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
    role: 'admin',
  })

  schemaReady = true
}

async function seedUser({ fullName, email, phone, password, role }) {
  const existing = await getOne('SELECT id FROM users WHERE lower(email) = lower($1)', [email])
  if (existing) return

  const passwordHash = await bcrypt.hash(password, 12)

  await query(
    `
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ($1, lower($2), $3, $4, $5)
    `,
    [fullName, email, phone, passwordHash, role],
  )
}

export async function findUserByEmail(email) {
  await ensureAuthSchema()
  return getOne(`SELECT ${userColumns}, password_hash FROM users WHERE lower(email) = lower($1)`, [email])
}

export async function findUserById(id) {
  await ensureAuthSchema()
  return getOne(`SELECT ${userColumns} FROM users WHERE id = $1`, [id])
}

export async function createUser({ fullName, email, phone, password, role }) {
  await ensureAuthSchema()

  const passwordHash = await bcrypt.hash(password, 12)
  const { rows } = await query(
    `
      INSERT INTO users (full_name, email, phone, password_hash, role)
      VALUES ($1, lower($2), $3, $4, $5)
      RETURNING ${userColumns}
    `,
    [fullName, email, phone, passwordHash, role],
  )

  return rows[0]
}

export async function recordLogin({ userId, email, ip, userAgent }) {
  await ensureAuthSchema()

  await query(
    `
      INSERT INTO login_activity (user_id, email, ip, user_agent)
      VALUES ($1, $2, $3, $4)
    `,
    [userId, email, ip || '', userAgent || ''],
  )
}

export async function updateUserProfile(userId, { fullName, phone, avatarUrl, profile = {} }) {
  await ensureAuthSchema()

  const current = await findUserById(userId)
  const { rows } = await query(
    `
      UPDATE users
      SET
        full_name = $2,
        phone = $3,
        avatar_url = $4,
        headline = $5,
        bio = $6,
        location = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${userColumns}
    `,
    [
      userId,
      fullName || current.full_name,
      phone || current.phone,
      avatarUrl ?? current.avatar_url,
      profile.headline ?? current.headline,
      profile.bio ?? current.bio,
      profile.location ?? current.location,
    ],
  )

  return rows[0]
}

export async function updateUserSettings(userId, settings = {}) {
  await ensureAuthSchema()

  const current = await findUserById(userId)
  const { rows } = await query(
    `
      UPDATE users
      SET
        theme = $2,
        email_notifications = $3,
        product_updates = $4,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${userColumns}
    `,
    [
      userId,
      settings.theme || current.theme,
      settings.emailNotifications ?? current.email_notifications,
      settings.productUpdates ?? current.product_updates,
    ],
  )

  return rows[0]
}

export async function createContactSubmission({ fullName, email, subject, message }) {
  await ensureAuthSchema()

  const { rows } = await query(
    `
      INSERT INTO contact_submissions (full_name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, email, subject, message, status, created_at
    `,
    [fullName, email, subject, message],
  )

  return rows[0]
}

export async function getAdminOverview() {
  await ensureAuthSchema()

  const [{ rows: userRows }, { rows: contactRows }, { rows: loginRows }] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM users'),
    query('SELECT COUNT(*)::int AS count FROM contact_submissions'),
    query(`
      SELECT id, user_id, email, ip, user_agent, created_at
      FROM login_activity
      ORDER BY created_at DESC
      LIMIT 20
    `),
  ])

  return {
    metrics: {
      users: userRows[0].count,
      contacts: contactRows[0].count,
      logins: loginRows.length,
    },
    recentLogins: loginRows,
  }
}
