import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: req.user.role === 'admin' ? {} : { userId: req.user.id },
      include: {
        course: { include: { createdBy: { select: { id: true, name: true, email: true, expertise: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })
    res.json({ success: true, certificates })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const userId = Number(req.body.userId)
    const courseId = String(req.body.courseId || '').trim()
    if (!Number.isInteger(userId) || !courseId) {
      return res.status(400).json({ success: false, message: 'Learner and course are required.' })
    }

    const [learner, course] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId, role: 'USER' }, select: { id: true } }),
      prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    ])
    if (!learner) return res.status(404).json({ success: false, message: 'Learner not found.' })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const certificateNo = String(req.body.certificateNo || '').trim() || `UPTO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    const certificate = await prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        certificateNo,
        status: 'ISSUED',
        issuedAt: req.body.issuedAt ? new Date(req.body.issuedAt) : new Date(),
      },
      create: {
        userId,
        courseId,
        certificateNo,
        issuedAt: req.body.issuedAt ? new Date(req.body.issuedAt) : undefined,
      },
      include: {
        course: { include: { createdBy: { select: { id: true, name: true, email: true, expertise: true } } } },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    res.status(201).json({ success: true, certificate })
  } catch (error) {
    next(error)
  }
})

export default router
