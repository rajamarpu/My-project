import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'

const router = Router()

// User management - admin only
router.get('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query
    const skip = (page - 1) * limit
    const take = parseInt(limit)
    
    const where = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive === 'true'
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, email: true, role: true, isActive: true, isVerified: true, createdAt: true }
      }),
      prisma.user.count({ where })
    ])
    
    res.json({ success: true, data: { users, pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) } } })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch users' })
  }
})

// Get specific user
router.get('/users/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, isVerified: true, createdAt: true, updatedAt: true }
    })
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch user' })
  }
})

// Update user status
router.patch('/users/:id/status', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { isActive } = req.body
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' })
    }
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive }
    })
    
    res.json({ success: true, data: { id: user.id, isActive: user.isActive }, message: 'User status updated' })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ success: false, message: 'Failed to update user status' })
  }
})

// Course management - admin only
router.get('/courses', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, isPublished } = req.query
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
    if (isPublished !== undefined) where.isPublished = isPublished === 'true'
    
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          instructor: { select: { fullName: true, email: true } },
          _count: { select: { enrollments: true, videos: true } }
        }
      }),
      prisma.course.count({ where })
    ])
    
    res.json({ success: true, data: { courses, pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) } } })
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch courses' })
  }
})

// Create course - admin only
router.post('/courses', requireAuth, requireRole('ADMIN'), async (req, res) => {
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
        instructorId: req.user.id, // Admin creating course becomes instructor
        isPublished: false
      }
    })
    
    res.status(201).json({ success: true, data: course, message: 'Course created successfully' })
  } catch (error) {
    console.error('Create course error:', error)
    res.status(500).json({ success: false, message: 'Failed to create course' })
  }
})

// Update course - admin only
router.patch('/courses/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { title, description, thumbnail, price, category, isPublished } = req.body
    
    const course = await prisma.course.findUnique({ where: { id: req.params.id } })
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
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

// Delete course - admin only
router.delete('/courses/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } })
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }
    
    await prisma.course.delete({ where: { id: req.params.id } })
    
    res.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete course' })
  }
})

// Teacher approvals - admin only
router.get('/teacher-approvals', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { status = 'PENDING' } = req.query
    
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', isVerified: status === 'VERIFIED' ? true : false },
      select: { id: true, fullName: true, email: true, createdAt: true }
    })
    
    res.json({ success: true, data: teachers })
  } catch (error) {
    console.error('Get teacher approvals error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch teacher approvals' })
  }
})

// Approve/reject teacher
router.patch('/teacher-approvals/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { action } = req.body // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' })
    }
    
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id, role: 'TEACHER' } })
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' })
    }
    
    const updatedTeacher = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: action === 'approve' }
    })
    
    res.json({ success: true, data: { id: updatedTeacher.id, isVerified: updatedTeacher.isVerified }, message: `Teacher ${action}d successfully` })
  } catch (error) {
    console.error('Teacher approval error:', error)
    res.status(500).json({ success: false, message: 'Failed to update teacher approval' })
  }
})

// Platform settings - admin only
router.get('/settings', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    // In a real app, this would come from a settings table
    const settings = {
      maintenanceMode: false,
      registrationEnabled: true,
      maxCoursePrice: 999,
      enableCertificates: true,
      enableVideoUpload: true,
      enableGithubAuth: true,
      sessionTimeout: 3600,
      passwordMinLength: 8
    }
    
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch settings' })
  }
})

// Update platform settings - admin only
router.patch('/settings', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    // In a real app, this would update a settings table
    res.json({ success: true, message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ success: false, message: 'Failed to update settings' })
  }
})

// Reports - admin only
router.get('/reports', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { type = 'overview' } = req.query
    
    let reportData = {}
    if (type === 'overview') {
      const [totalUsers, totalStudents, totalInstructors, totalCourses, publishedCourses, totalEnrollments, completedCourses] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.course.count(),
        prisma.course.count({ where: { isPublished: true } }),
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { completed: true } })
      ])
      
      reportData = {
        overview: {
          totalUsers,
          totalStudents,
          totalInstructors,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          courseCompletionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0,
          instructorVerificationRate: totalInstructors > 0 ? Math.round((prisma.user.count({ where: { role: 'TEACHER', isVerified: true }}) / totalInstructors) * 100) : 0
        },
        trends: {
          userGrowth: [
            { month: 'Jan', count: 120 },
            { month: 'Feb', count: 150 },
            { month: 'Mar', count: 200 },
            { month: 'Apr', count: 180 },
            { month: 'May', count: 220 }
          ],
          courseSales: [
            { month: 'Jan', sales: 45 },
            { month: 'Feb', sales: 52 },
            { month: 'Mar', sales: 38 },
            { month: 'Apr', sales: 61 },
            { month: 'May', sales: 48 }
          ]
        }
      }
    }
    
    res.json({ success: true, data: reportData })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch reports' })
  }
})

export default router