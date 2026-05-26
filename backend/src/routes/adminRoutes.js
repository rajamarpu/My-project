import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { publicUser, roleToDatabase } from '../utils/tokens.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

const userSelect = { id: true, name: true, email: true, phone: true, role: true, approvalStatus: true, avatarUrl: true, bio: true, expertise: true, socialLinks: true, isActive: true, createdAt: true }

router.get('/overview', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      totalLearners,
      totalAdmins,
      totalInstructors,
      activeSessions,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      completedCourses,
      messages,
      totalCategories,
      totalCertificates,
      totalNotifications,
      totalPayments,
      revenue,
      popularCourses,
      recentUsers,
      recentActivity,
      recentEvents,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.session.findMany({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.course.count({ where: { isPublished: false } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { OR: [{ completionPct: { gte: 100 } }, { completedAt: { not: null } }] } }),
      prisma.chatMessage.count({ where: { isDeleted: false } }),
      prisma.category.count(),
      prisma.certificate.count(),
      prisma.notification.count(),
      prisma.payment.count(),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amountCents: true } }),
      prisma.course.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: { enrollments: { _count: 'desc' } }, take: 5 }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: userSelect }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: userSelect } } }),
      prisma.analyticsEvent.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, orderBy: { createdAt: 'asc' } }),
    ])

    const daily = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(thirtyDaysAgo)
      date.setDate(thirtyDaysAgo.getDate() + index)
      const key = date.toISOString().slice(0, 10)
      return { date: key, registrations: 0, enrollments: 0, completions: 0, watchTime: 0 }
    })
    const dailyByDate = new Map(daily.map((item) => [item.date, item]))
    recentEvents.forEach((event) => {
      const bucket = dailyByDate.get(event.createdAt.toISOString().slice(0, 10))
      if (!bucket) return
      if (event.eventType === 'user_registered') bucket.registrations += 1
      if (event.eventType === 'course_enrolled') bucket.enrollments += 1
      if (event.eventType === 'course_completed') bucket.completions += 1
      if (event.eventType === 'watch_time') bucket.watchTime += Number(event.value || 0)
    })

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalLearners,
        totalAdmins,
        totalInstructors,
        activeUsers: activeSessions.length,
        totalCourses,
        publishedCourses,
        pendingApprovals: pendingCourses,
        totalEnrollments,
        completedCourses,
        messages,
        totalCategories,
        totalCertificates,
        totalNotifications,
        totalPayments,
        revenueCents: revenue._sum.amountCents || 0,
        popularCourses,
        recentUsers: recentUsers.map(publicUser),
        recentActivity,
        growth: daily,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: userSelect })
    res.json({ success: true, users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/learners', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, select: userSelect })
    res.json({ success: true, learners: users.map(publicUser), users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/instructors', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, orderBy: { createdAt: 'desc' }, select: userSelect })
    res.json({ success: true, instructors: users.map(publicUser), users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/courses', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const courses = await prisma.course.findMany({
      where: search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] } : {},
      include: { createdBy: { select: userSelect }, _count: { select: { enrollments: true, lessons: true, certificates: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, courses })
  } catch (error) {
    next(error)
  }
})

router.patch('/courses/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        level: req.body.level,
        priceCents: typeof req.body.priceCents === 'number' ? req.body.priceCents : undefined,
        isPublished: typeof req.body.isPublished === 'boolean' ? req.body.isPublished : undefined,
        thumbnailUrl: req.body.thumbnailUrl,
        videoPreviewUrl: req.body.videoPreviewUrl,
      },
      include: { createdBy: { select: userSelect } },
    })
    res.json({ success: true, course })
  } catch (error) {
    next(error)
  }
})

router.delete('/courses/:id', async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { courses: true } } }, orderBy: { name: 'asc' } })
    res.json({ success: true, categories })
  } catch (error) {
    next(error)
  }
})

router.post('/categories', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' })
    const slug = String(req.body.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: req.body.description || null,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : true,
      },
    })
    res.status(201).json({ success: true, category })
  } catch (error) {
    next(error)
  }
})

router.patch('/categories/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        slug: req.body.slug ? String(req.body.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined,
        description: req.body.description,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
      },
    })
    res.json({ success: true, category })
  } catch (error) {
    next(error)
  }
})

router.get('/enrollments', async (_req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: userSelect },
        course: true,
        personality: true,
        currentInstructor: { select: userSelect },
        instructorChanges: {
          include: { fromInstructor: { select: userSelect }, toInstructor: { select: userSelect }, changedBy: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })
    res.json({ success: true, enrollments })
  } catch (error) {
    next(error)
  }
})

router.get('/instructor-changes', async (_req, res, next) => {
  try {
    const changes = await prisma.instructorChangeHistory.findMany({
      include: {
        learner: { select: userSelect },
        course: true,
        fromInstructor: { select: userSelect },
        toInstructor: { select: userSelect },
        changedBy: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, changes })
  } catch (error) {
    next(error)
  }
})

router.get('/certificates', async (_req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({ include: { user: { select: userSelect }, course: true }, orderBy: { issuedAt: 'desc' } })
    res.json({ success: true, certificates })
  } catch (error) {
    next(error)
  }
})

router.get('/notifications', async (_req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ include: { user: { select: userSelect } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, notifications })
  } catch (error) {
    next(error)
  }
})

router.get('/activity-logs', async (_req, res, next) => {
  try {
    const activityLogs = await prisma.activityLog.findMany({ include: { user: { select: userSelect } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, activityLogs })
  } catch (error) {
    next(error)
  }
})

router.get('/payments', async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({ include: { user: { select: userSelect }, course: true }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, payments })
  } catch (error) {
    next(error)
  }
})

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password = 'Password123', role = 'learner' } = req.body
    const user = await prisma.user.create({
      data: { name, email: String(email).toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: roleToDatabase(role) },
    })
    res.status(201).json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: {
        name: req.body.name,
        role: req.body.role ? roleToDatabase(req.body.role) : undefined,
        approvalStatus: req.body.approvalStatus ? String(req.body.approvalStatus).toUpperCase() : undefined,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
      },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/approve', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { approvalStatus: 'APPROVED', isActive: true },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/reject', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { approvalStatus: 'REJECTED', isActive: false },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { approvalStatus: 'SUSPENDED', isActive: false },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.delete('/users/:id', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
