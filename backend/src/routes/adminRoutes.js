import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { publicUser, roleToDatabase } from '../utils/tokens.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

const userSelect = { id: true, name: true, email: true, phone: true, role: true, approvalStatus: true, avatarUrl: true, bio: true, expertise: true, socialLinks: true, isActive: true, createdAt: true }
const uploadDir = resolve(process.cwd(), 'public/uploads')
const uploadExtensionByMime = {
  'application/pdf': '.pdf',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/zip': '.zip',
  'text/plain': '.txt',
  'text/csv': '.csv',
}

function dateKey(value) {
  return value.toISOString().slice(0, 10)
}

function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function safeFileBase(value) {
  return String(value || 'course-file')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'course-file'
}

function extensionForUpload(fileName, mimeType) {
  const ext = extname(fileName || '').toLowerCase()
  if (ext && ext.length <= 8) return ext
  if (mimeType?.startsWith('video/')) return '.mp4'
  if (mimeType?.startsWith('image/')) return '.png'
  return uploadExtensionByMime[mimeType] || '.bin'
}

async function findCategoryForCourse(category) {
  const cleanCategory = String(category || '').trim()
  if (!cleanCategory) return null
  const cleanSlug = slugify(cleanCategory)
  return prisma.category.findFirst({
    where: {
      OR: [
        { id: cleanCategory },
        { name: { equals: cleanCategory, mode: 'insensitive' } },
        { slug: { equals: cleanSlug, mode: 'insensitive' } },
      ],
    },
  })
}

async function updateUserModeration(req, { approvalStatus, isActive, action }) {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) {
    const error = new Error('A valid user id is required.')
    error.statusCode = 400
    throw error
  }
  if (Number(req.user.id) === userId && isActive === false) {
    const error = new Error('You cannot suspend or reject your own admin account.')
    error.statusCode = 400
    throw error
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { approvalStatus, isActive },
  })

  if (isActive === false) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action,
      entityType: 'user',
      entityId: String(userId),
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        approvalStatus,
        isActive,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  })

  return publicUser(user)
}

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
      paidPayments,
      pendingPayments,
      totalProgress,
      activeProgress,
      totalHoursStudied,
      totalWatchSeconds,
      popularCourses,
      categoryDemand,
      recentUsers,
      recentActivity,
      recentEnrollments,
      recentCompletions,
      recentPayments,
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
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.progress.count(),
      prisma.progress.count({ where: { lastAccessedAt: { gte: thirtyDaysAgo } } }),
      prisma.enrollment.aggregate({ _sum: { hoursStudied: true } }),
      prisma.progress.aggregate({ _sum: { watchedSeconds: true } }),
      prisma.course.findMany({
        include: { _count: { select: { enrollments: true, lessons: true, certificates: true } } },
        orderBy: [{ enrollments: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 5,
      }),
      prisma.course.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: userSelect }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: userSelect } } }),
      prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } }),
      prisma.enrollment.findMany({ where: { completedAt: { gte: thirtyDaysAgo } }, select: { completedAt: true } }),
      prisma.payment.findMany({ where: { status: 'PAID', createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, amountCents: true } }),
    ])

    const daily = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(thirtyDaysAgo)
      date.setDate(thirtyDaysAgo.getDate() + index)
      const key = dateKey(date)
      return { date: key, registrations: 0, enrollments: 0, completions: 0, revenueCents: 0 }
    })
    const dailyByDate = new Map(daily.map((item) => [item.date, item]))
    recentUsers.forEach((user) => {
      const bucket = dailyByDate.get(dateKey(user.createdAt))
      if (bucket) bucket.registrations += 1
    })
    recentEnrollments.forEach((enrollment) => {
      const bucket = dailyByDate.get(dateKey(enrollment.enrolledAt))
      if (bucket) bucket.enrollments += 1
    })
    recentCompletions.forEach((enrollment) => {
      if (!enrollment.completedAt) return
      const bucket = dailyByDate.get(dateKey(enrollment.completedAt))
      if (bucket) bucket.completions += 1
    })
    recentPayments.forEach((payment) => {
      const bucket = dailyByDate.get(dateKey(payment.createdAt))
      if (bucket) bucket.revenueCents += payment.amountCents || 0
    })

    const completionRate = pct(completedCourses, totalEnrollments)
    const publishRate = pct(publishedCourses, totalCourses)
    const paidPaymentRate = pct(paidPayments, totalPayments)
    const averageProgressPct = totalEnrollments ? Math.round((completedCourses / totalEnrollments) * 100) : 0

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
        paidPayments,
        pendingPayments,
        revenueCents: revenue._sum.amountCents || 0,
        totalHoursStudied: Number(totalHoursStudied._sum.hoursStudied || 0),
        totalWatchHours: Math.round(Number(totalWatchSeconds._sum.watchedSeconds || 0) / 3600),
        totalProgress,
        activeProgress,
        completionRate,
        publishRate,
        paidPaymentRate,
        averageProgressPct,
        popularCourses: popularCourses.map((course) => ({
          id: course.id,
          title: course.title,
          category: course.category,
          enrollments: course._count.enrollments,
          lessons: course._count.lessons,
          certificates: course._count.certificates,
        })),
        categoryDemand: categoryDemand.map((item) => ({ category: item.category || 'Uncategorized', courses: item._count.id })),
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
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: userSelect },
        _count: { select: { enrollments: true, lessons: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, courses })
  } catch (error) {
    next(error)
  }
})

router.post('/uploads', async (req, res, next) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body || {}
    const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
    if (!fileName || !match) {
      return res.status(400).json({ success: false, message: 'A file name and base64 dataUrl are required.' })
    }

    const detectedMime = mimeType || match[1]
    const buffer = Buffer.from(match[2], 'base64')
    if (!buffer.length) return res.status(400).json({ success: false, message: 'Uploaded file is empty.' })
    if (buffer.length > 60 * 1024 * 1024) return res.status(413).json({ success: false, message: 'File must be 60 MB or smaller.' })

    await mkdir(uploadDir, { recursive: true })
    const storedName = `${Date.now()}-${safeFileBase(fileName)}${extensionForUpload(fileName, detectedMime)}`
    await writeFile(resolve(uploadDir, storedName), buffer)

    res.status(201).json({
      success: true,
      asset: {
        name: fileName,
        url: `/uploads/${storedName}`,
        mimeType: detectedMime,
        size: buffer.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.patch('/courses/:id', async (req, res, next) => {
  try {
    const category = req.body.category
    const categoryRecord = category !== undefined ? await findCategoryForCourse(category) : null
    const lessons = Array.isArray(req.body.lessons)
      ? req.body.lessons
        .map((lesson, index) => ({
          title: String(lesson.title || '').trim(),
          description: String(lesson.description || '').trim() || null,
          videoUrl: String(lesson.videoUrl || '').trim() || null,
          durationMin: Number(lesson.durationMin || 0),
          sortOrder: index,
          type: lesson.type || 'ARTICLE',
          quizJson: lesson.quizJson || null,
        }))
        .filter((lesson) => lesson.title)
      : null

    const course = await prisma.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { id: req.params.id },
        data: {
          title: req.body.title,
          description: req.body.description,
          category,
          categoryId: category !== undefined ? categoryRecord?.id || null : undefined,
          level: req.body.level,
          priceCents: typeof req.body.priceCents === 'number' ? req.body.priceCents : undefined,
          isPublished: typeof req.body.isPublished === 'boolean' ? req.body.isPublished : undefined,
          thumbnailUrl: req.body.thumbnailUrl,
          videoPreviewUrl: req.body.videoPreviewUrl,
        },
      })

      if (lessons) {
        await tx.lesson.deleteMany({ where: { courseId: req.params.id } })
        if (lessons.length) {
          await tx.lesson.createMany({
            data: lessons.map((lesson) => ({ ...lesson, courseId: req.params.id })),
          })
        }
      }

      return tx.course.findUnique({
        where: { id: updatedCourse.id },
        include: {
          lessons: { orderBy: { sortOrder: 'asc' } },
          createdBy: { select: userSelect },
          _count: { select: { enrollments: true, lessons: true, certificates: true } },
        },
      })
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
    const [categories, coursesByCategory] = await Promise.all([
      prisma.category.findMany({ include: { _count: { select: { courses: true } } }, orderBy: { name: 'asc' } }),
      prisma.course.groupBy({ by: ['category'], _count: { id: true } }),
    ])
    const courseCountByCategory = new Map(
      coursesByCategory.map((item) => [slugify(item.category), item._count.id]),
    )
    const enrichedCategories = categories.map((category) => {
      const relationCount = category._count?.courses || 0
      const textCount = courseCountByCategory.get(slugify(category.name)) || courseCountByCategory.get(category.slug) || 0
      return {
        ...category,
        _count: {
          ...category._count,
          courses: Math.max(relationCount, textCount),
        },
      }
    })
    res.json({ success: true, categories: enrichedCategories })
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
    const user = await updateUserModeration(req, {
      approvalStatus: 'APPROVED',
      isActive: true,
      action: 'user_approved',
    })
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/reject', async (req, res, next) => {
  try {
    const user = await updateUserModeration(req, {
      approvalStatus: 'REJECTED',
      isActive: false,
      action: 'user_rejected',
    })
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await updateUserModeration(req, {
      approvalStatus: 'SUSPENDED',
      isActive: false,
      action: 'user_suspended',
    })
    res.json({ success: true, user })
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
