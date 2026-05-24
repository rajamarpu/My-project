import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

router.get('/', async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      include: { lessons: { orderBy: { sortOrder: 'asc' } }, enrollments: true },
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
      include: { lessons: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })
    res.json({ success: true, course })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { title, description, category, level = 'BEGINNER', thumbnailUrl, videoPreviewUrl, lessons = [] } = req.body
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'Title, description, and category are required.' })
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug: `${slugify(title)}-${Date.now()}`,
        description,
        category,
        level,
        thumbnailUrl,
        videoPreviewUrl,
        isPublished: true,
        createdById: req.user.id,
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
      include: { lessons: true },
    })
    res.status(201).json({ success: true, course })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/enroll', requireAuth, requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const enrollment = await prisma.enrollment.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: req.params.id } },
      update: { personalityId: req.body.personalityId || undefined },
      create: { userId: req.user.id, courseId: req.params.id, personalityId: req.body.personalityId || null },
    })
    await prisma.analyticsEvent.create({ data: { userId: req.user.id, courseId: req.params.id, eventType: 'course_enrolled' } })
    res.status(201).json({ success: true, enrollment })
  } catch (error) {
    next(error)
  }
})

export default router
