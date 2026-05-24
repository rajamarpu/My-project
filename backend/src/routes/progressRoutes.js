import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

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

    res.json({
      success: true,
      analytics: {
        completion,
        hoursStudied,
        quiz,
        streak,
        certificates,
        weekly: [
          { day: 'Mon', hours: 1.5 },
          { day: 'Tue', hours: 2.2 },
          { day: 'Wed', hours: 1 },
          { day: 'Thu', hours: 3.1 },
          { day: 'Fri', hours: 2.4 },
          { day: 'Sat', hours: 4 },
          { day: 'Sun', hours: 2.8 },
        ],
        recent,
      },
    })
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
    res.json({ success: true, progress })
  } catch (error) {
    next(error)
  }
})

export default router
