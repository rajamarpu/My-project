import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { prisma } from '../config/prisma.js'

const router = Router()

// Analytics dashboard data - requires auth
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Get user-specific analytics based on role
    const userRole = req.user.role
    let analyticsData = {}
    
    if (userRole === 'STUDENT') {
      // Learner analytics
      const [totalCourses, completedCourses, totalHours, recentActivity] = await Promise.all([
        prisma.enrollment.count({ where: { studentId: req.user.id } }),
        prisma.enrollment.count({ where: { studentId: req.user.id, completed: true } }),
        prisma.enrollment.aggregate({
          _sum: { progress: true },
          where: { studentId: req.user.id }
        }),
        prisma.enrollment.findMany({
          where: { studentId: req.user.id },
          include: { course: true },
          orderBy: { enrolledAt: 'desc' },
          take: 5
        })
      ])
      
      analyticsData = {
        totalCourses,
        completedCourses,
        completionRate: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0,
        totalHours: totalHours._sum || 0,
        recentActivity,
        weeklyProgress: [
          { week: 'Week 1', hours: 5 },
          { week: 'Week 2', hours: 7 },
          { week: 'Week 3', hours: 6 },
          { week: 'Week 4', hours: 8 }
        ]
      }
    } else if (userRole === 'ADMIN') {
      // Admin analytics
      const [totalUsers, totalStudents, totalInstructors, totalCourses, totalEnrollments, revenue] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.enrollment.aggregate({
          _sum: { progress: true },
          where: { completed: true }
        })
      ])
      
      analyticsData = {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        totalEnrollments,
        avgCompletion: totalEnrollments > 0 ? Math.round((revenue._sum || 0) / totalEnrollments) : 0,
        userGrowth: [
          { month: 'Jan', count: 120 },
          { month: 'Feb', count: 150 },
          { month: 'Mar', count: 200 },
          { month: 'Apr', count: 180 }
        ],
        courseCategories: [
          { name: 'Technology', value: 45 },
          { name: 'Business', value: 30 },
          { name: 'Health', value: 15 },
          { name: 'Arts', value: 10 }
        ]
      }
    } else if (userRole === 'TEACHER') {
      // Instructor analytics
      const [totalCourses, totalStudents, totalRevenue, coursePerformance] = await Promise.all([
        prisma.course.count({ where: { instructorId: req.user.id } }),
        prisma.enrollment.count({
          where: { course: { instructorId: req.user.id } }
        }),
        prisma.course.aggregate({
          _sum: { price: true },
          where: { instructorId: req.user.id, isPublished: true }
        }),
        prisma.course.findMany({
          where: { instructorId: req.user.id },
          include: {
            _count: {
              select: { enrollments: true }
            }
          }
        })
      ])
      
      analyticsData = {
        totalCourses,
        totalStudents,
        totalRevenue: totalRevenue._sum || 0,
        coursePerformance: coursePerformance.map(course => ({
          title: course.title,
          students: course._count.enrollments,
          progress: Math.floor(Math.random() * 100)
        })),
        monthlyEarnings: [
          { month: 'Jan', earnings: 2400 },
          { month: 'Feb', earnings: 3100 },
          { month: 'Mar', earnings: 4200 },
          { month: 'Apr', earnings: 3800 }
        ]
      }
    }
    
    res.json({ success: true, data: analyticsData })
  } catch (error) {
    console.error('Analytics error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch analytics data' })
  }
})

// Platform-wide analytics (admin only)
router.get('/platform', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, activeStudents, totalCourses, publishedCourses, totalEnrollments, completedCourses] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completed: true } })
    ])
    
    const engagementData = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM login_activity 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeStudents: activeStudents || 0,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          courseCompletionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0
        },
        engagement: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 20
        })).reverse(),
        courseCategories: [
          { name: 'Technology', value: 35, change: 12 },
          { name: 'Business', value: 28, change: 8 },
          { name: 'Health', value: 15, change: -5 },
          { name: 'Arts', value: 12, change: 3 },
          { name: 'Science', value: 10, change: 7 }
        ]
      }
    })
  } catch (error) {
    console.error('Platform analytics error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch platform analytics' })
  }
})

export default router