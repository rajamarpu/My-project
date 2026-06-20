import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { logActivity } from '../utils/activityLogger.js'

const router = Router()

const instructorSelect = { id: true, name: true, email: true, avatarUrl: true, bio: true, expertise: true, socialLinks: true }

router.get('/analytics/user', requireAuth, async (req, res, next) => {
  try {
    const [enrollments, certificates, recent] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId: req.user.id }, include: { course: true } }),
      prisma.certificate.count({ where: { userId: req.user.id } }),
      prisma.progress.findMany({
        where: { userId: req.user.id },
        include: { course: true, lesson: true },
        orderBy: { lastAccessedAt: 'desc' },
        take: 8,
      }),
    ])

    const hoursStudied = enrollments.reduce((sum, item) => sum + item.hoursStudied, 0)
    const completion = enrollments.length
      ? Math.round(enrollments.reduce((sum, item) => sum + item.completionPct, 0) / enrollments.length)
      : 0
    const quiz = enrollments.length
      ? Math.round(enrollments.reduce((sum, item) => sum + item.quizAverage, 0) / enrollments.length)
      : 0
    const streak = enrollments.reduce((max, item) => Math.max(max, item.streakDays), 0)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      return { day: date.toLocaleDateString('en-US', { weekday: 'short' }), date: date.toISOString().slice(0, 10), hours: 0 }
    })
    const weeklyByDate = new Map(weekly.map((item) => [item.date, item]))
    recent.forEach((item) => {
      const bucket = weeklyByDate.get(item.lastAccessedAt.toISOString().slice(0, 10))
      if (bucket) bucket.hours += Number(((item.watchedSeconds || 0) / 3600).toFixed(2))
    })

    res.json({
      success: true,
      analytics: {
        completion,
        hoursStudied,
        quiz,
        streak,
        certificates,
        weekly,
        recent,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:courseId', requireAuth, async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({
      where: { OR: [{ id: req.params.courseId }, { slug: req.params.courseId }] },
      select: { id: true, createdById: true },
    })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const [progress, enrollment] = await Promise.all([
      prisma.progress.findMany({
        where: { userId: req.user.id, courseId: course.id },
        include: { lesson: true },
        orderBy: { lastAccessedAt: 'desc' },
      }),
      prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
        include: {
          currentInstructor: { select: instructorSelect },
          instructorChanges: {
            include: {
              fromInstructor: { select: instructorSelect },
              toInstructor: { select: instructorSelect },
              changedBy: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ])
    res.json({ success: true, progress, enrollment })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { courseId, lessonId = null, percentComplete = 0, watchedSeconds = 0, quizScore } = req.body
    if (!courseId) return res.status(400).json({ success: false, message: 'courseId is required.' })

    const progress = await prisma.progress.upsert({
      where: { userId_courseId_lessonId: { userId: req.user.id, courseId, lessonId } },
      update: { percentComplete, watchedSeconds, quizScore, completed: percentComplete >= 100, lastAccessedAt: new Date() },
      create: { userId: req.user.id, courseId, lessonId, percentComplete, watchedSeconds, quizScore, completed: percentComplete >= 100 },
    })
    await prisma.enrollment.updateMany({
      where: { userId: req.user.id, courseId },
      data: { completionPct: percentComplete, hoursStudied: { increment: watchedSeconds / 3600 }, quizAverage: quizScore || undefined },
    })
    await prisma.analyticsEvent.create({ data: { userId: req.user.id, courseId, eventType: 'progress_updated', value: percentComplete } })
    await logActivity(req, {
      action: percentComplete >= 100 ? 'learner.course_completed' : 'learner.progress_updated',
      entityType: lessonId ? 'lesson' : 'course',
      entityId: lessonId || courseId,
      metadata: {
        courseId,
        lessonId,
        percentComplete,
        watchedSeconds,
        quizScore: quizScore ?? null,
      },
    })
    if (watchedSeconds > 0) {
      await prisma.analyticsEvent.create({ data: { userId: req.user.id, courseId, eventType: 'watch_time', value: watchedSeconds } })
      await logActivity(req, {
        action: 'learner.lesson_watch_time',
        entityType: lessonId ? 'lesson' : 'course',
        entityId: lessonId || courseId,
        metadata: { courseId, lessonId, watchedSeconds },
      })
    }
    if (percentComplete >= 100) {
      await prisma.analyticsEvent.create({ data: { userId: req.user.id, courseId, eventType: 'course_completed' } })
    }
    res.json({ success: true, progress })
  } catch (error) {
    next(error)
  }
})

export default router
