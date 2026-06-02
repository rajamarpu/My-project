import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { evaluateQuestionAnswer, hideCorrectAnswer, sanitizeQuestionPayload, validateQuestionPayload } from '../utils/questionValidation.js'

const router = Router()
router.use(requireAuth)

function pagination(req) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(5, Number.parseInt(req.query.pageSize, 10) || 10))
  return { page, pageSize, skip: (page - 1) * pageSize }
}

function questionWhere(req) {
  const search = String(req.query.search || '').trim()
  const type = String(req.query.type || '').trim().toUpperCase()
  const difficulty = String(req.query.difficulty || '').trim().toUpperCase()
  const courseId = String(req.query.courseId || '').trim()
  return {
    ...(search ? { text: { contains: search, mode: 'insensitive' } } : {}),
    ...(type && type !== 'ALL' ? { type } : {}),
    ...(difficulty && difficulty !== 'ALL' ? { difficulty } : {}),
    ...(courseId && courseId !== 'ALL' ? { courseId } : {}),
  }
}

async function courseExists(courseId) {
  if (!courseId) return false
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } })
  return Boolean(course)
}

router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, skip } = pagination(req)
    const where = questionWhere(req)
    const [total, questions] = await Promise.all([
      prisma.question.count({ where }),
      prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: { course: { select: { id: true, title: true } } },
      }),
    ])
    const canSeeAnswers = ['admin', 'instructor'].includes(req.user.role)
    res.json({
      success: true,
      questions: canSeeAnswers ? questions : questions.map(hideCorrectAnswer),
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const question = sanitizeQuestionPayload(req.body)
    const errors = validateQuestionPayload(question)
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Question validation failed.' })
    if (!(await courseExists(question.courseId))) {
      return res.status(400).json({ success: false, errors: { courseId: 'Selected course was not found.' }, message: 'Question validation failed.' })
    }

    const created = await prisma.question.create({
      data: { ...question, createdById: req.user.id },
      include: { course: { select: { id: true, title: true } } },
    })
    res.status(201).json({ success: true, question: created })
  } catch (error) {
    next(error)
  }
})

router.post('/bulk', requireRole('admin'), async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body.questions) ? req.body.questions : []
    if (!rows.length) return res.status(400).json({ success: false, message: 'Provide a questions array to import.' })

    const validQuestions = []
    const rejected = []
    rows.forEach((row, index) => {
      const question = sanitizeQuestionPayload(row)
      const errors = validateQuestionPayload(question)
      if (Object.keys(errors).length) rejected.push({ index, errors })
      else validQuestions.push({ index, question: { ...question, createdById: req.user.id } })
    })

    const courseIds = [...new Set(validQuestions.map((item) => item.question.courseId))]
    const courses = await prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true } })
    const validCourseIds = new Set(courses.map((course) => course.id))
    const importableQuestions = []

    validQuestions.forEach(({ index, question }) => {
      if (!validCourseIds.has(question.courseId)) {
        rejected.push({ index, errors: { courseId: 'Selected course was not found.' } })
      } else {
        importableQuestions.push(question)
      }
    })

    if (importableQuestions.length) await prisma.question.createMany({ data: importableQuestions })
    res.status(201).json({ success: true, imported: importableQuestions.length, rejected })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const question = sanitizeQuestionPayload(req.body)
    const errors = validateQuestionPayload(question)
    if (Object.keys(errors).length) return res.status(400).json({ success: false, errors, message: 'Question validation failed.' })
    if (!(await courseExists(question.courseId))) {
      return res.status(400).json({ success: false, errors: { courseId: 'Selected course was not found.' }, message: 'Question validation failed.' })
    }

    const updated = await prisma.question.update({
      where: { id: req.params.id },
      data: question,
      include: { course: { select: { id: true, title: true } } },
    })
    res.json({ success: true, question: updated })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await prisma.question.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/validate', async (req, res, next) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } })
    if (!question) return res.status(404).json({ success: false, message: 'Question not found.' })
    res.json({ success: true, result: evaluateQuestionAnswer(question, req.body.answer) })
  } catch (error) {
    next(error)
  }
})

export default router
