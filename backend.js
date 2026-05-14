import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import Database from 'better-sqlite3'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, 'backend', 'data')
const DATA_FILE = join(DATA_DIR, 'celebrity-academy.json')
const DB_FILE = join(DATA_DIR, 'celebrity-academy.db')
const PORT = process.env.PORT || 4001
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:4000'
const JWT_SECRET = process.env.JWT_SECRET || 'celebrity-academy-dev-secret'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'celebrity-academy-refresh-secret'

const now = () => new Date().toISOString()
const id = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex')
const normalizeUser = (user) => {
  if (!user) return null
  const value = typeof user.toObject === 'function' ? user.toObject() : user
  return { ...value, id: value.id || value._id?.toString() }
}
const publicUser = (user) => {
  const { password, refreshTokens, __v, _id, ...safeUser } = normalizeUser(user) || {}
  return safeUser
}

const authUserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  username: { type: String, required: true },
  fullName: { type: String, required: true },
  password: { type: String },
  role: { type: String, enum: ['learner', 'instructor', 'admin'], default: 'learner', index: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  provider: { type: String, default: 'local' },
  refreshTokens: { type: [String], default: [] },
  createdAt: { type: String, default: now },
}, { timestamps: true })

const AuthUser = mongoose.models.AuthUser || mongoose.model('AuthUser', authUserSchema)
let mongoUsersEnabled = false

const learningPath = (topic) => [
  {
    id: id('module'),
    title: `${topic} Beginner`,
    level: 'Beginner',
    summary: 'First principles, vocabulary, setup, and guided practice.',
    lessons: [
      lesson('Welcome and roadmap', 8),
      lesson(`${topic} fundamentals`, 18),
      lesson('Core concepts with examples', 22),
      lesson('Guided practice lab', 28),
    ],
  },
  {
    id: id('module'),
    title: `${topic} Intermediate`,
    level: 'Intermediate',
    summary: 'Patterns, real workflows, debugging, and production habits.',
    lessons: [
      lesson('Project structure and workflow', 24),
      lesson('Working with APIs and data', 30),
      lesson('Reusable patterns', 26),
      lesson('Mini project checkpoint', 36),
    ],
  },
  {
    id: id('module'),
    title: `${topic} Advanced`,
    level: 'Advanced',
    summary: 'Architecture, optimization, testing, security, and scale.',
    lessons: [
      lesson('Advanced architecture', 34),
      lesson('Performance and security', 32),
      lesson('Testing and deployment', 30),
      lesson('Capstone build', 45),
    ],
  },
]

function lesson(title, minutes) {
  return {
    id: id('lesson'),
    title,
    durationMinutes: minutes,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    notes: `Key notes for ${title}: review the concept, apply it in the lab, and summarize your learning.`,
    resources: [
      { label: 'Reference guide', url: 'https://www.w3schools.com/' },
      { label: 'Practice article', url: 'https://www.geeksforgeeks.org/' },
    ],
    quiz: [
      {
        question: `What is the main goal of ${title}?`,
        options: ['Memorize only', 'Apply a concept progressively', 'Skip practice', 'Avoid examples'],
        answer: 1,
      },
    ],
  }
}

function course(seed) {
  const modules = learningPath(seed.topic)
  const lessons = modules.flatMap((module) => module.lessons)
  return {
    id: seed.id,
    title: seed.title,
    thumbnail: seed.image,
    image: seed.image,
    trailer: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    instructorId: seed.instructorId,
    instructor: seed.instructor,
    instructorBio: `${seed.instructor} brings celebrity-level discipline, craft, and industry insight into practical learning.`,
    category: seed.category,
    description: seed.description,
    duration: `${Math.round(lessons.reduce((sum, item) => sum + item.durationMinutes, 0) / 60)}h ${lessons.reduce((sum, item) => sum + item.durationMinutes, 0) % 60}m`,
    level: seed.level,
    tags: seed.tags,
    modules,
    lessons,
    outcomes: [
      `Build a clear foundation in ${seed.topic}.`,
      'Practice with guided examples, quizzes, notes, and resource packs.',
      'Complete a project-based advanced module.',
      'Earn a verified completion certificate after finishing all lessons.',
    ],
    faq: [
      { q: 'Do I need prior experience?', a: 'Beginner modules start from first principles, then the path progresses step by step.' },
      { q: 'Is there a certificate?', a: 'Yes. Certificates unlock automatically after 100% completion.' },
    ],
    reviews: [
      { id: id('review'), name: 'Aarav M.', rating: 5, feedback: 'Structured, cinematic, and practical enough to use immediately.' },
      { id: id('review'), name: 'Mira S.', rating: 4.8, feedback: 'The module progression feels like a real learning path.' },
    ],
    status: 'published',
    createdAt: now(),
  }
}

const seedCourses = [
  course({ id: 'react-mastery', title: 'React Interfaces for Fan Engagement', topic: 'React', instructorId: 'instructor_1', instructor: 'Sachin Tendulkar', category: 'Web Development', level: 'Beginner', tags: ['react', 'routing', 'redux', 'apis'], image: 'https://images.unsplash.com/photo-1510511457681-2b7a53d09ef3?auto=format&fit=crop&w=900&q=80', description: 'Master React through components, props, state, hooks, routing, API calls, Redux, authentication, and a complete project.' }),
  course({ id: 'node-live-scores', title: 'Node.js Backend for Live Scores', topic: 'Node.js', instructorId: 'instructor_2', instructor: 'Jasprit Bumrah', category: 'Programming', level: 'Advanced', tags: ['node', 'express', 'mongodb', 'security'], image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981d?auto=format&fit=crop&w=900&q=80', description: 'Build scalable Express APIs, real-time events, secure authentication, and database-backed services.' }),
  course({ id: 'python-cricket-analytics', title: 'Python for Cricket Data Analytics', topic: 'Python Analytics', instructorId: 'instructor_3', instructor: 'Virat Kohli', category: 'Data Science', level: 'Beginner', tags: ['python', 'data', 'charts', 'analytics'], image: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80', description: 'Learn Python fundamentals while building cricket analytics notebooks, charts, and predictive insights.' }),
  course({ id: 'uiux-premium-products', title: 'UI/UX Design for Premium Products', topic: 'UI/UX Design', instructorId: 'instructor_4', instructor: 'Priyanka Chopra', category: 'Design', level: 'Intermediate', tags: ['design', 'research', 'prototyping'], image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=900&q=80', description: 'Craft cinematic interfaces, polished systems, and conversion-focused product experiences.' }),
  course({ id: 'ai-talent-development', title: 'AI Systems for Talent Development', topic: 'AI Systems', instructorId: 'instructor_5', instructor: 'Hardik Pandya', category: 'AI', level: 'Advanced', tags: ['ai', 'recommendations', 'ml'], image: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80', description: 'Build recommendation engines, coaching flows, and prediction systems for high-performance teams.' }),
]

async function initialDb() {
  return {
    users: [
      { id: 'learner_1', email: 'student@example.com', username: 'student_user', fullName: 'Student User', password: await bcrypt.hash('password123', 10), role: 'learner', avatar: '', bio: 'Learning with celebrity mentors.', refreshTokens: [], createdAt: now() },
      { id: 'instructor_1', email: 'instructor@example.com', username: 'instructor_user', fullName: 'Instructor User', password: await bcrypt.hash('password123', 10), role: 'instructor', avatar: '', bio: 'Celebrity Academy instructor.', refreshTokens: [], createdAt: now() },
      { id: 'admin_1', email: 'admin@example.com', username: 'admin_user', fullName: 'Admin User', password: await bcrypt.hash('password123', 10), role: 'admin', avatar: '', bio: 'Platform administrator.', refreshTokens: [], createdAt: now() },
    ],
    courses: seedCourses,
    enrollments: [],
    progress: [],
    notifications: [
      { id: id('notice'), userId: 'learner_1', title: 'Welcome to Celebrity Academy', body: 'Your premium learning workspace is ready.', read: false, createdAt: now() },
    ],
    otps: [],
    discussions: seedCourses.map((item) => ({ id: id('thread'), courseId: item.id, title: `${item.title} discussion`, authorId: 'learner_1', body: 'Share questions, notes, and project wins here.', likes: [], replies: [], createdAt: now() })),
    certificates: [],
    wishlist: [],
  }
}

let db
let sqliteDb

async function loadDb() {
  mkdirSync(DATA_DIR, { recursive: true })
  
  // Initialize SQLite database
  sqliteDb = new Database(DB_FILE)
  
  // Create tables if they don't exist
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      fullName TEXT NOT NULL,
      password TEXT,
      role TEXT DEFAULT 'learner',
      avatar TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      provider TEXT DEFAULT 'local',
      refreshTokens TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      thumbnail TEXT,
      image TEXT,
      trailer TEXT,
      instructorId TEXT,
      instructor TEXT,
      instructorBio TEXT,
      category TEXT,
      description TEXT,
      duration TEXT,
      level TEXT,
      tags TEXT,
      modules TEXT,
      lessons TEXT,
      outcomes TEXT,
      faq TEXT,
      reviews TEXT
    );
    
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
      progress REAL DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      UNIQUE(userId, courseId)
    );
    
    CREATE TABLE IF NOT EXISTS progress (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      lessonId TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      watched REAL DEFAULT 0,
      notes TEXT,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, courseId, lessonId)
    );
    
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      otpHash TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS discussions (
      id TEXT PRIMARY KEY,
      courseId TEXT NOT NULL,
      title TEXT NOT NULL,
      authorId TEXT NOT NULL,
      body TEXT NOT NULL,
      likes TEXT DEFAULT '[]',
      replies TEXT DEFAULT '[]',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      courseId TEXT NOT NULL,
      issuedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      certificateUrl TEXT
    );
  `)
  
  // Migrate data from JSON if needed
  if (!existsSync(DATA_FILE)) {
    db = await initialDb()
    migrateJsonToSqlite(db)
    saveDb() // Keep JSON for other data
  } else {
    db = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
    migrateJsonToSqlite(db)
  }
}

function migrateJsonToSqlite(jsonDb) {
  // Migrate users
  const insertUser = sqliteDb.prepare(`
    INSERT OR IGNORE INTO users (id, email, username, fullName, password, role, avatar, phone, bio, provider, refreshTokens, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  for (const user of jsonDb.users) {
    insertUser.run(
      user.id,
      user.email,
      user.username,
      user.fullName,
      user.password,
      user.role,
      user.avatar || '',
      user.phone || '',
      user.bio || '',
      user.provider || 'local',
      JSON.stringify(user.refreshTokens || []),
      user.createdAt || now()
    )
  }
  
  // Migrate courses
  const insertCourse = sqliteDb.prepare(`
    INSERT OR IGNORE INTO courses (id, title, thumbnail, image, trailer, instructorId, instructor, instructorBio, category, description, duration, level, tags, modules, lessons, outcomes, faq, reviews)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  for (const course of jsonDb.courses) {
    insertCourse.run(
      course.id,
      course.title,
      course.thumbnail,
      course.image,
      course.trailer,
      course.instructorId,
      course.instructor,
      course.instructorBio,
      course.category,
      course.description,
      course.duration,
      course.level,
      JSON.stringify(course.tags || []),
      JSON.stringify(course.modules || []),
      JSON.stringify(course.lessons || []),
      JSON.stringify(course.outcomes || []),
      JSON.stringify(course.faq || []),
      JSON.stringify(course.reviews || [])
    )
  }
  
  // Similarly for other tables...
  // For brevity, I'll focus on users for now, but you can add others
}

function saveDb() {
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8')
}

async function seedMongoUsers() {
  const count = await AuthUser.countDocuments()
  if (count > 0) return
  await AuthUser.insertMany(db.users.map((user) => ({ ...user, email: user.email.toLowerCase() })))
}

async function findUserByEmail(email) {
  if (!email) return null
  if (mongoUsersEnabled) return AuthUser.findOne({ email: String(email).toLowerCase() })
  
  const stmt = sqliteDb.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
  const row = stmt.get(email)
  if (row) {
    row.refreshTokens = JSON.parse(row.refreshTokens || '[]')
    return row
  }
  return null
}

async function findUserById(userId) {
  if (mongoUsersEnabled) return AuthUser.findOne({ id: userId })
  
  const stmt = sqliteDb.prepare('SELECT * FROM users WHERE id = ?')
  const row = stmt.get(userId)
  if (row) {
    row.refreshTokens = JSON.parse(row.refreshTokens || '[]')
    return row
  }
  return null
}

async function createUser(user) {
  if (mongoUsersEnabled) return AuthUser.create(user)
  
  const stmt = sqliteDb.prepare(`
    INSERT INTO users (id, email, username, fullName, password, role, avatar, phone, bio, provider, refreshTokens, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(
    user.id,
    user.email,
    user.username,
    user.fullName,
    user.password,
    user.role || 'learner',
    user.avatar || '',
    user.phone || '',
    user.bio || '',
    user.provider || 'local',
    JSON.stringify(user.refreshTokens || []),
    user.createdAt || now()
  )
  return user
}

async function persistUser(user) {
  if (mongoUsersEnabled && typeof user.save === 'function') return user.save()
  
  const stmt = sqliteDb.prepare(`
    UPDATE users SET 
      email = ?, username = ?, fullName = ?, password = ?, role = ?, avatar = ?, phone = ?, bio = ?, provider = ?, refreshTokens = ?, createdAt = ?
    WHERE id = ?
  `)
  stmt.run(
    user.email,
    user.username,
    user.fullName,
    user.password,
    user.role,
    user.avatar,
    user.phone,
    user.bio,
    user.provider,
    JSON.stringify(user.refreshTokens || []),
    user.createdAt,
    user.id
  )
  return user
}

async function listUsers() {
  if (mongoUsersEnabled) return AuthUser.find().sort({ createdAt: -1 })
  
  const stmt = sqliteDb.prepare('SELECT * FROM users ORDER BY createdAt DESC')
  const rows = stmt.all()
  return rows.map(row => {
    row.refreshTokens = JSON.parse(row.refreshTokens || '[]')
    return row
  })
}

function signAccess(user) {
  return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' })
}

function signRefresh(user) {
  return jwt.sign({ userId: user.id, role: user.role, tokenId: id('refresh') }, REFRESH_SECRET, { expiresIn: '7d' })
}

function authenticate(req, res, next) {
  const bearer = req.headers.authorization?.split(' ')[1]
  const token = bearer || req.cookies.accessToken
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' })
  try {
    req.auth = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.auth.role)) return res.status(403).json({ success: false, message: 'Access denied' })
    next()
  }
}

function attachTokens(res, user, rememberMe = false) {
  const token = signAccess(user)
  const refreshToken = signRefresh(user)
  user.refreshTokens = [...(user.refreshTokens || []), refreshToken].slice(-5)
  res.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 })
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000 })
  return { token, refreshToken }
}

async function sendOtpEmail(email, otp) {
  const html = `
    <div style="background:#020617;color:#e2e8f0;font-family:Inter,Arial,sans-serif;padding:32px">
      <div style="max-width:560px;margin:auto;border:1px solid #1e293b;border-radius:24px;padding:32px;background:#0f172a">
        <div style="font-size:22px;font-weight:800;color:#67e8f9">Celebrity Academy</div>
        <h1 style="color:white">Password reset OTP</h1>
        <p>Use this secure code to reset your password. It expires in 5 minutes.</p>
        <div style="letter-spacing:10px;font-size:40px;font-weight:900;color:#020617;background:#67e8f9;border-radius:18px;text-align:center;padding:18px">${otp}</div>
        <p style="font-size:13px;color:#94a3b8">If you did not request this, ignore the email and keep your password unchanged.</p>
      </div>
    </div>`
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log(`Development OTP for ${email}: ${otp}`)
    return true
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  })
  await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: 'Celebrity Academy password reset OTP', html })
  return true
}

function courseWithComputedProgress(courseItem, userId) {
  const enrollment = db.enrollments.find((item) => item.userId === userId && item.courseId === courseItem.id)
  const progress = db.progress.filter((item) => item.userId === userId && item.courseId === courseItem.id && item.completed)
  const total = courseItem.lessons.length || 1
  return { ...courseItem, enrolled: db.enrollments.filter((item) => item.courseId === courseItem.id).length, rating: 4.8, isEnrolled: Boolean(enrollment), progressPercent: Math.round((progress.length / total) * 100) }
}

await loadDb()

if (process.env.MONGODB_URI) {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 1500 })
    mongoUsersEnabled = true
    await seedMongoUsers()
    console.log('MongoDB connected for user database')
  } catch (error) {
    console.warn('MongoDB connection skipped:', error.message)
  }
}

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: CLIENT_URL, credentials: true } })

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:4000'], credentials: true }))
app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))
app.use(cookieParser())
app.use(mongoSanitize())
app.use(xss())
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 250 }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 40 }))

io.on('connection', (socket) => {
  socket.on('join', (userId) => socket.join(userId))
})

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Celebrity Academy API running', database: mongoUsersEnabled ? 'mongodb' : 'local-json' }))

app.post('/api/auth/register', async (req, res) => {
  const { email, password, username, fullName, role = 'learner', rememberMe = true } = req.body
  if (!email || !password || !username || !fullName) return res.status(400).json({ success: false, message: 'All fields are required' })
  if (!['learner', 'instructor', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' })
  if (await findUserByEmail(email)) return res.status(409).json({ success: false, message: 'Email already registered' })
  const user = { id: id(role), email: email.toLowerCase(), username, fullName, password: await bcrypt.hash(password, 10), role, avatar: '', bio: '', refreshTokens: [], createdAt: now() }
  const savedUser = await createUser(user)
  const tokens = attachTokens(res, savedUser, rememberMe)
  await persistUser(savedUser)
  res.status(201).json({ success: true, message: 'Registration successful', ...tokens, user: publicUser(savedUser) })
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role, rememberMe = false } = req.body
  const user = await findUserByEmail(email)
  if (!user || !(await bcrypt.compare(password || '', user.password))) return res.status(401).json({ success: false, message: 'Invalid credentials' })
  if (role && user.role !== role) return res.status(403).json({ success: false, message: `This account is registered as ${user.role}` })
  const tokens = attachTokens(res, user, rememberMe)
  await persistUser(user)
  res.json({ success: true, message: 'Login successful', ...tokens, user: publicUser(user) })
})

app.post('/api/auth/google', async (req, res) => {
  const { email, fullName, avatar, role = 'learner' } = req.body
  if (!email) return res.status(400).json({ success: false, message: 'Google email is required' })
  let user = await findUserByEmail(email)
  if (!user) {
    user = { id: id(role), email: email.toLowerCase(), username: email.split('@')[0], fullName: fullName || email.split('@')[0], password: '', role, avatar: avatar || '', bio: '', refreshTokens: [], provider: 'google', createdAt: now() }
    user = await createUser(user)
  }
  const tokens = attachTokens(res, user, true)
  await persistUser(user)
  res.json({ success: true, message: 'Google login successful', ...tokens, user: publicUser(user) })
})

app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET)
    const user = await findUserById(decoded.userId)
    if (!user?.refreshTokens?.includes(refreshToken)) throw new Error('Invalid refresh')
    if (!user) throw new Error('Invalid refresh')
    const token = signAccess(user)
    res.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 15 * 60 * 1000 })
    res.json({ success: true, token, user: publicUser(user) })
  } catch {
    res.status(401).json({ success: false, message: 'Refresh token expired' })
  }
})

app.post('/api/auth/logout', authenticate, async (req, res) => {
  const user = await findUserById(req.auth.userId)
  if (user) user.refreshTokens = []
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  if (user) await persistUser(user)
  res.json({ success: true, message: 'Logged out' })
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body
  const user = await findUserByEmail(email)
  if (!user) return res.status(404).json({ success: false, message: 'Email is not registered' })
  const recent = db.otps.find((item) => item.email === user.email && item.cooldownUntil > Date.now())
  if (recent) return res.status(429).json({ success: false, message: 'Please wait before resending OTP', cooldownUntil: recent.cooldownUntil })
  const otp = `${crypto.randomInt(100000, 999999)}`
  db.otps = db.otps.filter((item) => item.email !== user.email)
  db.otps.push({ id: id('otp'), email: user.email, otpHash: hashOtp(otp), attempts: 0, expiresAt: Date.now() + 5 * 60 * 1000, cooldownUntil: Date.now() + 60 * 1000, createdAt: now() })
  await sendOtpEmail(user.email, otp)
  saveDb()
  res.json({ success: true, message: 'OTP sent to your email', cooldownSeconds: 60 })
})

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body
  const record = db.otps.find((item) => item.email.toLowerCase() === String(email || '').toLowerCase())
  if (!record) return res.status(400).json({ success: false, message: 'No active OTP found' })
  if (Date.now() > record.expiresAt) {
    db.otps = db.otps.filter((item) => item.id !== record.id)
    saveDb()
    return res.status(400).json({ success: false, message: 'OTP expired' })
  }
  if (record.attempts >= 3) return res.status(429).json({ success: false, message: 'Maximum OTP attempts reached' })
  if (record.otpHash !== hashOtp(String(otp || ''))) {
    record.attempts += 1
    saveDb()
    return res.status(400).json({ success: false, message: `Invalid OTP. ${3 - record.attempts} attempts left` })
  }
  db.otps = db.otps.filter((item) => item.id !== record.id)
  const resetToken = jwt.sign({ email: record.email, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '15m' })
  saveDb()
  res.json({ success: true, message: 'OTP verified', resetToken })
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const decoded = jwt.verify(req.body.resetToken, JWT_SECRET)
    if (decoded.purpose !== 'password-reset') throw new Error('Invalid purpose')
    const user = await findUserByEmail(decoded.email)
    user.password = await bcrypt.hash(req.body.newPassword, 10)
    user.refreshTokens = []
    await persistUser(user)
    res.json({ success: true, message: 'Password reset successful' })
  } catch {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
  }
})

app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await findUserById(req.auth.userId)
    
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'Cannot change password for OAuth accounts' })
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }
    
    user.password = await bcrypt.hash(newPassword, 10)
    user.refreshTokens = [] // Invalidate all refresh tokens for security
    await persistUser(user)
    
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password' })
  }
})

app.get('/api/users/me', authenticate, async (req, res) => {
  const user = await findUserById(req.auth.userId)
  res.json({ success: true, user: publicUser(user) })
})

app.put('/api/users/profile', authenticate, async (req, res) => {
  const user = await findUserById(req.auth.userId)
  Object.assign(user, { fullName: req.body.fullName ?? user.fullName, phone: req.body.phone ?? user.phone, bio: req.body.bio ?? user.bio, avatar: req.body.avatar ?? user.avatar })
  await persistUser(user)
  res.json({ success: true, message: 'Profile updated', user: publicUser(user) })
})

app.get('/api/courses', (req, res) => {
  const q = String(req.query.q || '').toLowerCase()
  const category = req.query.category || 'All'
  const level = req.query.level || 'All'
  const offset = Number(req.query.offset || 0)
  const limit = Number(req.query.limit || 9)
  const userId = req.headers.authorization ? jwt.decode(req.headers.authorization.split(' ')[1])?.userId : null
  let courses = db.courses.filter((item) => item.status === 'published')
  if (q) courses = courses.filter((item) => `${item.title} ${item.instructor} ${item.category} ${item.tags.join(' ')}`.toLowerCase().includes(q))
  if (category !== 'All') courses = courses.filter((item) => item.category === category)
  if (level !== 'All') courses = courses.filter((item) => item.level === level)
  const mapped = courses.map((item) => courseWithComputedProgress(item, userId))
  res.json({
    success: true,
    courses: mapped.slice(offset, offset + limit),
    total: mapped.length,
    categories: ['All', ...new Set(db.courses.map((item) => item.category))],
    levels: ['All', 'Beginner', 'Intermediate', 'Advanced'],
    trending: mapped.slice(0, 3),
    recommended: mapped.slice().reverse().slice(0, 3),
  })
})

app.get('/api/courses/search/suggest', (req, res) => {
  const q = String(req.query.q || '').toLowerCase()
  const suggestions = db.courses
    .filter((item) => !q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q))
    .slice(0, 7)
    .map((item) => ({ id: item.id, title: item.title, category: item.category }))
  res.json({ success: true, suggestions })
})

app.get('/api/courses/:courseId', (req, res) => {
  const courseItem = db.courses.find((item) => item.id === req.params.courseId)
  if (!courseItem) return res.status(404).json({ success: false, message: 'Course not found' })
  res.json({ success: true, course: courseWithComputedProgress(courseItem, null), discussions: db.discussions.filter((item) => item.courseId === courseItem.id), related: db.courses.filter((item) => item.category === courseItem.category && item.id !== courseItem.id).slice(0, 3) })
})

app.post('/api/courses', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
  const instructor = await findUserById(req.auth.userId)
  const newCourse = course({ id: id('course'), title: req.body.title, topic: req.body.title, instructorId: req.auth.userId, instructor: instructor?.fullName || 'Instructor', category: req.body.category || 'General', level: req.body.level || 'Beginner', tags: req.body.tags || [], image: req.body.thumbnail || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80', description: req.body.description || 'A structured Celebrity Academy course.' })
  newCourse.status = req.auth.role === 'admin' ? 'published' : 'pending'
  db.courses.unshift(newCourse)
  saveDb()
  res.status(201).json({ success: true, message: 'Course created', course: newCourse })
})

app.post('/api/enrollments/:courseId', authenticate, authorize(['learner', 'admin']), (req, res) => {
  const courseItem = db.courses.find((item) => item.id === req.params.courseId)
  if (!courseItem) return res.status(404).json({ success: false, message: 'Course not found' })
  let enrollment = db.enrollments.find((item) => item.userId === req.auth.userId && item.courseId === courseItem.id)
  if (!enrollment) {
    enrollment = { id: id('enroll'), userId: req.auth.userId, courseId: courseItem.id, enrolledAt: now(), progressPercent: 0 }
    db.enrollments.push(enrollment)
    db.notifications.unshift({ id: id('notice'), userId: req.auth.userId, title: 'Enrollment confirmed', body: `You enrolled in ${courseItem.title}.`, read: false, createdAt: now() })
    io.to(req.auth.userId).emit('notification:new', db.notifications[0])
  }
  saveDb()
  res.status(201).json({ success: true, message: 'Enrollment active', enrollment })
})

app.get('/api/enrollments/me', authenticate, (req, res) => {
  const enrollments = db.enrollments.filter((item) => item.userId === req.auth.userId).map((item) => ({ ...item, course: courseWithComputedProgress(db.courses.find((courseItem) => courseItem.id === item.courseId), req.auth.userId) }))
  res.json({ success: true, enrollments })
})

app.get('/api/progress/:courseId', authenticate, (req, res) => {
  const items = db.progress.filter((item) => item.userId === req.auth.userId && item.courseId === req.params.courseId)
  res.json({ success: true, progress: items })
})

app.post('/api/progress/:courseId/:lessonId', authenticate, (req, res) => {
  const { courseId, lessonId } = req.params
  let record = db.progress.find((item) => item.userId === req.auth.userId && item.courseId === courseId && item.lessonId === lessonId)
  if (!record) {
    record = { id: id('progress'), userId: req.auth.userId, courseId, lessonId, completed: false, secondsWatched: 0, notes: '', updatedAt: now() }
    db.progress.push(record)
  }
  Object.assign(record, { completed: Boolean(req.body.completed ?? record.completed), secondsWatched: Number(req.body.secondsWatched ?? record.secondsWatched), notes: req.body.notes ?? record.notes, updatedAt: now() })
  const courseItem = db.courses.find((item) => item.id === courseId)
  const completedCount = db.progress.filter((item) => item.userId === req.auth.userId && item.courseId === courseId && item.completed).length
  const progressPercent = Math.round((completedCount / courseItem.lessons.length) * 100)
  const enrollment = db.enrollments.find((item) => item.userId === req.auth.userId && item.courseId === courseId)
  if (enrollment) enrollment.progressPercent = progressPercent
  if (progressPercent === 100 && !db.certificates.some((item) => item.userId === req.auth.userId && item.courseId === courseId)) {
    db.certificates.push({ id: id('cert'), userId: req.auth.userId, courseId, title: courseItem.title, issuedAt: now(), verificationCode: crypto.randomBytes(5).toString('hex').toUpperCase() })
  }
  saveDb()
  res.json({ success: true, message: 'Progress saved', progress: record, progressPercent })
})

app.get('/api/dashboard', authenticate, (req, res) => {
  const enrollments = db.enrollments.filter((item) => item.userId === req.auth.userId)
  const certificates = db.certificates.filter((item) => item.userId === req.auth.userId)
  const completed = db.progress.filter((item) => item.userId === req.auth.userId && item.completed).length
  res.json({
    success: true,
    stats: { enrolledCourses: enrollments.length, completedLessons: completed, certificates: certificates.length, streakDays: completed ? 3 : 0 },
    enrollments: enrollments.map((item) => ({ ...item, course: courseWithComputedProgress(db.courses.find((courseItem) => courseItem.id === item.courseId), req.auth.userId) })),
    notifications: db.notifications.filter((item) => item.userId === req.auth.userId).slice(0, 8),
    recommendations: db.courses.slice(0, 4).map((item) => courseWithComputedProgress(item, req.auth.userId)),
  })
})

app.get('/api/discussions', (req, res) => res.json({ success: true, discussions: db.discussions }))
app.post('/api/discussions', authenticate, (req, res) => {
  const thread = { id: id('thread'), courseId: req.body.courseId || null, title: req.body.title, body: req.body.body, authorId: req.auth.userId, likes: [], replies: [], createdAt: now() }
  db.discussions.unshift(thread)
  saveDb()
  res.status(201).json({ success: true, discussion: thread })
})
app.post('/api/discussions/:id/replies', authenticate, (req, res) => {
  const thread = db.discussions.find((item) => item.id === req.params.id)
  thread.replies.push({ id: id('reply'), authorId: req.auth.userId, body: req.body.body, likes: [], createdAt: now() })
  saveDb()
  res.json({ success: true, discussion: thread })
})

app.get('/api/certificates', authenticate, (req, res) => res.json({ success: true, certificates: db.certificates.filter((item) => item.userId === req.auth.userId) }))
app.get('/api/certificates/:id/download', authenticate, (req, res) => {
  const cert = db.certificates.find((item) => item.id === req.params.id && item.userId === req.auth.userId)
  if (!cert) return res.status(404).send('Certificate not found')
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Content-Disposition', `attachment; filename="${cert.title.replace(/\W+/g, '-')}-certificate.html"`)
  res.send(`<html><body style="font-family:Arial;background:#020617;color:#fff;padding:60px;text-align:center"><h1>Celebrity Academy</h1><h2>Certificate of Completion</h2><p>This certifies successful completion of</p><h3>${cert.title}</h3><p>Verification: ${cert.verificationCode}</p><p>Issued: ${cert.issuedAt}</p></body></html>`)
})

app.get('/api/admin/summary', authenticate, authorize(['admin']), async (req, res) => {
  const users = await listUsers()
  res.json({ success: true, users: users.map(publicUser), pendingCourses: db.courses.filter((item) => item.status === 'pending'), reports: [], analytics: { users: users.length, courses: db.courses.length, enrollments: db.enrollments.length, certificates: db.certificates.length } })
})
app.patch('/api/admin/courses/:courseId/status', authenticate, authorize(['admin']), (req, res) => {
  const courseItem = db.courses.find((item) => item.id === req.params.courseId)
  courseItem.status = req.body.status || 'published'
  saveDb()
  res.json({ success: true, course: courseItem })
})

app.get('/api/instructor/analytics', authenticate, authorize(['instructor', 'admin']), (req, res) => {
  const courses = db.courses.filter((item) => req.auth.role === 'admin' || item.instructorId === req.auth.userId)
  res.json({ success: true, courses, analytics: courses.map((item) => ({ courseId: item.id, title: item.title, learners: db.enrollments.filter((enroll) => enroll.courseId === item.id).length, discussions: db.discussions.filter((thread) => thread.courseId === item.id).length })) })
})

httpServer.listen(PORT, () => {
  console.log(`Celebrity Academy API running on http://localhost:${PORT}`)
})

export default app
