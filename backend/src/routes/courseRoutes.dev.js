import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'

const router = Router()

// Get all courses with filtering and pagination
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, minPrice, maxPrice, sortBy = 'newest' } = req.query
    const skip = (page - 1) * limit
    const take = parseInt(limit)
    
    const where = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (category) where.category = category
    if (minPrice !== undefined) where.price = { ...where.price, gte: parseFloat(minPrice) }
    if (maxPrice !== undefined) where.price = { ...where.price, lte: parseFloat(maxPrice) }
    // Only show published courses to non-admin users
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      where.isPublished = true
    }
    
    let orderBy = {}
    switch (sortBy) {
      case 'newest': orderBy = { createdAt: 'desc' }; break
      case 'oldest': orderBy = { createdAt: 'asc' }; break
      case 'price-low': orderBy = { price: 'asc' }; break
      case 'price-high': orderBy = { price: 'desc' }; break
      case 'rating': orderBy = { rating: 'desc' }; break
      default: orderBy = { createdAt: 'desc' }
    }
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          instructor: { select: { id: true, fullName: true } },
          _count: {
            select: { enrollments: true, videos: true }
          }
        }
      }),
      prisma.course.count({ where })
    ])
    
    res.json({ 
      success: true, 
      data: { 
        courses, 
        pagination: { 
          page: parseInt(page), 
          limit: take, 
          total, 
          pages: Math.ceil(total / take) 
        } 
      } 
    })
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch courses' })
  }
})

// Get course by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        instructor: { select: { id: true, fullName: true, email: true } },
        videos: { select: { id: true, title: true, duration: true } },
        _count: {
          select: { enrollments: true, certificates: true }
        }
      }
    })
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    
    // Check if course is published or user has permission
    if (!course.isPublished && req.user.role !== 'ADMIN' && 
        req.user.role !== 'TEACHER' && course.instructorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Course not available' })
    }
    
    res.json({ success: true, data: course })
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch course' })
  }
})

// Create course - instructor/admin only
router.post('/', requireAuth, requireRole('TEACHER', 'ADMIN'), async (req, res) => {
  try {
    const { title, description, thumbnail, price, category } = req.body
    
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required' })
    }
    
    const course = await prisma.course.create({
      data: {
        title,
        description,
        thumbnail: thumbnail || null,
        price: parseFloat(price) || 0,
        category,
        instructorId: req.user.id,
        isPublished: false // Draft by default
      }
    })
    
    res.status(201).json({ success: true, data: course, message: 'Course created successfully' })
  } catch (error) {
    console.error('Create course error:', error)
    res.status(500).json({ success: false, message: 'Failed to create course' })
  }
})

// Update course - instructor/admin only
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { title, description, thumbnail, price, category, isPublished } = req.body
    
    const course = await prisma.course.findUnique({ where: { id: req.params.id } })
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    
    // Check permissions
    if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You can only update your own courses' })
    }
    
    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (price !== undefined) updateData.price = parseFloat(price)
    if (category !== undefined) updateData.category = category
    if (isPublished !== undefined) updateData.isPublished = isPublished
    
    const updatedCourse = await prisma.course.update({
      where: { id: req.params.id },
      data: updateData
    })
    
    res.json({ success: true, data: updatedCourse, message: 'Course updated successfully' })
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({ success: false, message: 'Failed to update course' })
  }
})

// Delete course - instructor/admin only
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } })
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    
    // Check permissions
    if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You can only delete your own courses' })
    }
    
    await prisma.course.delete({ where: { id: req.params.id } })
    
    res.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete course' })
  }
})

// Enroll in course
router.post('/:id/enroll', requireAuth, requireRole('STUDENT'), async (req, res) => {
  try {
    const courseId = req.params.id
    
    // Check if course exists and is published
    const course = await prisma.course.findUnique({ 
      where: { id: courseId, isPublished: true } 
    })
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or not published' })
    }
    
    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId: req.user.id, courseId }
    })
    
    if (existingEnrollment) {
      return res.status(409).json({ success: false, message: 'Already enrolled in this course' })
    }
    
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: req.user.id,
        courseId,
        progress: 0,
        completed: false
      }
    })
    
    res.status(201).json({ success: true, data: enrollment, message: 'Enrolled successfully' })
  } catch (error) {
    console.error('Enroll course error:', error)
    res.status(500).json({ success: false, message: 'Failed to enroll in course' })
  }
})

// Get user's enrollments
router.get('/enrollments/my', requireAuth, async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.id },
      include: {
        course: { 
          select: { id: true, title: true, thumbnail: true, price: true },
          instructor: { select: { fullName: true } }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })
    
    res.json({ success: true, data: enrollments })
  } catch (error) {
    console.error('Get enrollments error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch enrollments' })
  }
})

// Get course stats (for instructors/admins)
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { enrollments: true }
        },
        enrollments: {
          where: { completed: true },
          select: { id: true }
        }
      }
    })
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    
    // Check permissions
    if (course.instructorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    
    const totalEnrollments = course._count.enrollments
    const completedEnrollments = course.enrollments.length
    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0
    
    res.json({ 
      success: true, 
      data: {
        totalEnrollments,
        completedEnrollments,
        completionRate,
        revenue: totalEnrollments * course.price
      }
    })
  } catch (error) {
    console.error('Get course stats error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch course stats' })
  }
})

export default router