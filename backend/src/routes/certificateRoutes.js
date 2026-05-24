import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: req.user.role === 'admin' ? {} : { userId: req.user.id },
      include: { course: true, user: { select: { id: true, name: true, email: true } } },
      orderBy: { issuedAt: 'desc' },
    })
    res.json({ success: true, certificates })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' && req.body.userId ? req.body.userId : req.user.id
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId: req.body.courseId,
        certificateNo: `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      },
    })
    res.status(201).json({ success: true, certificate })
  } catch (error) {
    next(error)
  }
})

export default router
