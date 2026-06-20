import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { logActivity } from '../utils/activityLogger.js'
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

function optionText(question, optionId) {
  return (question.options || []).find((option) => option.id === optionId)?.text || optionId
}

function answerText(question, answer) {
  if (question.type === 'MCQ_SINGLE') return optionText(question, answer)
  if (question.type === 'MCQ_MULTIPLE') return (Array.isArray(answer) ? answer : []).map((id) => optionText(question, id)).join(', ')
  if (Array.isArray(answer)) return answer.join(', ')
  return String(answer ?? '').trim()
}

function correctAnswerText(question) {
  if (question.type === 'DESCRIPTIVE' || question.type === 'FILL_BLANK') return (question.correctAnswers || [])[0] || ''
  return (question.correctAnswers || []).map((id) => optionText(question, id)).join(', ')
}

function reviewFromResult(question, answer, result) {
  const marks = Math.max(1, Number.parseInt(question.marks, 10) || 1)
  const skipped = Array.isArray(answer) ? answer.length === 0 : !String(answer ?? '').trim()
  const needsManualEvaluation = question.type === 'DESCRIPTIVE' || Boolean(result.needsReview)
  const correct = Boolean(result.correct)
  return {
    questionId: question.id,
    questionText: question.text,
    questionType: question.type,
    studentAnswer: answer ?? '',
    studentAnswerText: answerText(question, answer),
    correctAnswer: correctAnswerText(question),
    modelAnswer: correctAnswerText(question),
    result: skipped ? 'SKIPPED' : needsManualEvaluation ? 'PENDING_EVALUATION' : correct ? 'CORRECT' : 'INCORRECT',
    isCorrect: needsManualEvaluation ? null : correct,
    needsManualEvaluation,
    marks,
    marksAwarded: skipped || needsManualEvaluation ? 0 : correct ? marks : 0,
    adminRemarks: '',
    wordCount: result.wordCount || 0,
  }
}

async function persistPracticeSubmission(req, question, answer, result) {
  if (req.user.role !== 'learner' || !question.courseId) return null
  const review = reviewFromResult(question, answer, result)
  const totalMarks = review.marks
  const obtainedMarks = Number(review.marksAwarded || 0)
  const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0
  const status = review.needsManualEvaluation ? 'PENDING_EVALUATION' : percentage >= 40 ? 'PASSED' : 'FAILED'
  const assignmentId = `practice-question-${question.id}`
  const previousAttempts = await prisma.assessmentSubmission.count({
    where: { studentId: req.user.id, courseId: question.courseId, assignmentId },
  })

  const submission = await prisma.assessmentSubmission.create({
    data: {
      studentId: req.user.id,
      courseId: question.courseId,
      assignmentId,
      assignmentName: `Practice Question: ${question.text.slice(0, 80)}`,
      studentAnswers: { [question.id]: answer ?? '' },
      questionReviews: [review],
      totalMarks,
      obtainedMarks,
      correctCount: review.result === 'CORRECT' ? 1 : 0,
      wrongCount: review.result === 'INCORRECT' ? 1 : 0,
      skippedCount: review.result === 'SKIPPED' ? 1 : 0,
      percentage,
      status,
      attemptNumber: previousAttempts + 1,
      evaluatedAt: status === 'PENDING_EVALUATION' ? null : new Date(),
      publishedAt: status === 'PENDING_EVALUATION' ? null : new Date(),
    },
  })
  await logActivity(req, {
    action: 'learner.practice_question_submitted',
    entityType: 'question',
    entityId: question.id,
    metadata: {
      submissionId: submission.id,
      courseId: question.courseId,
      questionId: question.id,
      questionType: question.type,
      status,
      percentage,
      result: review.result,
      attemptNumber: previousAttempts + 1,
    },
  })
  return submission
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
    const result = evaluateQuestionAnswer(question, req.body.answer)
    const submission = await persistPracticeSubmission(req, question, req.body.answer, result)
    res.json({ success: true, result, submissionId: submission?.id || null })
  } catch (error) {
    next(error)
  }
})

export default router
