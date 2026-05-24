import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { normalizeRole, publicUser } from '../utils/tokens.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

router.get('/overview', async (_req, res, next) => {
  try {
    const [totalUsers, courses, enrollments, messages, personalities, certificates, popularCourses] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.chatMessage.count({ where: { isDeleted: false } }),
      prisma.aIPersonality.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: { enrollments: { _count: 'desc' } }, take: 5 }),
      prisma.certificate.count(),
      prisma.course.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: { enrollments: { _count: 'desc' } }, take: 5 }),
    ])

    res.json({
      success: true,
      analytics: {
        totalUsers,
        activeUsers: totalUsers,
        courses,
        enrollments,
        messages,
        certificates,
        personalities,
        popularCourses,
        growth: [
          { month: 'Jan', users: 12 },
          { month: 'Feb', users: 24 },
          { month: 'Mar', users: 44 },
          { month: 'Apr', users: 61 },
          { month: 'May', users: totalUsers },
        ],
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
    res.json({ success: true, users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password = 'Password123', role = 'learner' } = req.body
    const user = await prisma.user.create({
      data: { name, email: String(email).toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: normalizeRole(role) },
    })
    res.status(201).json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        role: req.body.role ? normalizeRole(req.body.role) : undefined,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
      },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.delete('/users/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
