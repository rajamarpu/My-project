import crypto from 'node:crypto'
import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

function parseDateOrNull(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildVerificationCode() {
  return `VER-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: req.user.role === 'admin' ? {} : { userId: req.user.id },
      include: {
        course: { include: { createdBy: { select: { id: true, name: true, email: true, expertise: true } } } },
        user: { select: { id: true, name: true, email: true } },
        issuedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })
    res.json({ success: true, certificates })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const userId = Number(req.body.userId)
    const courseId = String(req.body.courseId || '').trim()
    const issuedAt = parseDateOrNull(req.body.issuedAt) || new Date()
    const completionDate = parseDateOrNull(req.body.completionDate)
    if (!Number.isInteger(userId) || !courseId) {
      return res.status(400).json({ success: false, message: 'Learner and course are required.' })
    }

    const [learner, course] = await Promise.all([
      prisma.user.findFirst({ where: { id: userId, role: 'USER' }, select: { id: true, name: true, email: true, phone: true, avatarUrl: true } }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          level: true,
          createdBy: { select: { id: true, name: true, email: true, expertise: true } },
        },
      }),
    ])
    if (!learner) return res.status(404).json({ success: false, message: 'Learner not found.' })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })

    const enrollmentCount = await prisma.enrollment.count({ where: { userId, courseId } })
    if (!enrollmentCount) {
      return res.status(409).json({
        success: false,
        message: 'This learner is not enrolled in the selected course. Enroll the learner before issuing a certificate.',
      })
    }

    const certificateNo = String(req.body.certificateNo || '').trim() || `UPTO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    const verificationCode = String(req.body.verificationCode || '').trim() || buildVerificationCode()
    const issueMetadata = {
      source: 'admin-issued',
      issuedBy: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      completionDate: completionDate ? completionDate.toISOString() : null,
      provided: {
        studentName: String(req.body.studentName || learner.name || '').trim() || null,
        courseName: String(req.body.courseName || course.title || '').trim() || null,
        instructorName: String(req.body.instructorName || course.createdBy?.name || '').trim() || null,
      },
    }
    const certificate = await prisma.certificate.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        certificateNo,
        verificationCode,
        status: 'ISSUED',
        issuedAt,
        completionDate,
        issuedById: req.user.id,
        learnerSnapshot: {
          id: learner.id,
          name: learner.name,
          email: learner.email,
          phone: learner.phone || null,
          avatarUrl: learner.avatarUrl || null,
        },
        courseSnapshot: {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          instructor: course.createdBy,
        },
        issueMetadata,
      },
      create: {
        userId,
        courseId,
        certificateNo,
        verificationCode,
        issuedAt,
        completionDate,
        issuedById: req.user.id,
        learnerSnapshot: {
          id: learner.id,
          name: learner.name,
          email: learner.email,
          phone: learner.phone || null,
          avatarUrl: learner.avatarUrl || null,
        },
        courseSnapshot: {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          instructor: course.createdBy,
        },
        issueMetadata,
      },
      include: {
        course: { include: { createdBy: { select: { id: true, name: true, email: true, expertise: true } } } },
        user: { select: { id: true, name: true, email: true } },
        issuedBy: { select: { id: true, name: true, email: true } },
      },
    })
    res.status(201).json({ success: true, certificate })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
        issuedBy: { select: { id: true, name: true, email: true } },
      },
    })
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' })

    await prisma.certificate.delete({ where: { id: req.params.id } })
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'certificate.deleted',
        entityType: 'certificate',
        entityId: certificate.id,
        metadata: {
          certificateNo: certificate.certificateNo,
          learnerId: certificate.userId,
          learnerEmail: certificate.user?.email,
          courseId: certificate.courseId,
          courseTitle: certificate.course?.title,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
