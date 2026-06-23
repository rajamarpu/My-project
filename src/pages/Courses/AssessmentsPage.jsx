import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CheckCircle2, ClipboardList, Eye, FileText, LockKeyhole, RotateCcw, Timer, XCircle } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchCourseById, fetchLearnerDashboard, fetchMyAssessmentSubmissions, fetchQuestions, submitStructuredAssessment } from '../../api/api.js'
import { getCourseAssignments } from '../../utils/courseContent.js'
import { notifyDashboardRefresh } from '../../utils/dashboardRefresh.js'

export default function AssessmentsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const role = useSelector((state) => state.auth.role)
  const isInstructor = role === 'instructor' || role === 'admin'
  const [course, setCourse] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [retakeGrants, setRetakeGrants] = useState([])
  const [localItems, setLocalItems] = useState([])
  const [bankQuestions, setBankQuestions] = useState([])
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [answers, setAnswers] = useState({})
  const [selectedReview, setSelectedReview] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      if (courseId) {
        const courseResponse = await fetchCourseById(courseId)
        const nextCourse = courseResponse.data.course
        setCourse(nextCourse)
        setEnrolledCourses([])
        if (!nextCourse?.isEnrolled && !isInstructor) {
          setSubmissions([])
          setRetakeGrants([])
          setBankQuestions([])
          return
        }
        const [submissionsResponse, bankResponse] = await Promise.all([
          fetchMyAssessmentSubmissions({ courseId }),
          fetchQuestions({ courseId, page: 1, pageSize: 50 }).catch(() => ({ data: { questions: [] } })),
        ])
        setSubmissions(submissionsResponse.data.submissions || [])
        setRetakeGrants(submissionsResponse.data.retakeGrants || [])
        setBankQuestions(bankResponse.data.questions || [])
        return
      }

      const dashboardResponse = await fetchLearnerDashboard()
      const enrollments = dashboardResponse.data?.dashboard?.enrollments || []
      const nextCourses = enrollments
        .map((enrollment) => ({
          ...enrollment.course,
          enrollment,
          progress: Number(enrollment?.completionPct ?? enrollment?.progress ?? 0),
          isEnrolled: true,
        }))
        .filter((item) => item?.id)
      setCourse(null)
      setEnrolledCourses(nextCourses)

      const [submissionsResponse] = await Promise.all([
        fetchMyAssessmentSubmissions().catch(() => ({ data: { submissions: [], retakeGrants: [] } })),
      ])
      setSubmissions(submissionsResponse.data.submissions || [])
      setRetakeGrants(submissionsResponse.data.retakeGrants || [])
      setBankQuestions([])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load assignments.')
    } finally {
      setLoading(false)
    }
  }, [courseId, isInstructor])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)
    const refreshInterval = window.setInterval(() => {
      void loadData()
    }, 30000)
    const handleFocus = () => { void loadData() }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void loadData()
    }
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(refreshInterval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadData])

  const scopedCourses = useMemo(() => {
    if (courseId) return course ? [course] : []
    return enrolledCourses
  }, [course, courseId, enrolledCourses])
  const persistedAssignments = useMemo(
    () => scopedCourses.flatMap((scopedCourse) => getCourseAssignments(scopedCourse).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      prompt: assignment.quizJson?.prompt || assignment.description || '',
      questionsText: assignment.quizJson?.questionsText || '',
      questions: assignment.quizJson?.questions || [],
      resources: assignment.quizJson?.resources || [],
      durationMin: assignment.durationMin,
      status: 'Open',
      persisted: true,
      course: scopedCourse,
      courseId: scopedCourse.id,
    }))),
    [scopedCourses],
  )
  const questionBankItem = useMemo(() => {
    if (!bankQuestions.length || !courseId) return null
    return {
      id: `question-bank-${courseId}`,
      title: 'Question bank practice',
      prompt: `${bankQuestions.length} admin-created question${bankQuestions.length === 1 ? '' : 's'} assigned to this course are ready for learner practice.`,
      questions: bankQuestions,
      resources: [],
      durationMin: Math.max(10, Math.min(60, bankQuestions.length * 3)),
      status: 'Practice',
      persisted: true,
      bankPractice: true,
    }
  }, [bankQuestions, courseId])
  const items = useMemo(() => [
    ...localItems,
    ...(questionBankItem ? [questionBankItem] : []),
    ...persistedAssignments,
  ], [localItems, persistedAssignments, questionBankItem])

  const submissionsByAssignment = useMemo(() => {
    const grouped = {}
    submissions.forEach((submission) => {
      if (!grouped[submission.assignmentId]) grouped[submission.assignmentId] = []
      grouped[submission.assignmentId].push(submission)
    })
    return grouped
  }, [submissions])

  const retakeGrantsByAssignment = useMemo(() => {
    const grouped = {}
    retakeGrants.forEach((grant) => {
      grouped[grant.assignmentId] = grant
    })
    return grouped
  }, [retakeGrants])

  const addAssessment = (event) => {
    event.preventDefault()
    if (!title.trim() || !prompt.trim()) return
    setLocalItems((prev) => [{ id: `a${Date.now()}`, title, prompt, questionsText: '', questions: [], resources: [], status: 'Open', persisted: false }, ...prev])
    setTitle('')
    setPrompt('')
    setMessage('Assignment added to this page preview. Add persistent assignments from Admin > Edit Course.')
  }

  const submitAnswer = async (event, itemId) => {
    event.preventDefault()
    const item = items.find((entry) => entry.id === itemId)
    const attemptCount = (submissionsByAssignment[itemId] || []).length
    const maxAttempts = maxAttemptsForItem(item, retakeGrantsByAssignment[itemId])
    if (item?.persisted && attemptCount >= maxAttempts) {
      setMessage(maxAttempts === 1
        ? 'You have already submitted this assignment. Admin must enable another attempt before you can retake it.'
        : 'You have used all allowed attempts for this assignment.')
      return
    }
    if (!hasAnswer(item, answers)) return

    if (!item.persisted) {
      setAnswers((current) => clearItemAnswers(current, item))
      setMessage('Preview assignment submitted.')
      return
    }

    try {
      setSubmittingId(itemId)
      setMessage('')
      const payload = buildSubmissionPayload(item, answers)
      const response = await submitStructuredAssessment({
        courseId: item.courseId || courseId,
        assignmentId: item.id,
        answers: payload,
      })
      setSelectedReview(response.data.submission)
      setAnswers((current) => clearItemAnswers(current, item))
      setMessage('Assignment submitted successfully. Review is ready.')
      notifyDashboardRefresh({ source: 'assessment-submit', courseId: item.courseId || courseId, assignmentId: item.id })
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not submit assignment.')
    } finally {
      setSubmittingId('')
    }
  }

  if (loading) {
    return <div className="glass-card p-8 text-[var(--text-secondary)]">Loading assignments...</div>
  }

  if (!courseId && !scopedCourses.length && !isInstructor) {
    return (
      <section className="space-y-6 pb-16">
        <div className="glass-card p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Assignments</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">All assignments</h1>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            Enroll in a course to see its assignments here. Once you join multiple courses, this page will list every assignment across all of them.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => navigate('/courses')}>Browse Courses</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>
      </section>
    )
  }

  if (courseId && !course?.isEnrolled && !isInstructor) {
    return (
      <section className="space-y-6 pb-16">
        <div className="glass-card p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Assignments locked</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{course?.title || 'Course'} assignments</h1>
          <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
            Assignments are available only after enrollment. You can still view the course details and enroll from the course page.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => navigate(`/course/${courseId}`)}>View Course</Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/courses')}>Browse Courses</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="learner-dashboard-v2 space-y-8 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Assignments</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
          {courseId ? `${course?.title || 'Course'} assignments` : 'All course assignments'}
        </h1>
        {!courseId ? (
          <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
            Browse every assignment from every course you are enrolled in, including reopened retakes and open submissions.
          </p>
        ) : null}
      </div>

      {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-700 dark:text-red-100">{error}</p> : null}
      {message ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-200">{message}</p> : null}
      {selectedReview ? <AssessmentReview submission={selectedReview} onClose={() => setSelectedReview(null)} /> : null}

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
        {items.length ? items.map((item) => {
          const history = submissionsByAssignment[item.id] || []
          const retakeGrant = retakeGrantsByAssignment[item.id]
          const maxAttempts = maxAttemptsForItem(item, retakeGrant)
          const attemptsUsed = history.length
          const canAttempt = !item.persisted || attemptsUsed < maxAttempts
          const reopened = Boolean(retakeGrant?.extraAttempts)
          return (
            <article key={item.id} className="glass-card p-5 shadow-soft">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge icon={canAttempt ? ClipboardList : LockKeyhole} label={canAttempt ? 'Open assignment' : 'Closed'} tone={canAttempt ? 'open' : 'closed'} />
                    {reopened ? <StatusBadge icon={RotateCcw} label="Retake opened" tone="reopened" /> : null}
                    {item.course?.title ? <StatusBadge icon={ClipboardList} label={item.course.title} tone="open" /> : null}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-slate-600 dark:text-slate-300">{item.prompt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    {item.durationMin ? `${item.durationMin} min` : item.status}
                  </span>
                  <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                    Attempts {Math.min(attemptsUsed, maxAttempts)}/{maxAttempts}
                  </span>
                </div>
              </div>

              {item.questionsText ? (
                <div className="mt-4 whitespace-pre-line rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-900 dark:text-amber-100">
                  {item.questionsText}
                </div>
              ) : null}

              <Resources resources={item.resources} />

              {history.length ? (
                <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Submission history</p>
                  <div className="mt-3 grid gap-2">
                    {history.map((submission) => (
                      <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2">
                        <span className="text-sm text-[var(--text-secondary)]">
                          Attempt {submission.attemptNumber} | {new Date(submission.submittedAt).toLocaleString()} | {submission.obtainedMarks}/{submission.totalMarks}
                        </span>
                        <Button type="button" variant="secondary" onClick={() => setSelectedReview(submission)}>
                          <Eye size={16} /> Review Assessment
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {canAttempt ? (
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
                  <Button type="submit" disabled={!hasAnswer(item, answers) || submittingId === item.id}>
                    {submittingId === item.id ? 'Submitting...' : 'Submit Assignment'}
                  </Button>
                </form>
              ) : (
                <div className="mt-5 flex flex-col gap-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-100 sm:flex-row sm:items-start">
                  <LockKeyhole className="shrink-0" size={18} />
                  <div>
                    <p className="font-semibold">This assignment is closed for you.</p>
                    <p className="mt-1 text-amber-700 dark:text-amber-100/80">Ask an admin to reopen a retake from your submission record if you need another attempt.</p>
                  </div>
                </div>
              )}
            </article>
          )
        }) : (
          <div className="glass-card p-8 text-center text-[var(--text-secondary)]">
            No assignments have been added for this course yet.
          </div>
        )}
      </div>
    </section>
  )
}

function StatusBadge({ icon: Icon, label, tone }) {
  const styles = {
    open: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100',
    closed: 'border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-100',
    reopened: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${styles}`}>
      {Icon ? <Icon size={14} /> : null}
      {label}
    </span>
  )
}

function Resources({ resources = [] }) {
  if (!resources.length) return null
  return (
    <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-white/70 p-4 dark:bg-slate-950/40">
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Attached files</p>
      <div className="mt-3 grid gap-2">
        {resources.map((resource, index) => (
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
  )
}

function AssessmentReview({ submission, onClose }) {
  const reviews = submission.questionReviews || []
  const statusLabel = submission.status === 'PENDING_EVALUATION' ? 'Pending Evaluation' : submission.status === 'PASSED' ? 'Pass' : 'Fail'
  return (
    <div className="glass-card space-y-5 p-5 shadow-glow">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent-primary)]">Assessment review</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{submission.assignmentName}</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Attempt {submission.attemptNumber} | {new Date(submission.submittedAt).toLocaleString()}</p>
        </div>
        <Button type="button" variant="secondary" onClick={onClose}>Close Review</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Total Questions" value={reviews.length} />
        <SummaryTile label="Obtained Marks" value={`${submission.obtainedMarks}/${submission.totalMarks}`} />
        <SummaryTile label="Percentage" value={`${submission.percentage}%`} />
        <SummaryTile label="Status" value={statusLabel} />
        <SummaryTile label="Correct Answers" value={submission.correctCount} />
        <SummaryTile label="Wrong Answers" value={submission.wrongCount} />
        <SummaryTile label="Skipped Questions" value={submission.skippedCount} />
        <SummaryTile label="Completion Time" value={formatDuration(submission.completionTimeSec)} icon={Timer} />
      </div>

      <div className="grid gap-4">
        {reviews.map((review, index) => <ReviewCard key={review.questionId || index} review={review} index={index} />)}
      </div>
    </div>
  )
}

function SummaryTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{Icon ? <Icon size={14} /> : null}{label}</p>
      <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{value ?? '-'}</p>
    </div>
  )
}

function ReviewCard({ review, index }) {
  const isCorrect = review.result === 'CORRECT' || review.result === 'EVALUATED'
  const isPending = review.result === 'PENDING_EVALUATION'
  const styles = isPending
    ? 'border-amber-400/50 bg-amber-500/10'
    : isCorrect
      ? 'border-emerald-400/60 bg-emerald-500/10'
      : 'border-red-400/60 bg-red-500/10'
  const Icon = isCorrect ? CheckCircle2 : XCircle
  const label = isPending ? 'Pending Evaluation' : isCorrect ? 'Correct' : 'Incorrect'
  return (
    <article className={`rounded-lg border p-5 ${styles}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Question {index + 1}</p>
          <h3 className="mt-2 whitespace-pre-line text-lg font-semibold text-[var(--text-primary)]">{review.questionText}</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-primary)] px-3 py-1 text-sm font-semibold text-[var(--text-primary)]">
          {isPending ? null : <Icon size={16} />}
          {label}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <AnswerBox label="Your Answer" value={review.studentAnswerText || review.studentAnswer} />
        <AnswerBox label={review.questionType === 'DESCRIPTIVE' ? 'Model Answer' : 'Correct Answer'} value={review.correctAnswer || review.modelAnswer || 'Awaiting model answer'} />
        <AnswerBox label="Result" value={label} />
        <AnswerBox label="Marks Awarded" value={`${review.marksAwarded || 0}/${review.marks || 0}`} />
        {review.adminRemarks ? <AnswerBox label="Admin Remarks" value={review.adminRemarks} wide /> : null}
      </div>
    </article>
  )
}

function AnswerBox({ label, value, wide }) {
  return (
    <div className={`rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-medium text-[var(--text-primary)]">{String(value || 'Not answered')}</p>
    </div>
  )
}

function answerKey(itemId, question) {
  return `${itemId}:${question.id || question.text}`
}

function buildSubmissionPayload(item, currentAnswers) {
  if (!item.questions?.length) return { response: currentAnswers[item.id] || '' }
  return item.questions.reduce((payload, question) => {
    payload[question.id || question.text] = currentAnswers[answerKey(item.id, question)]
    return payload
  }, {})
}

function hasAnswer(item, currentAnswers) {
  if (!item) return false
  if (!item.questions?.length) return Boolean(currentAnswers[item.id]?.trim())
  return item.questions.every((question) => {
    const value = currentAnswers[answerKey(item.id, question)]
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

function maxAttemptsForItem(_item, retakeGrant) {
  const extraAttempts = Number.parseInt(retakeGrant?.extraAttempts, 10)
  return 1 + (Number.isInteger(extraAttempts) && extraAttempts > 0 ? extraAttempts : 0)
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
    <div className="rounded-lg border border-[var(--border-color)] bg-white/75 p-4 dark:bg-slate-950/40">
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
              <input type="radio" name={key} checked={value === option.id} onChange={() => setValue(option.id)} className="h-4 w-4 accent-indigo-500" />
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
                  onChange={() => setValue(selected.includes(option.id) ? selected.filter((id) => id !== option.id) : [...selected, option.id])}
                  className="h-4 w-4 accent-indigo-500"
                />
                {option.text}
              </label>
            )
          })}
        </div>
      ) : null}

      {question.type === 'FILL_BLANK' ? (
        <input value={value || ''} onChange={(event) => setValue(event.target.value)} className="admin-input mt-4" placeholder="Type your answer" />
      ) : null}

      {question.type === 'DESCRIPTIVE' ? (
        <div className="mt-4 space-y-2">
          <textarea value={value || ''} onChange={(event) => setValue(event.target.value)} className="admin-input min-h-40" placeholder="Write your answer" />
          <p className="text-right text-xs text-[var(--text-muted)]">{countWords(value || '')} words</p>
        </div>
      ) : null}
    </div>
  )
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

function formatDuration(seconds) {
  if (!seconds) return '-'
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`
}
