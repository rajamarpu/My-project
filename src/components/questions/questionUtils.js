export const QUESTION_TYPE_LABELS = {
  MCQ_SINGLE: 'MCQ - Single Correct',
  MCQ_MULTIPLE: 'MCQ - Multiple Correct',
  FILL_BLANK: 'Fill in the Blanks',
  DESCRIPTIVE: 'Descriptive / Essay',
}

export const DIFFICULTY_LABELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
}

export function emptyQuestion(type = 'MCQ_SINGLE') {
  return {
    type,
    text: '',
    options: [
      { id: 'option-1', text: '' },
      { id: 'option-2', text: '' },
      { id: 'option-3', text: '' },
      { id: 'option-4', text: '' },
    ],
    correctAnswers: [],
    marks: 1,
    difficulty: 'MEDIUM',
    caseSensitive: false,
    explanation: '',
    courseId: '',
  }
}

export function normalizeQuestionForForm(question) {
  if (!question) return emptyQuestion()
  const type = question.type || 'MCQ_SINGLE'
  return {
    ...emptyQuestion(type),
    ...question,
    options: question.options?.length ? question.options : emptyQuestion(type).options,
    correctAnswers: question.correctAnswers || [],
    courseId: question.courseId || '',
    explanation: question.explanation || '',
  }
}
