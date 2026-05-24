import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'

const router = Router()

router.get('/rooms/:courseId', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params

    const messages = await prisma.chatMessage.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: {
          select: { id: true, full_name: true, profile_image: true }
        }
      }
    })

    res.json({ success: true, messages: messages.reverse() })
  } catch (error) {
    console.error('Chat fetch error:', error)
    res.status(503).json({ success: false, message: 'Database error' })
  }
})

router.post('/message', requireAuth, async (req, res) => {
  try {
    const { roomId, message, courseId } = req.body
    const userId = req.user.id

    const savedMessage = await prisma.chatMessage.create({
      data: {
        message,
        senderId: userId,
        roomId,
        courseId
      },
      include: {
        sender: {
          select: { id: true, full_name: true, profile_image: true }
        }
      }
    })

    res.json({ success: true, message: savedMessage })
  } catch (error) {
    console.error('Message send error:', error)
    res.status(503).json({ success: false, message: 'Database error' })
  }
})

router.get('/online-users', requireAuth, async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
    
    const onlineUsers = await prisma.chatMessage.findMany({
      where: {
        createdAt: { gte: thirtyMinutesAgo }
      },
      select: {
        sender: {
          select: { id: true, full_name: true, profile_image: true }
        }
      },
      distinct: ['senderId']
    })

    res.json({ success: true, users: onlineUsers.map(m => m.sender) })
  } catch (error) {
    console.error('Online users error:', error)
    res.status(503).json({ success: false, message: 'Database error' })
  }
})

export default router