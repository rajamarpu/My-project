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
app.use('/uploads', express.static(uploadsDir, {
  setHeaders(res, filePath) {
    if (!filePath.endsWith('.html')) return
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; media-src 'self' data: blob:; frame-ancestors 'self' http://localhost:4000 http://localhost:5173 http://localhost:5174",
    )
  },
}))

app.get('/uploads/:fileName', async (req, res, next) => {
  try {
    const fileName = String(req.params.fileName || '')
    if (!/^ai-video-[a-z0-9-]+\.html$/i.test(fileName)) return next()

    const uploadUrl = `/uploads/${fileName}`
    let lesson = await prisma.lesson.findFirst({
      where: { videoUrl: uploadUrl },
      include: { course: { select: { title: true, thumbnailUrl: true, createdBy: { select: { name: true } } } } },
    })

    if (!lesson) {
      const aiLessons = await prisma.lesson.findMany({
        include: { course: { select: { title: true, thumbnailUrl: true, createdBy: { select: { name: true } } } } },
        take: 500,
      })
      lesson = aiLessons.find((item) => {
        const variants = item.quizJson?.aiVideo?.instructorVideos
        return Array.isArray(variants) && variants.some((variant) => variant?.videoUrl === uploadUrl)
      })
    }

    if (!lesson) return next()

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; media-src 'self' data: blob:; frame-ancestors 'self' http://localhost:4000 http://localhost:5173 http://localhost:5174",
    )
    res.type('html').send(renderAiLessonFallbackHtml(lesson, uploadUrl))
  } catch (error) {
    next(error)
  }
})
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

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderAiLessonFallbackHtml(lesson, uploadUrl) {
  const aiVideo = lesson.quizJson?.aiVideo || {}
  const variants = Array.isArray(aiVideo.instructorVideos) ? aiVideo.instructorVideos : []
  const activeVariant = variants.find((variant) => variant?.videoUrl === uploadUrl) || variants[0] || {}
  const title = lesson.title || 'AI narrated lesson'
  const courseTitle = lesson.course?.title || 'Course lesson'
  const instructorName = activeVariant.instructorName || lesson.course?.createdBy?.name || 'Generated narrator'
  const script = aiVideo.script || lesson.description || 'Narration script is not available for this generated lesson.'
  const imageUrl = activeVariant.imageUrl || lesson.course?.thumbnailUrl || '/favicon.svg'
  const payload = JSON.stringify({ title, courseTitle, instructorName, script }).replace(/</g, '\\u003c')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; background: #020617; color: #f8fafc; display: grid; place-items: center; }
    main { width: min(100vw, 1280px); aspect-ratio: 16 / 9; overflow: hidden; background: radial-gradient(circle at 16% 10%, rgba(6,182,212,.24), transparent 30%), #020617; display: grid; grid-template-columns: minmax(0, .82fr) minmax(20rem, .5fr); }
    .stage { position: relative; display: grid; place-items: center; padding: 48px; }
    .avatar { width: min(34vw, 320px); aspect-ratio: 1; overflow: hidden; border-radius: 28px; border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.06); box-shadow: 0 24px 80px rgba(8,145,178,.24); }
    .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .panel { border-left: 1px solid rgba(255,255,255,.12); background: rgba(15,23,42,.86); padding: 34px; display: flex; flex-direction: column; justify-content: center; }
    .eyebrow { color: #67e8f9; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 900; }
    h1 { margin: 12px 0 0; font-size: clamp(24px, 3vw, 42px); line-height: 1.06; }
    .course { margin-top: 12px; color: rgba(248,250,252,.72); font-size: 14px; line-height: 1.6; }
    .script { margin-top: 22px; max-height: 170px; overflow: auto; color: rgba(248,250,252,.78); font-size: 14px; line-height: 1.7; }
    button { margin-top: 24px; width: fit-content; border: 0; border-radius: 12px; background: #f8fafc; color: #020617; padding: 12px 16px; font-weight: 900; cursor: pointer; }
    .status { min-height: 18px; margin-top: 12px; color: rgba(248,250,252,.56); font-size: 12px; }
    @media (max-width: 820px) {
      main { min-height: 100vh; aspect-ratio: auto; grid-template-columns: 1fr; }
      .panel { border-left: 0; border-top: 1px solid rgba(255,255,255,.12); }
      .avatar { width: min(58vw, 280px); }
    }
  </style>
</head>
<body>
  <main>
    <section class="stage">
      <div class="avatar"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(instructorName)}" /></div>
    </section>
    <section class="panel">
      <p class="eyebrow">${escapeHtml(instructorName)} narration</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="course">${escapeHtml(courseTitle)}</p>
      <div class="script">${escapeHtml(script)}</div>
      <button type="button" id="play">Preview narration</button>
      <p class="status" id="status">Generated lesson fallback loaded from saved course metadata.</p>
    </section>
  </main>
  <script>
    const lesson = ${payload};
    document.getElementById('play').addEventListener('click', () => {
      if (!('speechSynthesis' in window)) {
        document.getElementById('status').textContent = 'Speech preview is not available in this browser.';
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lesson.script);
      utterance.rate = 1;
      utterance.pitch = 1.02;
      document.getElementById('status').textContent = 'Preview narration playing.';
      window.speechSynthesis.speak(utterance);
    });
  </script>
</body>
</html>`
}

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
