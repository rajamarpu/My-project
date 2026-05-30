import { useMemo, useState } from 'react'
import Button from '../common/Button/Button.jsx'
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from './questionUtils.js'

export function QuestionPreview({ question, showAnswers = true }) {
  const options = question.options || []
  const answers = new Set(question.correctAnswers || [])
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-lg bg-cyan-500/10 px-2 py-1 font-semibold text-cyan-700 dark:text-cyan-200">{QUESTION_TYPE_LABELS[question.type]}</span>
        <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">{DIFFICULTY_LABELS[question.difficulty] || question.difficulty}</span>
        <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">{question.marks || 1} marks</span>
      </div>
      <p className="mt-3 whitespace-pre-line font-semibold leading-7 text-[var(--text-primary)]">{question.text || 'Question text preview'}</p>

      {question.type === 'MCQ_SINGLE' ? (
        <div className="mt-4 grid gap-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-2 text-sm">
              <input type="radio" checked={showAnswers && answers.has(option.id)} readOnly />
              <span>{option.text || 'Option'}</span>
            </label>
          ))}
        </div>
      ) : null}

      {question.type === 'MCQ_MULTIPLE' ? (
        <div className="mt-4 grid gap-2">
          {options.map((option) => (
            <label key={option.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-2 text-sm">
              <input type="checkbox" checked={showAnswers && answers.has(option.id)} readOnly />
              <span>{option.text || 'Option'}</span>
            </label>
          ))}
        </div>
      ) : null}

      {question.type === 'FILL_BLANK' ? (
        <div className="mt-4">
          <input className="admin-input" readOnly placeholder="Student answer" />
          {showAnswers ? <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-200">Answer: {(question.correctAnswers || []).join(', ')}</p> : null}
        </div>
      ) : null}

      {question.type === 'DESCRIPTIVE' ? (
        <textarea className="admin-input mt-4 min-h-36" readOnly placeholder="Student writes a long-form answer here." />
      ) : null}
    </div>
  )
}

export function StudentQuestionCard({ question, onSubmit }) {
  const [answer, setAnswer] = useState(question.type === 'MCQ_MULTIPLE' ? [] : '')
  const [result, setResult] = useState(null)
  const wordCount = useMemo(() => {
    if (question.type !== 'DESCRIPTIVE') return 0
    const value = String(answer || '').trim()
    return value ? value.split(/\s+/).length : 0
  }, [answer, question.type])

  async function submit() {
    const next = await onSubmit(question.id, answer)
    setResult(next)
  }

  return (
    <div className="theme-card rounded-lg p-5">
      <QuestionPreview question={question} showAnswers={false} />
      <div className="mt-4">
        {question.type === 'MCQ_SINGLE' ? (
          <div className="grid gap-2">
            {(question.options || []).map((option) => (
              <label key={option.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] px-3 py-2">
                <input type="radio" name={question.id} checked={answer === option.id} onChange={() => setAnswer(option.id)} />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        ) : null}

        {question.type === 'MCQ_MULTIPLE' ? (
          <div className="grid gap-2">
            {(question.options || []).map((option) => (
              <label key={option.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] px-3 py-2">
                <input
                  type="checkbox"
                  checked={answer.includes(option.id)}
                  onChange={(event) => setAnswer((current) => event.target.checked ? [...current, option.id] : current.filter((id) => id !== option.id))}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        ) : null}

        {question.type === 'FILL_BLANK' ? (
          <input className="admin-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" />
        ) : null}

        {question.type === 'DESCRIPTIVE' ? (
          <div>
            <textarea className="admin-input min-h-44" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your answer" />
            <p className="mt-2 text-xs text-[var(--text-muted)]">{wordCount} words</p>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={submit}>Submit Answer</Button>
        {result ? (
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            {result.needsReview ? `Submitted for review (${result.wordCount || 0} words)` : result.correct ? 'Correct answer' : 'Incorrect answer'}
          </span>
        ) : null}
      </div>
    </div>
  )
}
