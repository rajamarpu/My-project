import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/rooms/:roomId', requireAuth, async (req, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { roomId: req.params.roomId, isDeleted: false },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true, role: true } },
        replies: { where: { isDeleted: false }, include: { sender: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    })
    res.json({ success: true, messages })
  } catch (error) {
    next(error)
  }
})

router.post('/message', requireAuth, async (req, res, next) => {
  try {
    const { roomId, courseId, body, message, parentId, emoji } = req.body
    const text = String(body || message || '').trim()
    if (!roomId || !text) return res.status(400).json({ success: false, message: 'roomId and message are required.' })

    const saved = await prisma.chatMessage.create({
      data: { roomId, courseId: courseId || null, body: text, parentId: parentId || null, emoji, senderId: req.user.id },
      include: { sender: { select: { id: true, name: true, avatarUrl: true, role: true } } },
    })
    res.status(201).json({ success: true, message: saved })
  } catch (error) {
    next(error)
  }
})

router.patch('/message/:id/moderate', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const message = await prisma.chatMessage.update({
      where: { id: req.params.id },
      data: { isDeleted: true, moderatedById: req.user.id },
    })
    res.json({ success: true, message })
  } catch (error) {
    next(error)
  }
})

export default router
