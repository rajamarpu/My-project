import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Generate certificate for completed course
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.body
    
    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' })
    }
    
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: req.user.id,
        courseId: courseId
      }
    })
    
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course' })
    }
    
    // Check if course is completed
    if (!enrollment.completed) {
      return res.status(400).json({ success: false, message: 'Course must be completed to generate certificate' })
    }
    
    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        studentId: req.user.id,
        courseId: courseId
      }
    })
    
    if (existingCertificate) {
      return res.json({ success: true, data: existingCertificate, message: 'Certificate already exists' })
    }
    
    // Get course and user details
    const [course, user] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.user.findUnique({ where: { id: req.user.id } })
    ])
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    // Generate certificate
    const certificateId = uuidv4()
    const certificateData = {
      id: certificateId,
      studentId: req.user.id,
      courseId: courseId,
      certificateUrl: `/certificates/${certificateId}.pdf`, // In real app, this would be actual PDF URL
      issuedAt: new Date()
    }
    
    // Save certificate to database
    const certificate = await prisma.certificate.create({
      data: certificateData
    })
    
    res.status(201).json({ success: true, data: certificate, message: 'Certificate generated successfully' })
  } catch (error) {
    console.error('Generate certificate error:', error)
    res.status(500).json({ success: false, message: 'Failed to generate certificate' })
  }
})

// Get user's certificates
router.get('/my-certificates', requireAuth, async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { studentId: req.user.id },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } }
      },
      orderBy: { issuedAt: 'desc' }
    })
    
    res.json({ success: true, data: certificates })
  } catch (error) {
    console.error('Get certificates error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch certificates' })
  }
})

// Get certificate by ID (for viewing/downloading)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, title: true, thumbnail: true } },
        student: { select: { id: true, fullName: true, email: true } }
      }
    })
    
    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' })
    }
    
    // Check if user owns this certificate or is admin/instructor
    if (certificate.studentId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    res.json({ success: true, data: certificate })
  } catch (error) {
    console.error('Get certificate error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch certificate' })
  }
})

// Admin: Get all certificates
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const skip = (page - 1) * limit
    const take = parseInt(limit)
    
    const where = {}
    if (search) {
      where.OR = [
        { student: { fullName: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip,
        take,
        orderBy: { issuedAt: 'desc' },
        include: {
          student: { select: { id: true, fullName: true, email: true } },
          course: { select: { id: true, title: true, thumbnail: true } }
        }
      }),
      prisma.certificate.count({ where })
    ])
    
    res.json({ success: true, data: { certificates, pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) } } })
  } catch (error) {
    console.error('Get certificates error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch certificates' })
  }
})

// Admin: Verify certificate (check authenticity)
router.get('/verify/:id', async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, title: true } },
        student: { select: { id: true, fullName: true } }
      }
    })
    
    if (!certificate) {
      return res.json({ success: false, valid: false, message: 'Certificate not found' })
    }
    
    res.json({ 
      success: true, 
      valid: true, 
      data: {
        id: certificate.id,
        studentName: certificate.student.fullName,
        courseTitle: certificate.course.title,
        issuedAt: certificate.issuedAt,
        certificateId: certificate.id
      }
    })
  } catch (error) {
    console.error('Verify certificate error:', error)
    res.status(500).json({ success: false, message: 'Failed to verify certificate' })
  }
})

export default router