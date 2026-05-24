import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const personalities = await prisma.aIPersonality.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    res.json({ success: true, personalities })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const personality = await prisma.aIPersonality.create({ data: req.body })
    res.status(201).json({ success: true, personality })
  } catch (error) {
    next(error)
  }
})

export default router
