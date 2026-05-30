import crypto from 'crypto'
import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { verifyToken } from '../utils/tokens.js'

const router = Router()

const instructorSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  bio: true,
  expertise: true,
  socialLinks: true,
}

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function pickRandomInstructorId() {
  const instructors = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR', isActive: true, approvalStatus: 'APPROVED' },
    select: { id: true },
  })
  if (!instructors.length) return null
  return instructors[Math.floor(Math.random() * instructors.length)].id
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

async function getOptionalUserId(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  try {
    const payload = verifyToken(token)
    const session = await prisma.session.findUnique({
      where: { tokenHash: crypto.createHash('sha256').update(token).digest('hex') },
      select: { revokedAt: true, expiresAt: true },
    })
    if (!session || session.revokedAt || session.expiresAt < new Date()) return null
    return payload.sub
  } catch {
    return null
  }
}

function attachEnrollmentState(course, userId) {
  const enrollmentCount = course._count?.enrollments ?? course.enrollments?.length ?? 0
  const isEnrolled = userId ? Boolean(course.enrollments?.some((item) => item.userId === userId)) : false
  const { enrollments: _enrollments, ...rest } = course
  return {
    ...rest,
    isEnrolled,
    enrollmentCount,
    _count: {
      ...(course._count || {}),
      enrollments: enrollmentCount,
    },
  }
}

router.get('/', async (req, res, next) => {
  try {
    const userId = await getOptionalUserId(req)
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        enrollments: { select: { userId: true } },
        _count: { select: { enrollments: true, lessons: true } },
        createdBy: { select: instructorSelect },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, courses: courses.map((course) => attachEnrollmentState(course, userId)) })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const userId = await getOptionalUserId(req)
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        enrollments: { select: { userId: true } },
        _count: { select: { enrollments: true, lessons: true } },
        createdBy: { select: instructorSelect },
      },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })
    res.json({ success: true, course: attachEnrollmentState(course, userId) })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      level = 'BEGINNER',
      priceCents = 0,
      thumbnailUrl,
      videoPreviewUrl,
      isPublished = true,
      lessons = [],
    } = req.body
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required.' })
    }

    const randomInstructorId = await pickRandomInstructorId()
    const categoryRecord = await findCategoryForCourse(category)

    const course = await prisma.course.create({
      data: {
        title,
        slug: `${slugify(title)}-${Date.now()}`,
        description,
        category,
        categoryId: categoryRecord?.id || null,
        level,
        priceCents: Number(priceCents || 0),
        thumbnailUrl,
        videoPreviewUrl,
        isPublished: Boolean(isPublished),
        createdById: randomInstructorId || req.user.id,
        lessons: {
          create: lessons.map((lesson, index) => ({
            title: lesson.title,
            description: lesson.description,
            videoUrl: lesson.videoUrl,
            durationMin: Number(lesson.durationMin || 0),
            sortOrder: index,
            type: lesson.type || 'VIDEO',
            quizJson: lesson.quizJson || null,
          })),
        },
      },
      include: { lessons: true, createdBy: { select: instructorSelect } },
    })
    res.status(201).json({ success: true, course })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/enroll', requireAuth, requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: { id: true, createdById: true, priceCents: true },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    if (Number(course.priceCents || 0) > 0) {
      const paidPayment = await prisma.payment.findFirst({
        where: {
          userId: req.user.id,
          courseId: course.id,
          status: 'PAID',
          amountCents: { gte: Number(course.priceCents || 0) },
        },
        select: { id: true },
      })
      if (!paidPayment) {
        return res.status(402).json({
          success: false,
          paymentRequired: true,
          priceCents: course.priceCents,
          priceRupees: course.priceCents / 100,
          message: `Payment required. Cost to enroll is ₹${(course.priceCents / 100).toLocaleString('en-IN')}.`,
        })
      }
    }

    let personalityId = req.body.personalityId || null
    if (!personalityId && req.body.personalitySlug) {
      const personality = await prisma.aIPersonality.findUnique({
        where: { slug: req.body.personalitySlug },
        select: { id: true },
      })
      personalityId = personality?.id || null
    }

    const requestedInstructorId = req.body.instructorId ? Number(req.body.instructorId) : null
    let currentInstructorId = requestedInstructorId || course.createdById || null
    if (currentInstructorId) {
      const instructor = await prisma.user.findFirst({
        where: { id: currentInstructorId, role: 'INSTRUCTOR', isActive: true, approvalStatus: 'APPROVED' },
        select: { id: true },
      })
      currentInstructorId = instructor?.id || course.createdById || null
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      select: { id: true },
    })

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      update: { personalityId: personalityId || undefined, currentInstructorId: currentInstructorId || undefined },
      create: { userId: req.user.id, courseId: course.id, personalityId, currentInstructorId },
      include: { currentInstructor: { select: instructorSelect } },
    })
    if (!existingEnrollment) {
      await prisma.analyticsEvent.create({
        data: {
          userId: req.user.id,
          courseId: course.id,
          personalityId,
          eventType: 'course_enrolled',
        },
      })
    }
    const enrollmentCount = await prisma.enrollment.count({ where: { courseId: course.id } })
    res.status(201).json({ success: true, enrollment, isEnrolled: true, enrollmentCount, wasAlreadyEnrolled: Boolean(existingEnrollment) })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id/enroll', requireAuth, requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: { id: true },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      select: { id: true },
    })
    if (!existing) {
      const enrollmentCount = await prisma.enrollment.count({ where: { courseId: course.id } })
      return res.json({ success: true, isEnrolled: false, enrollmentCount, message: 'Learner is already unenrolled.' })
    }

    await prisma.$transaction([
      prisma.progress.deleteMany({ where: { userId: req.user.id, courseId: course.id } }),
      prisma.enrollment.delete({ where: { id: existing.id } }),
    ])
    await prisma.analyticsEvent.create({
      data: {
        userId: req.user.id,
        courseId: course.id,
        eventType: 'course_unenrolled',
      },
    })
    const enrollmentCount = await prisma.enrollment.count({ where: { courseId: course.id } })
    res.json({ success: true, isEnrolled: false, enrollmentCount, message: 'Unenrolled from course.' })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/instructors', async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: { id: true, createdById: true },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR', isActive: true, approvalStatus: 'APPROVED' },
      select: instructorSelect,
      orderBy: { name: 'asc' },
    })

    const enriched = instructors
      .map((instructor) => {
        const isDefault = instructor.id === course.createdById
        return { ...instructor, matchReason: isDefault ? 'Initially assigned' : 'Available celebrity', _priority: isDefault ? 0 : 1 }
      })
      .sort((a, b) => (a._priority - b._priority) || a.name.localeCompare(b.name))
      .map(({ _priority, ...instructor }) => instructor)

    res.json({ success: true, courseId: course.id, defaultInstructorId: course.createdById, instructors: enriched })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/instructor', requireAuth, requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      select: { id: true, createdById: true },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const instructorId = Number(req.body.instructorId)
    if (!Number.isInteger(instructorId)) {
      return res.status(400).json({ success: false, message: 'A valid instructorId is required.' })
    }

    const instructor = await prisma.user.findFirst({
      where: { id: instructorId, role: 'INSTRUCTOR', isActive: true, approvalStatus: 'APPROVED' },
      select: instructorSelect,
    })
    if (!instructor) return res.status(404).json({ success: false, message: 'Instructor not found or unavailable.' })

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      include: { currentInstructor: { select: instructorSelect } },
    })
    const previousInstructorId = existing?.currentInstructorId || course.createdById || null

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      update: { currentInstructorId: instructor.id },
      create: { userId: req.user.id, courseId: course.id, currentInstructorId: instructor.id },
      include: { currentInstructor: { select: instructorSelect } },
    })

    if (previousInstructorId !== instructor.id) {
      await prisma.instructorChangeHistory.create({
        data: {
          enrollmentId: enrollment.id,
          userId: req.user.id,
          courseId: course.id,
          fromInstructorId: previousInstructorId,
          toInstructorId: instructor.id,
          changedById: req.user.id,
          reason: req.body.reason ? String(req.body.reason).trim() : null,
        },
      })
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'instructor_changed',
          entityType: 'course',
          entityId: course.id,
          metadata: { fromInstructorId: previousInstructorId, toInstructorId: instructor.id },
        },
      })
      await prisma.analyticsEvent.create({
        data: {
          userId: req.user.id,
          courseId: course.id,
          eventType: 'instructor_changed',
          metadata: { fromInstructorId: previousInstructorId, toInstructorId: instructor.id },
        },
      })
    }

    const history = await prisma.instructorChangeHistory.findMany({
      where: { enrollmentId: enrollment.id },
      include: {
        fromInstructor: { select: instructorSelect },
        toInstructor: { select: instructorSelect },
        changedBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, enrollment, currentInstructor: instructor, history })
  } catch (error) {
    next(error)
  }
})

export default router
