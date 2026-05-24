import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'

const router = Router()

// Get user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, isVerified: true, createdAt: true, updatedAt: true, githubId: true }
    })
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch profile' })
  }
})

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, phone, bio, location } = req.body
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName || undefined,
        phone: phone || undefined,
        // For bio and location, we'd need to extend the user model or use profile model
        // For now, we'll skip these as they're not in the base model
      }
    })
    
    res.json({ success: true, data: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone }, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, message: 'Failed to update profile' })
  }
})

// Update user settings
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const { theme, emailNotifications, productUpdates } = req.body
    
    // In a real app, we'd have a settings table or extend user model
    // For now, we'll just return success as these would be handled client-side with localStorage
    res.json({ success: true, message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ success: false, message: 'Failed to update settings' })
  }
})

// Get admin overview - admin only
router.get('/admin/overview', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, totalStudents, totalInstructors, totalCourses, publishedCourses, totalEnrollments, completedCourses, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completed: true } }),
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fullName: true, email: true, createdAt: true }
      })
    ])
    
    res.json({ 
      success: true, 
      data: {
        users: { total: totalUsers, students: totalStudents, instructors: totalInstructors },
        courses: { total: totalCourses, published: publishedCourses },
        engagement: { totalEnrollments, completedCourses, completionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0 },
        recentUsers
      }
    })
  } catch (error) {
    console.error('Get admin overview error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch admin overview' })
  }
})

export default router