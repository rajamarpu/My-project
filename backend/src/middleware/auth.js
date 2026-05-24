import { prisma } from '../config/prisma.js'
import { publicUser, verifyToken } from '../utils/tokens.js'

const roleMap = {
  STUDENT: 'learner',
  TEACHER: 'instructor',
  ADMIN: 'admin',
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' })

    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User session is no longer valid.' })
    }

    req.user = publicUser(user)
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
}

export function requireRole(...roles) {
  const normalizedRoles = roles.map((role) => {
    const r = String(role).toUpperCase()
    return roleMap[r] || r.toLowerCase()
  })
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' })
    if (!normalizedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' })
    }
    next()
  }
}

export function requestLogger(req, res, next) {
  const startedAt = Date.now()
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`))
  next()
}
