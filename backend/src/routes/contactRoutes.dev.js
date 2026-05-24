import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'

const router = Router()

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' })
    }
    
    // In a real app, you might want to check if user is logged in
    const userId = req.user ? req.user.id : null
    
    const contactMessage = await prisma.contactMessage.create({
      data: {
        userId,
        name,
        email,
        subject,
        message
      }
    })
    
    res.status(201).json({ 
      success: true, 
      data: contactMessage, 
      message: 'Your message has been sent successfully. We will get back to you soon.' 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' })
  }
})

// Get contact messages - admin only
router.get('/', requireAuth, async (req, res) => {
  try {
    // Only allow admin to view all messages
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    
    const { page = 1, limit = 20, search, status } = req.query
    const skip = (page - 1) * limit
    const take = parseInt(limit)
    
    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (status) where.status = status
    
    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, email: true } } }
      }),
      prisma.contactMessage.count({ where })
    ])
    
    res.json({ success: true, data: { messages, pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) } } })
  } catch (error) {
    console.error('Get contact messages error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch contact messages' })
  }
})

// Update contact message status - admin only
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    // Only allow admin to update status
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    
    const { status } = req.body
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }
    
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { status }
    })
    
    res.json({ success: true, data: message, message: 'Message status updated' })
  } catch (error) {
    console.error('Update contact message status error:', error)
    res.status(500).json({ success: false, message: 'Failed to update message status' })
  }
})

// Delete contact message - admin only
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Only allow admin to delete messages
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }
    
    await prisma.contactMessage.delete({ where: { id: req.params.id } })
    
    res.json({ success: true, message: 'Message deleted successfully' })
  } catch (error) {
    console.error('Delete contact message error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete message' })
  }
})

export default router