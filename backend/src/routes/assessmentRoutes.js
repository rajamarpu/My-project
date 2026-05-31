import { Router } from 'express'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const OBJECTIVE_TYPES = new Set(['MCQ_SINGLE', 'MCQ_MULTIPLE', 'FILL_BLANK'])

function asText(value) {
  if (Array.isArray(value)) return value.join(', ')
  return String(value ?? '').trim()
}

function normalizeText(value, caseSensitive = false) {
  const text = String(value ?? '').trim()
  return caseSensitive ? text : text.toLowerCase()
}

function optionText(question, optionId) {
  return (question.options || []).find((option) => option.id === optionId)?.text || optionId
}

function correctAnswerDisplay(question) {
  if (question.type === 'FILL_BLANK') return question.correctAnswer || question.correctAnswers?.[0] || ''
  if (question.type === 'DESCRIPTIVE') return question.modelAnswer || question.expectedAnswer || question.correctAnswer || ''
  return (question.correctAnswers || []).map((id) => optionText(question, id)).join(', ')
}

function studentAnswerDisplay(question, answer) {
  if (question.type === 'MCQ_SINGLE') return optionText(question, answer)
  if (question.type === 'MCQ_MULTIPLE') return (Array.isArray(answer) ? answer : []).map((id) => optionText(question, id)).join(', ')
  return asText(answer)
}

function isSkipped(answer) {
  if (Array.isArray(answer)) return answer.length === 0
  return !String(answer ?? '').trim()
}

function evaluateQuestion(question, answer) {
  const marks = Math.max(1, Number.parseInt(question.marks, 10) || 1)
  const skipped = isSkipped(answer)

  if (question.type === 'DESCRIPTIVE') {
    const text = String(answer || '').trim()
    return {
      questionId: question.id,
      questionText: question.text,
      questionType: question.type,
      studentAnswer: answer || '',
      studentAnswerText: studentAnswerDisplay(question, answer),
      correctAnswer: correctAnswerDisplay(question),
      modelAnswer: correctAnswerDisplay(question),
      result: skipped ? 'SKIPPED' : 'PENDING_EVALUATION',
      isCorrect: null,
      needsManualEvaluation: true,
      marks,
      marksAwarded: 0,
      adminRemarks: '',
      wordCount: text ? text.split(/\s+/).length : 0,
    }
  }

  let correct = false
  if (question.type === 'FILL_BLANK') {
    const expected = [question.correctAnswer, ...(question.correctAnswers || [])].filter(Boolean)
    correct = expected.some((value) => normalizeText(value, question.caseSensitive) === normalizeText(answer, question.caseSensitive))
  } else {
    const selected = Array.isArray(answer) ? answer.map(String).sort() : [String(answer || '')].filter(Boolean)
    const expected = (question.correctAnswers || []).map(String).sort()
    correct = selected.length === expected.length && selected.every((item, index) => item === expected[index])
  }

  return {
    questionId: question.id,
    questionText: question.text,
    questionType: question.type,
    studentAnswer: answer ?? '',
    studentAnswerText: studentAnswerDisplay(question, answer),
    correctAnswer: correctAnswerDisplay(question),
    result: skipped ? 'SKIPPED' : correct ? 'CORRECT' : 'INCORRECT',
    isCorrect: skipped ? false : correct,
    needsManualEvaluation: false,
    marks,
    marksAwarded: skipped ? 0 : correct ? marks : 0,
  }
}

function buildEvaluation(questions, answers) {
  const questionReviews = questions.map((question) => evaluateQuestion(question, answers[question.id]))
  const totalMarks = questionReviews.reduce((sum, review) => sum + review.marks, 0)
  const obtainedMarks = questionReviews.reduce((sum, review) => sum + Number(review.marksAwarded || 0), 0)
  const pending = questionReviews.some((review) => review.needsManualEvaluation)
  const correctCount = questionReviews.filter((review) => review.result === 'CORRECT').length
  const wrongCount = questionReviews.filter((review) => review.result === 'INCORRECT').length
  const skippedCount = questionReviews.filter((review) => review.result === 'SKIPPED').length
  const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0
  return {
    questionReviews,
    totalMarks,
    obtainedMarks,
    correctCount,
    wrongCount,
    skippedCount,
    percentage,
    status: pending ? 'PENDING_EVALUATION' : percentage >= 40 ? 'PASSED' : 'FAILED',
  }
}

function normalizeQuestions(assignment) {
  return (assignment?.quizJson?.questions || [])
    .map((question, index) => ({
      id: question.id || `question-${index + 1}`,
      type: question.type || 'DESCRIPTIVE',
      text: String(question.text || '').trim(),
      options: Array.isArray(question.options) ? question.options : [],
      correctAnswers: Array.isArray(question.correctAnswers) ? question.correctAnswers : [],
      correctAnswer: question.correctAnswer || '',
      modelAnswer: question.modelAnswer || question.expectedAnswer || '',
      caseSensitive: Boolean(question.caseSensitive),
      marks: Math.max(1, Number.parseInt(question.marks, 10) || 1),
    }))
    .filter((question) => question.text)
}

async function findAssignment(courseId, assignmentId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!course) return null
  return course.lessons.find((lesson) => lesson.id === assignmentId && lesson.quizJson?.kind === 'assessment') || null
}

router.post('/submit', requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const courseId = String(req.body.courseId || '')
    const assignmentId = String(req.body.assignmentId || '')
    const assignment = await findAssignment(courseId, assignmentId)
    if (!assignment) return res.status(404).json({ success: false, message: 'Assessment was not found for this course.' })

    const questions = normalizeQuestions(assignment)
    const answers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {}
    if (!questions.length) {
      questions.push({
        id: 'response',
        type: 'DESCRIPTIVE',
        text: assignment.quizJson?.prompt || assignment.description || assignment.title,
        options: [],
        correctAnswers: [],
        correctAnswer: '',
        modelAnswer: '',
        marks: 1,
      })
    }

    const evaluation = buildEvaluation(questions, answers)
    const attemptNumber = await prisma.assessmentSubmission.count({
      where: { studentId: req.user.id, courseId, assignmentId },
    }) + 1

    const submission = await prisma.assessmentSubmission.create({
      data: {
        studentId: req.user.id,
        courseId,
        assignmentId,
        assignmentName: assignment.title,
        studentAnswers: answers,
        questionReviews: evaluation.questionReviews,
        totalMarks: evaluation.totalMarks,
        obtainedMarks: evaluation.obtainedMarks,
        correctCount: evaluation.correctCount,
        wrongCount: evaluation.wrongCount,
        skippedCount: evaluation.skippedCount,
        percentage: evaluation.percentage,
        status: evaluation.status,
        attemptNumber,
        completionTimeSec: Number.parseInt(req.body.completionTimeSec, 10) || null,
        evaluatedAt: evaluation.status === 'PENDING_EVALUATION' ? null : new Date(),
        publishedAt: evaluation.status === 'PENDING_EVALUATION' ? null : new Date(),
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    })
    res.status(201).json({ success: true, submission })
  } catch (error) {
    next(error)
  }
})

router.get('/submissions', requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const where = {
      studentId: req.user.id,
      ...(req.query.courseId ? { courseId: String(req.query.courseId) } : {}),
      ...(req.query.assignmentId ? { assignmentId: String(req.query.assignmentId) } : {}),
    }
    const submissions = await prisma.assessmentSubmission.findMany({
      where,
      include: { course: { select: { id: true, title: true } } },
      orderBy: { submittedAt: 'desc' },
    })
    res.json({ success: true, submissions })
  } catch (error) {
    next(error)
  }
})

router.get('/submissions/:id', requireRole('learner', 'admin'), async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? { id: req.params.id } : { id: req.params.id, studentId: req.user.id }
    const submission = await prisma.assessmentSubmission.findFirst({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    })
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' })
    res.json({ success: true, submission })
  } catch (error) {
    next(error)
  }
})

router.get('/admin/submissions', requireRole('admin'), async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const where = {
      ...(req.query.courseId ? { courseId: String(req.query.courseId) } : {}),
      ...(req.query.studentId ? { studentId: Number.parseInt(req.query.studentId, 10) || -1 } : {}),
      ...(req.query.assignmentId ? { assignmentId: String(req.query.assignmentId) } : {}),
      ...(req.query.status && req.query.status !== 'ALL' ? { status: String(req.query.status).toUpperCase() } : {}),
      ...(req.query.date ? {
        submittedAt: {
          gte: new Date(`${req.query.date}T00:00:00.000Z`),
          lt: new Date(`${req.query.date}T23:59:59.999Z`),
        },
      } : {}),
      ...(search ? {
        OR: [
          { assignmentName: { contains: search, mode: 'insensitive' } },
          { student: { name: { contains: search, mode: 'insensitive' } } },
          { student: { email: { contains: search, mode: 'insensitive' } } },
          { course: { title: { contains: search, mode: 'insensitive' } } },
        ],
      } : {}),
    }
    const submissions = await prisma.assessmentSubmission.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 200,
    })
    res.json({ success: true, submissions })
  } catch (error) {
    next(error)
  }
})

router.patch('/admin/submissions/:id/evaluate', requireRole('admin'), async (req, res, next) => {
  try {
    const submission = await prisma.assessmentSubmission.findUnique({ where: { id: req.params.id } })
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' })

    const evaluations = Array.isArray(req.body.evaluations) ? req.body.evaluations : []
    const reviews = (submission.questionReviews || []).map((review) => {
      const update = evaluations.find((item) => item.questionId === review.questionId)
      if (!update || !review.needsManualEvaluation) return review
      const marksAwarded = Math.min(review.marks, Math.max(0, Number(update.marksAwarded || 0)))
      return {
        ...review,
        marksAwarded,
        adminRemarks: String(update.adminRemarks || '').trim(),
        result: 'EVALUATED',
        isCorrect: marksAwarded > 0,
        needsManualEvaluation: false,
      }
    })
    const totalMarks = reviews.reduce((sum, review) => sum + Number(review.marks || 0), 0)
    const obtainedMarks = reviews.reduce((sum, review) => sum + Number(review.marksAwarded || 0), 0)
    const percentage = totalMarks ? Math.round((obtainedMarks / totalMarks) * 10000) / 100 : 0
    const pending = reviews.some((review) => review.needsManualEvaluation)
    const updated = await prisma.assessmentSubmission.update({
      where: { id: submission.id },
      data: {
        questionReviews: reviews,
        totalMarks,
        obtainedMarks,
        correctCount: reviews.filter((review) => review.result === 'CORRECT' || review.result === 'EVALUATED').length,
        wrongCount: reviews.filter((review) => review.result === 'INCORRECT').length,
        skippedCount: reviews.filter((review) => review.result === 'SKIPPED').length,
        percentage,
        status: pending ? 'PENDING_EVALUATION' : percentage >= 40 ? 'PASSED' : 'FAILED',
        evaluatedAt: pending ? null : new Date(),
        publishedAt: pending ? null : new Date(),
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    })
    res.json({ success: true, submission: updated })
  } catch (error) {
    next(error)
  }
})

router.get('/admin/submissions/:id/download', requireRole('admin'), async (req, res, next) => {
  try {
    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id: req.params.id },
      include: {
        student: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    })
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' })
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="submission-${submission.id}.json"`)
    res.send(JSON.stringify(submission, null, 2))
  } catch (error) {
    next(error)
  }
})

export default router
