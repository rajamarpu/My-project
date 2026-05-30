import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ClipboardList, FileText } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchCourseById } from '../../api/api.js'
import { getCourseAssignments } from '../../utils/courseContent.js'

export default function AssessmentsPage() {
  const { courseId } = useParams()
  const role = useSelector((state) => state.auth.role)
  const isInstructor = role === 'instructor' || role === 'admin'
  const [course, setCourse] = useState(null)
  const [localItems, setLocalItems] = useState([])
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [answers, setAnswers] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchCourseById(courseId)
        setCourse(response.data.course)
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Could not load assignments.')
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [courseId])

  const persistedAssignments = useMemo(() => getCourseAssignments(course), [course])
  const items = useMemo(() => [
    ...localItems,
    ...persistedAssignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      prompt: assignment.quizJson?.prompt || assignment.description || '',
      questionsText: assignment.quizJson?.questionsText || '',
      questions: assignment.quizJson?.questions || [],
      resources: assignment.quizJson?.resources || [],
      durationMin: assignment.durationMin,
      status: 'Open',
      persisted: true,
    })),
  ], [localItems, persistedAssignments])

  const addAssessment = (event) => {
    event.preventDefault()
    if (!title.trim() || !prompt.trim()) return
    setLocalItems((prev) => [{ id: `a${Date.now()}`, title, prompt, questionsText: '', questions: [], resources: [], status: 'Open', persisted: false }, ...prev])
    setTitle('')
    setPrompt('')
    setMessage('Assignment added to this page preview. Add persistent assignments from Admin > Edit Course.')
  }

  const submitAnswer = (event, itemId) => {
    event.preventDefault()
    const item = items.find((entry) => entry.id === itemId)
    if (!hasAnswer(item, answers)) return
    setAnswers((current) => clearItemAnswers(current, item))
    setMessage('Assignment submitted successfully.')
  }

  if (loading) {
    return <div className="glass-card p-8 text-[var(--text-secondary)]">Loading assignments...</div>
  }

  return (
    <section className="space-y-8 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Assignments</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">{course?.title || 'Course'} assignments</h1>
      </div>

      {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-700 dark:text-red-100">{error}</p> : null}
      {message ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-200">{message}</p> : null}

      {isInstructor ? (
        <form onSubmit={addAssessment} className="glass-card space-y-4 p-6 shadow-soft">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent-primary)]">Instructor preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Create assignment preview</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Persistent course assignments should be created from the admin course editor.</p>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="admin-input" placeholder="Assignment title" />
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="admin-input min-h-32" placeholder="Assignment prompt" />
          <Button type="submit">Add Preview Assignment</Button>
        </form>
      ) : null}

      <div className="grid gap-4">
        {items.length ? items.map((item) => (
          <article key={item.id} className="glass-card p-5 shadow-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-200">
                  <ClipboardList size={14} />
                  Assignment
                </p>
                <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h2>
                <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">{item.prompt}</p>
              </div>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                {item.durationMin ? `${item.durationMin} min` : item.status}
              </span>
            </div>

            {item.questionsText ? (
              <div className="mt-4 whitespace-pre-line rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-900 dark:text-amber-100">
                {item.questionsText}
              </div>
            ) : null}

            {item.resources?.length ? (
              <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-white/70 p-4 dark:bg-slate-950/40">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Attached files</p>
                <div className="mt-3 grid gap-2">
                  {item.resources.map((resource, index) => (
                    <a
                      key={`${resource.url}-${index}`}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-color)] bg-black/[0.025] px-3 py-2 text-sm text-cyan-700 transition hover:border-cyan-400/50 dark:bg-white/5 dark:text-cyan-200"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium"><FileText size={15} className="mr-2 inline" />{resource.name || resource.url}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{resource.mimeType || 'file'}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <form onSubmit={(event) => submitAnswer(event, item.id)} className="mt-5 space-y-4">
              {item.questions?.length ? (
                <div className="grid gap-4">
                  {item.questions.map((question, questionIndex) => (
                    <AssessmentQuestion
                      key={question.id || questionIndex}
                      itemId={item.id}
                      question={question}
                      questionIndex={questionIndex}
                      answers={answers}
                      setAnswers={setAnswers}
                    />
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[item.id] || ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [item.id]: event.target.value }))}
                  className="admin-input min-h-36"
                  placeholder="Write your assignment response"
                />
              )}
              <Button type="submit" disabled={!hasAnswer(item, answers)}>Submit Assignment</Button>
            </form>
          </article>
        )) : (
          <div className="glass-card p-8 text-center text-[var(--text-secondary)]">
            No assignments have been added for this course yet.
          </div>
        )}
      </div>
    </section>
  )
}

function answerKey(itemId, question) {
  return `${itemId}:${question.id || question.text}`
}

function hasAnswer(item, answers) {
  if (!item) return false
  if (!item.questions?.length) return Boolean(answers[item.id]?.trim())
  return item.questions.every((question) => {
    const value = answers[answerKey(item.id, question)]
    if (question.type === 'MCQ_MULTIPLE') return Array.isArray(value) && value.length > 0
    return Boolean(String(value || '').trim())
  })
}

function clearItemAnswers(current, item) {
  if (!item?.questions?.length) return { ...current, [item.id]: '' }
  const next = { ...current }
  item.questions.forEach((question) => {
    delete next[answerKey(item.id, question)]
  })
  return next
}

function AssessmentQuestion({ itemId, question, questionIndex, answers, setAnswers }) {
  const key = answerKey(itemId, question)
  const typeLabel = {
    MCQ_SINGLE: 'Single correct',
    MCQ_MULTIPLE: 'Multiple correct',
    FILL_BLANK: 'Fill in the blank',
    DESCRIPTIVE: 'Descriptive',
  }[question.type] || 'Question'
  const value = answers[key]
  const setValue = (nextValue) => setAnswers((current) => ({ ...current, [key]: nextValue }))

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-white/75 p-4 dark:bg-slate-950/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Question {questionIndex + 1}</p>
          <h3 className="mt-2 whitespace-pre-line text-base font-semibold text-slate-950 dark:text-white">{question.text}</h3>
        </div>
        <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
          {typeLabel}
        </span>
      </div>

      {question.type === 'MCQ_SINGLE' ? (
        <div className="mt-4 grid gap-2">
          {(question.options || []).map((option) => (
            <label key={option.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]">
              <input
                type="radio"
                name={key}
                checked={value === option.id}
                onChange={() => setValue(option.id)}
                className="h-4 w-4 accent-indigo-500"
              />
              {option.text}
            </label>
          ))}
        </div>
      ) : null}

      {question.type === 'MCQ_MULTIPLE' ? (
        <div className="mt-4 grid gap-2">
          {(question.options || []).map((option) => {
            const selected = Array.isArray(value) ? value : []
            return (
              <label key={option.id} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-3 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => {
                    setValue(selected.includes(option.id)
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id])
                  }}
                  className="h-4 w-4 accent-indigo-500"
                />
                {option.text}
              </label>
            )
          })}
        </div>
      ) : null}

      {question.type === 'FILL_BLANK' ? (
        <input
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="admin-input mt-4"
          placeholder="Type your answer"
        />
      ) : null}

      {question.type === 'DESCRIPTIVE' ? (
        <div className="mt-4 space-y-2">
          <textarea
            value={value || ''}
            onChange={(event) => setValue(event.target.value)}
            className="admin-input min-h-40"
            placeholder="Write your answer"
          />
          <p className="text-right text-xs text-[var(--text-muted)]">{countWords(value || '')} words</p>
        </div>
      ) : null}
    </div>
  )
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}
