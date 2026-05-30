const questionTypes = new Set(['MCQ_SINGLE', 'MCQ_MULTIPLE', 'FILL_BLANK', 'DESCRIPTIVE'])
const difficultyLevels = new Set(['EASY', 'MEDIUM', 'HARD'])

function cleanOptions(options) {
  if (!Array.isArray(options)) return []
  return options
    .map((option, index) => ({
      id: String(option.id || `option-${index + 1}`),
      text: String(option.text || '').trim(),
    }))
    .filter((option) => option.text)
}

function cleanAnswers(answers) {
  if (Array.isArray(answers)) return answers.map((answer) => String(answer).trim()).filter(Boolean)
  if (answers === null || answers === undefined) return []
  return [String(answers).trim()].filter(Boolean)
}

export function sanitizeQuestionPayload(payload = {}) {
  const type = String(payload.type || '').trim().toUpperCase()
  const text = String(payload.text || '').trim()
  const options = cleanOptions(payload.options)
  const correctAnswers = cleanAnswers(payload.correctAnswers)
  const difficulty = difficultyLevels.has(String(payload.difficulty || '').toUpperCase())
    ? String(payload.difficulty).toUpperCase()
    : 'MEDIUM'

  return {
    type,
    text,
    options,
    correctAnswers,
    marks: Math.max(1, Number.parseInt(payload.marks, 10) || 1),
    difficulty,
    courseId: payload.courseId ? String(payload.courseId) : null,
    explanation: String(payload.explanation || '').trim() || null,
    caseSensitive: Boolean(payload.caseSensitive),
  }
}

export function validateQuestionPayload(question) {
  const errors = {}
  if (!questionTypes.has(question.type)) errors.type = 'Select a valid question type.'
  if (!question.text) errors.text = 'Question text cannot be empty.'
  if (question.marks < 1) errors.marks = 'Marks must be at least 1.'

  if (question.type === 'MCQ_SINGLE' || question.type === 'MCQ_MULTIPLE') {
    if (question.options.length < 2) errors.options = 'MCQ questions must contain at least 2 options.'
    const validOptionIds = new Set(question.options.map((option) => option.id))
    const selectedAnswers = question.correctAnswers.filter((answer) => validOptionIds.has(answer))
    if (!selectedAnswers.length) errors.correctAnswers = 'Select the correct answer.'
    if (question.type === 'MCQ_SINGLE' && selectedAnswers.length !== 1) {
      errors.correctAnswers = 'Single-correct MCQ must have exactly one correct answer.'
    }
    question.correctAnswers = selectedAnswers
  }

  if (question.type === 'FILL_BLANK' && !question.correctAnswers.length) {
    errors.correctAnswers = 'Fill in the blanks must have a correct answer.'
  }

  if (question.type === 'DESCRIPTIVE') {
    question.options = []
    question.correctAnswers = []
  }

  return errors
}

export function hideCorrectAnswer(question) {
  const { correctAnswers: _correctAnswers, explanation: _explanation, ...safeQuestion } = question
  return safeQuestion
}

export function evaluateQuestionAnswer(question, answer) {
  if (question.type === 'DESCRIPTIVE') {
    const text = String(answer || '').trim()
    return { correct: null, needsReview: true, wordCount: text ? text.split(/\s+/).length : 0 }
  }

  if (question.type === 'FILL_BLANK') {
    const expected = (question.correctAnswers || []).map(String)
    const provided = String(answer || '').trim()
    const normalize = (value) => question.caseSensitive ? value.trim() : value.trim().toLowerCase()
    return { correct: expected.some((item) => normalize(item) === normalize(provided)) }
  }

  const selected = Array.isArray(answer) ? answer.map(String).sort() : [String(answer || '')].filter(Boolean)
  const correct = (question.correctAnswers || []).map(String).sort()
  return {
    correct: selected.length === correct.length && selected.every((item, index) => item === correct[index]),
  }
}
