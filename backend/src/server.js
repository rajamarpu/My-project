import './loadEnv.js'
import express from 'express'
import http from 'http'
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
import { verifyToken } from './utils/tokens.js'
import { requestLogger } from './middleware/auth.js'

const app = express()
const server = http.createServer(app)
const port = Number(process.env.API_PORT || process.env.PORT || 5000)
const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

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
app.use(express.json({ limit: '2mb' }))
app.use(requestLogger)
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false }))

app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ success: true, service: 'ai-lms-api', database: 'postgresql', orm: 'prisma', realtime: 'socket.io' })
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

app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` }))

app.use((err, _req, res, _next) => {
  console.error(err)
  const status = err.name === 'PrismaClientKnownRequestError' ? 400 : 500
  res.status(status).json({ success: false, message: err.message || 'Internal server error.' })
})

connectPrisma()
  .then(() => server.listen(port, () => console.log(`AI LMS API running at http://localhost:${port}`)))
  .catch((error) => {
    console.error('Failed to start API:', error)
    process.exit(1)
  })
