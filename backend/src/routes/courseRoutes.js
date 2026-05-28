import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

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

router.get('/', async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        enrollments: true,
        createdBy: { select: instructorSelect },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, courses })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.id }, { slug: req.params.id }] },
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: instructorSelect },
      },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })
    res.json({ success: true, course })
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

    const course = await prisma.course.create({
      data: {
        title,
        slug: `${slugify(title)}-${Date.now()}`,
        description,
        category,
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
      select: { id: true, createdById: true },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

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

    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      update: { personalityId: personalityId || undefined, currentInstructorId: currentInstructorId || undefined },
      create: { userId: req.user.id, courseId: course.id, personalityId, currentInstructorId },
      include: { currentInstructor: { select: instructorSelect } },
    })
    await prisma.analyticsEvent.create({
      data: {
        userId: req.user.id,
        courseId: course.id,
        personalityId,
        eventType: 'course_enrolled',
      },
    })
    res.status(201).json({ success: true, enrollment })
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
