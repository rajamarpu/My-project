import './loadEnv.js'
import express from 'express'
import http from 'http'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { Server } from 'socket.io'
import { prisma, connectPrisma } from './config/prisma.js'
import authRoutes from './routes/authRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import personalityRoutes from './routes/personalityRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import chatRoutes from './routes/chatRoutes.v2.js'
import certificateRoutes from './routes/certificateRoutes.js'
import questionRoutes from './routes/questionRoutes.js'
import assessmentRoutes from './routes/assessmentRoutes.js'
import { publicUser, verifyToken } from './utils/tokens.js'
import { requireAuth, requestLogger } from './middleware/auth.js'

const app = express()
const server = http.createServer(app)
const port = Number(process.env.API_PORT || process.env.PORT || 5000)
const uploadsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/uploads')
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const isProduction = process.env.NODE_ENV === 'production'
const apiRateLimit = Number(process.env.API_RATE_LIMIT || (isProduction ? 300 : 2000))
const authRateLimit = Number(process.env.AUTH_RATE_LIMIT || (isProduction ? 60 : 500))
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000)

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
})

io.use((socket, next) => {
  try {
    const payload = verifyToken(socket.handshake.auth?.token || '')
    socket.userId = payload.sub
    socket.userRole = payload.role
    next()
  } catch {
    next(new Error('Authentication required'))
  }
})

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId)
    socket.to(roomId).emit('presence', { userId: socket.userId, status: 'online' })
  })

  socket.on('typing', ({ roomId, isTyping = true }) => {
    socket.to(roomId).emit('typing', { userId: socket.userId, isTyping })
  })

  socket.on('send-message', async ({ roomId, courseId, message, body, parentId, emoji }) => {
    const text = String(body || message || '').trim()
    if (!roomId || !text) return
    const saved = await prisma.chatMessage.create({
      data: { roomId, courseId: courseId || null, body: text, parentId: parentId || null, emoji, senderId: socket.userId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    })
    io.to(roomId).emit('new-message', saved)
  })

  socket.on('disconnecting', () => {
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) socket.to(roomId).emit('presence', { userId: socket.userId, status: 'offline' })
    })
  })
})

app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '75mb' }))
app.use('/uploads', express.static(uploadsDir))
app.use(requestLogger)
app.use('/api/auth', rateLimit({
  windowMs: rateLimitWindowMs,
  limit: authRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: 'Too many login attempts. Please wait a minute and try again.',
  }),
}))
app.use('/api', rateLimit({
  windowMs: rateLimitWindowMs,
  limit: apiRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({
    success: false,
    message: 'Too many API requests. Please wait a minute and try again.',
  }),
}))

app.get('/', (_req, res) => {
  res.json({
    success: true,
    service: 'ai-lms-api',
    message: 'Backend is running. Use /api/health for diagnostics.',
    frontend: 'http://localhost:5173',
  })
})

app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ success: true, service: 'ai-lms-api', database: 'postgresql', orm: 'prisma', realtime: 'socket.io' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/stats/summary', async (_req, res, next) => {
  try {
    const [totalUsers, totalLearners, totalInstructors, totalCourses, totalCategories, totalEnrollments] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.category.count(),
      prisma.enrollment.count(),
    ])
    res.json({
      success: true,
      summary: {
        totalUsers,
        totalLearners,
        totalInstructors,
        totalCourses,
        totalCategories,
        totalEnrollments,
      },
    })
  } catch (error) {
    next(error)
  }
})

app.put('/api/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: req.body.name || req.body.fullName || undefined,
        phone: req.body.phone || undefined,
        bio: req.body.bio || undefined,
        avatarUrl: req.body.avatarUrl || undefined,
      },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

app.put('/api/settings', requireAuth, async (req, res, next) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'settings_updated',
        metadata: req.body || {},
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    })
    res.json({ success: true, settings: req.body || {} })
  } catch (error) {
    next(error)
  }
})

app.post('/api/contact', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim()
    const message = String(req.body.message || '').trim()
    if (!email || !message) return res.status(400).json({ success: false, message: 'Email and message are required.' })
    await prisma.activityLog.create({
      data: {
        action: 'contact_submitted',
        entityType: 'contact',
        metadata: { name: req.body.name || '', email, message },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    })
    res.status(201).json({ success: true, message: 'Thanks. We received your message.' })
  } catch (error) {
    next(error)
  }
})

app.get('/api/learner/dashboard', requireAuth, async (req, res, next) => {
  try {
    const [enrollments, progress, certificates, notifications] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId: req.user.id }, include: { course: true } }),
      prisma.progress.findMany({ where: { userId: req.user.id }, orderBy: { lastAccessedAt: 'desc' }, take: 8 }),
      prisma.certificate.findMany({ where: { userId: req.user.id }, include: { course: true } }),
      prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ])
    res.json({ success: true, dashboard: { enrollments, progress, certificates, notifications } })
  } catch (error) {
    next(error)
  }
})

app.post('/api/learner/progress', requireAuth, async (req, res, next) => {
  try {
    const { courseId, lessonId = null, percentComplete = 0, watchedSeconds = 0, quizScore } = req.body
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required.' })
    const progress = await prisma.progress.upsert({
      where: { userId_courseId_lessonId: { userId: req.user.id, courseId, lessonId } },
      update: { percentComplete, watchedSeconds, quizScore, completed: percentComplete >= 100, lastAccessedAt: new Date() },
      create: { userId: req.user.id, courseId, lessonId, percentComplete, watchedSeconds, quizScore, completed: percentComplete >= 100 },
    })
    res.json({ success: true, progress })
  } catch (error) {
    next(error)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/personalities', personalityRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/assessments', assessmentRoutes)

app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` }))

app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.statusCode || (err.name === 'PrismaClientKnownRequestError' ? 400 : 500)
  res.status(status).json({ success: false, message: err.message || 'Internal server error.' })
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing API process or run npm run ports:stop, then npm run backend.`)
    process.exit(1)
  }
  throw error
})

connectPrisma()
  .then(() => server.listen(port, () => console.log(`AI LMS API running at http://localhost:${port}`)))
  .catch((error) => {
    console.error('Failed to start API:', error)
    process.exit(1)
  })
