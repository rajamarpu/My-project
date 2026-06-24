import crypto from 'node:crypto'
import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logActivity } from '../utils/activityLogger.js'

const router = Router()
const publicUser = { id: true, name: true, avatarUrl: true, role: true }

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeSettings(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

router.use(requireAuth)

router.get('/preferences', async (req, res, next) => {
  try {
    const preference = await prisma.userPreference.findUnique({ where: { userId: req.user.id } })
    res.json({ success: true, settings: preference?.settings || {} })
  } catch (error) { next(error) }
})

router.put('/preferences', async (req, res, next) => {
  try {
    const settings = safeSettings(req.body)
    const preference = await prisma.userPreference.upsert({
      where: { userId: req.user.id },
      update: { settings },
      create: { userId: req.user.id, settings },
    })
    await logActivity(req, { action: 'account.preferences_updated', entityType: 'user_preference', entityId: preference.id })
    res.json({ success: true, settings: preference.settings })
  } catch (error) { next(error) }
})

router.get('/saved-courses', requireRole('learner'), async (req, res, next) => {
  try {
    const items = await prisma.savedCourse.findMany({
      where: { userId: req.user.id },
      include: { course: { include: { createdBy: { select: publicUser }, _count: { select: { enrollments: true, lessons: true } } } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, savedCourses: items.map((item) => ({ ...item.course, savedAt: item.createdAt })) })
  } catch (error) { next(error) }
})

router.post('/saved-courses/:courseId', requireRole('learner'), async (req, res, next) => {
  try {
    const course = await prisma.course.findFirst({ where: { id: req.params.courseId, isPublished: true }, select: { id: true } })
    if (!course) return res.status(404).json({ success: false, message: 'Course not found.' })
    const saved = await prisma.savedCourse.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      update: {},
      create: { userId: req.user.id, courseId: course.id },
    })
    res.status(201).json({ success: true, saved })
  } catch (error) { next(error) }
})

router.delete('/saved-courses/:courseId', requireRole('learner'), async (req, res, next) => {
  try {
    await prisma.savedCourse.deleteMany({ where: { userId: req.user.id, courseId: req.params.courseId } })
    res.json({ success: true })
  } catch (error) { next(error) }
})

router.get('/notifications', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20))
    const where = { userId: req.user.id, ...(req.query.unread === 'true' ? { isRead: false } : {}) }
    const [notifications, total, unread] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
    ])
    res.json({ success: true, notifications, pagination: { page, pageSize, total }, unread })
  } catch (error) { next(error) }
})

router.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const result = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } })
    if (!result.count) return res.status(404).json({ success: false, message: 'Notification not found.' })
    res.json({ success: true })
  } catch (error) { next(error) }
})

router.get('/live-sessions', async (req, res, next) => {
  try {
    const role = String(req.user.role).toLowerCase()
    const enrollments = role === 'learner'
      ? await prisma.enrollment.findMany({ where: { userId: req.user.id }, select: { courseId: true } })
      : []
    const where = role === 'instructor'
      ? { instructorId: req.user.id }
      : role === 'learner'
        ? { OR: [{ courseId: null }, { courseId: { in: enrollments.map((item) => item.courseId) } }] }
        : {}
    const sessions = await prisma.liveSession.findMany({
      where,
      include: { course: { select: { id: true, title: true } }, instructor: { select: publicUser } },
      orderBy: { startsAt: 'asc' },
    })
    res.json({ success: true, sessions })
  } catch (error) { next(error) }
})

router.post('/live-sessions', requireRole('instructor', 'admin'), async (req, res, next) => {
  try {
    const startsAt = new Date(req.body.startsAt)
    const endsAt = new Date(req.body.endsAt)
    if (!req.body.title || Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) || endsAt <= startsAt) {
      return res.status(400).json({ success: false, message: 'Title and a valid start/end time are required.' })
    }
    const instructorId = String(req.user.role).toLowerCase() === 'admin' ? Number(req.body.instructorId) : req.user.id
    if (String(req.user.role).toLowerCase() === 'instructor' && req.body.courseId) {
      const assigned = await prisma.course.findFirst({ where: { id: req.body.courseId, OR: [{ createdById: req.user.id }, { enrollments: { some: { currentInstructorId: req.user.id } } }] }, select: { id: true } })
      if (!assigned) return res.status(403).json({ success: false, message: 'You can only schedule sessions for courses assigned to you.' })
    }
    if (req.body.meetingUrl && !/^https:\/\//i.test(String(req.body.meetingUrl))) return res.status(400).json({ success: false, message: 'Meeting URL must use HTTPS.' })
    const session = await prisma.liveSession.create({ data: {
      title: String(req.body.title).trim(), description: req.body.description || null, courseId: req.body.courseId || null,
      instructorId, startsAt, endsAt, meetingUrl: req.body.meetingUrl || null, recordingUrl: req.body.recordingUrl || null,
      status: req.body.status || 'SCHEDULED',
    } })
    await logActivity(req, { action: 'live_session.created', entityType: 'live_session', entityId: session.id })
    res.status(201).json({ success: true, session })
  } catch (error) { next(error) }
})

router.get('/learner-report', requireRole('learner'), async (req, res, next) => {
  try {
    const [enrollments, progress, submissions, certificates] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId: req.user.id }, include: { course: { select: { id: true, title: true } } }, orderBy: { enrolledAt: 'desc' } }),
      prisma.progress.findMany({ where: { userId: req.user.id } }),
      prisma.assessmentSubmission.findMany({ where: { studentId: req.user.id }, orderBy: { submittedAt: 'desc' } }),
      prisma.certificate.findMany({ where: { userId: req.user.id }, include: { course: { select: { title: true } } } }),
    ])
    const watchedSeconds = progress.reduce((sum, item) => sum + toNumber(item.watchedSeconds), 0)
    const assessmentAverage = submissions.length ? Math.round(submissions.reduce((sum, item) => sum + toNumber(item.percentage), 0) / submissions.length) : 0
    const enrolled = enrollments.length
    const completed = enrollments.filter((item) => item.completedAt || toNumber(item.completionPct) >= 100).length
    res.json({ success: true, report: {
      summary: { enrolled, completed, watchedSeconds, assessmentAverage, certificates: certificates.length },
      courses: enrollments, submissions: submissions.slice(0, 20), certificates,
    } })
  } catch (error) { next(error) }
})

router.get('/instructor/courses', requireRole('instructor'), async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { OR: [{ createdById: req.user.id }, { enrollments: { some: { currentInstructorId: req.user.id } } }] },
      include: { _count: { select: { lessons: true, enrollments: true, assessmentSubmissions: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ success: true, courses })
  } catch (error) { next(error) }
})

router.get('/community/topics', async (_req, res, next) => {
  try {
    const topics = await prisma.communityTopic.findMany({ include: { createdBy: { select: publicUser }, _count: { select: { posts: true } } }, orderBy: { updatedAt: 'desc' } })
    res.json({ success: true, topics })
  } catch (error) { next(error) }
})

router.post('/community/topics', async (req, res, next) => {
  try {
    const title = String(req.body.title || '').trim()
    if (title.length < 4) return res.status(400).json({ success: false, message: 'Topic title must contain at least 4 characters.' })
    const base = slugify(title) || 'topic'
    const slug = `${base}-${crypto.randomBytes(3).toString('hex')}`
    const topic = await prisma.communityTopic.create({ data: { title, slug, description: req.body.description || null, createdById: req.user.id } })
    res.status(201).json({ success: true, topic })
  } catch (error) { next(error) }
})

router.get('/community/topics/:topicId/posts', async (req, res, next) => {
  try {
    const topic = await prisma.communityTopic.findFirst({ where: { OR: [{ id: req.params.topicId }, { slug: req.params.topicId }] } })
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found.' })
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20))
    const where = { topicId: topic.id, parentId: null, isDeleted: false }
    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({ where, include: { author: { select: publicUser }, replies: { where: { isDeleted: false }, include: { author: { select: publicUser } }, orderBy: { createdAt: 'asc' } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.communityPost.count({ where }),
    ])
    res.json({ success: true, topic, posts, pagination: { page, pageSize, total } })
  } catch (error) { next(error) }
})

router.post('/community/topics/:topicId/posts', async (req, res, next) => {
  try {
    const topic = await prisma.communityTopic.findFirst({ where: { OR: [{ id: req.params.topicId }, { slug: req.params.topicId }] } })
    if (!topic || topic.isLocked) return res.status(topic ? 409 : 404).json({ success: false, message: topic ? 'This topic is locked.' : 'Topic not found.' })
    const body = String(req.body.body || '').trim()
    if (body.length < 2 || body.length > 5000) return res.status(400).json({ success: false, message: 'Post must contain 2 to 5000 characters.' })
    const post = await prisma.communityPost.create({ data: { topicId: topic.id, authorId: req.user.id, parentId: req.body.parentId || null, body }, include: { author: { select: publicUser } } })
    res.status(201).json({ success: true, post })
  } catch (error) { next(error) }
})

router.post('/community/posts/:postId/report', async (req, res, next) => {
  try {
    const reason = String(req.body.reason || '').trim()
    if (reason.length < 3) return res.status(400).json({ success: false, message: 'Please provide a report reason.' })
    const report = await prisma.communityReport.upsert({ where: { postId_reporterId: { postId: req.params.postId, reporterId: req.user.id } }, update: { reason, status: 'OPEN' }, create: { postId: req.params.postId, reporterId: req.user.id, reason } })
    res.status(201).json({ success: true, report })
  } catch (error) { next(error) }
})

router.get('/admin/community/reports', requireRole('admin'), async (_req, res, next) => {
  try {
    const reports = await prisma.communityReport.findMany({ include: { reporter: { select: publicUser }, post: { include: { author: { select: publicUser }, topic: { select: { id: true, title: true, slug: true } } } } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, reports })
  } catch (error) { next(error) }
})

router.patch('/admin/community/reports/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const status = String(req.body.status || '').toUpperCase()
    if (!['OPEN', 'RESOLVED', 'DISMISSED'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid moderation status.' })
    const report = await prisma.communityReport.update({ where: { id: req.params.id }, data: { status } })
    if (req.body.removePost === true) await prisma.communityPost.update({ where: { id: report.postId }, data: { isDeleted: true, body: '[Removed by moderation]' } })
    await logActivity(req, { action: 'admin.community_report_reviewed', entityType: 'community_report', entityId: report.id, metadata: { status, removePost: req.body.removePost === true } })
    res.json({ success: true, report })
  } catch (error) { next(error) }
})

router.get('/admin/settings', requireRole('admin'), async (_req, res, next) => {
  try {
    const record = await prisma.platformSetting.findUnique({ where: { key: 'platform' } })
    res.json({ success: true, settings: record?.value || {} })
  } catch (error) { next(error) }
})

router.put('/admin/settings', requireRole('admin'), async (req, res, next) => {
  try {
    const value = safeSettings(req.body)
    const record = await prisma.platformSetting.upsert({ where: { key: 'platform' }, update: { value, updatedById: req.user.id }, create: { key: 'platform', value, updatedById: req.user.id } })
    await logActivity(req, { action: 'admin.platform_settings_updated', entityType: 'platform_settings', entityId: record.id })
    res.json({ success: true, settings: record.value })
  } catch (error) { next(error) }
})

router.post('/payments/checkout', requireRole('learner'), async (req, res, next) => {
  try {
    const courseId = req.body.courseId || null
    const course = courseId ? await prisma.course.findFirst({ where: { id: courseId, isPublished: true } }) : null
    const planPrices = { PRO_MONTHLY: 79900 }
    const productRef = course?.id || String(req.body.productRef || '')
    const amountCents = course ? course.priceCents : planPrices[productRef]
    if (!Number.isInteger(amountCents) || amountCents <= 0) return res.status(400).json({ success: false, message: 'A valid paid product is required.' })
    const idempotencyKey = String(req.get('idempotency-key') || req.body.idempotencyKey || '').trim()
    if (idempotencyKey.length < 8) return res.status(400).json({ success: false, message: 'An idempotency key is required.' })
    const existing = await prisma.payment.findUnique({ where: { idempotencyKey } })
    if (existing && existing.userId !== req.user.id) return res.status(409).json({ success: false, message: 'Idempotency key is already in use.' })
    const payment = existing || await prisma.payment.create({ data: {
      userId: req.user.id, courseId, amountCents, currency: 'INR', provider: process.env.PAYMENT_PROVIDER || 'EXTERNAL', status: 'PENDING',
      productType: course ? 'COURSE' : 'PLAN', productRef, idempotencyKey,
    } })
    const checkoutBase = process.env.PAYMENT_CHECKOUT_URL
    if (!checkoutBase) return res.status(503).json({ success: false, paymentId: payment.id, message: 'Secure payment provider is not configured.' })
    const checkoutUrl = new URL(checkoutBase)
    checkoutUrl.searchParams.set('reference', payment.id)
    checkoutUrl.searchParams.set('amount', String(payment.amountCents))
    checkoutUrl.searchParams.set('currency', payment.currency)
    res.status(existing ? 200 : 201).json({ success: true, payment, checkoutUrl: checkoutUrl.toString() })
  } catch (error) { next(error) }
})

router.post('/payments/verify', requireRole('learner'), async (req, res, next) => {
  try {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET
    if (!secret) return res.status(503).json({ success: false, message: 'Payment verification is not configured.' })
    const payment = await prisma.payment.findFirst({ where: { id: req.body.paymentId, userId: req.user.id } })
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' })
    const providerRef = String(req.body.providerRef || '')
    const expected = crypto.createHmac('sha256', secret).update(`${payment.id}|${providerRef}`).digest('hex')
    const received = String(req.body.signature || '')
    const valid = received.length === expected.length && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
    if (!valid) return res.status(400).json({ success: false, message: 'Payment signature is invalid.' })
    const receiptNo = payment.receiptNo || `UPTO-${Date.now()}-${payment.id.slice(-6).toUpperCase()}`
    const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PAID', providerRef, paidAt: new Date(), receiptNo } })
    await logActivity(req, { action: 'payment.verified', entityType: 'payment', entityId: updated.id, metadata: { receiptNo } })
    res.json({ success: true, payment: updated })
  } catch (error) { next(error) }
})

router.get('/payments', async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({ where: { userId: req.user.id }, include: { course: { select: { title: true } } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, payments })
  } catch (error) { next(error) }
})

router.patch('/admin/payments/:id/status', requireRole('admin'), async (req, res, next) => {
  try {
    const status = String(req.body.status || '').toUpperCase()
    if (!['PENDING', 'FAILED', 'CANCELLED'].includes(status)) return res.status(400).json({ success: false, message: 'Paid status can only be set through signed provider verification.' })
    const payment = await prisma.payment.update({ where: { id: req.params.id }, data: { status } })
    await logActivity(req, { action: 'admin.payment_status_updated', entityType: 'payment', entityId: payment.id, metadata: { status } })
    res.json({ success: true, payment })
  } catch (error) { next(error) }
})

router.post('/admin/payments/:id/refund', requireRole('admin'), async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } })
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' })
    if (payment.status !== 'PAID') return res.status(409).json({ success: false, message: 'Only paid transactions can be refunded.' })
    const amountCents = Math.min(payment.amountCents - payment.refundedCents, Number(req.body.amountCents) || payment.amountCents)
    if (amountCents <= 0) return res.status(409).json({ success: false, message: 'No refundable balance remains.' })
    const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: 'REFUND_PENDING' } })
    await logActivity(req, { action: 'admin.refund_requested', entityType: 'payment', entityId: payment.id, metadata: { amountCents, reason: req.body.reason || '' } })
    res.status(202).json({ success: true, payment: updated, refund: { amountCents, status: 'REFUND_PENDING', message: 'Refund request recorded. Provider confirmation is required before funds are marked refunded.' } })
  } catch (error) { next(error) }
})

export default router
