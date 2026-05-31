import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Save, Search } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { AdminEmptyState, AdminLoadingState, AdminNotice, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import { downloadAssessmentSubmissionUrl, evaluateAssessmentSubmission, fetchAdminAssessmentSubmissions } from '../../api/api.js'

const statusOptions = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING_EVALUATION', label: 'Pending evaluation' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
]

export default function AssessmentEvaluationsPage() {
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'ALL', courseId: '', studentId: '', assignmentId: '', date: '' })
  const [drafts, setDrafts] = useState({})
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadSubmissions(nextFilters = filters) {
    try {
      setLoading(true)
      const response = await fetchAdminAssessmentSubmissions(nextFilters)
      const rows = response.data.submissions || []
      setSubmissions(rows)
      if (selected) setSelected(rows.find((row) => row.id === selected.id) || selected)
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not load submissions.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubmissions()
    }, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.courseId, filters.studentId, filters.assignmentId, filters.date])

  const metrics = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter((submission) => submission.status === 'PENDING_EVALUATION').length,
    passed: submissions.filter((submission) => submission.status === 'PASSED').length,
    failed: submissions.filter((submission) => submission.status === 'FAILED').length,
  }), [submissions])

  function selectSubmission(submission) {
    setSelected(submission)
    const nextDrafts = {}
    ;(submission.questionReviews || []).forEach((review) => {
      if (review.needsManualEvaluation || review.questionType === 'DESCRIPTIVE') {
        nextDrafts[review.questionId] = {
          marksAwarded: review.marksAwarded || 0,
          adminRemarks: review.adminRemarks || '',
        }
      }
    })
    setDrafts(nextDrafts)
  }

  async function saveEvaluation() {
    if (!selected) return
    try {
      setSaving(true)
      const evaluations = Object.entries(drafts).map(([questionId, draft]) => ({
        questionId,
        marksAwarded: Number(draft.marksAwarded || 0),
        adminRemarks: draft.adminRemarks || '',
      }))
      const response = await evaluateAssessmentSubmission(selected.id, evaluations)
      setSelected(response.data.submission)
      setNotice({ type: 'success', message: 'Evaluation saved and results published.' })
      await loadSubmissions()
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not save evaluation.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Assessment evaluations"
        title="Submission and Review Center"
        description="View assignment submissions, inspect answers, evaluate descriptive responses, publish marks, and download submission records."
      />
      <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Total submissions" value={metrics.total} />
        <Metric label="Pending" value={metrics.pending} />
        <Metric label="Passed" value={metrics.passed} />
        <Metric label="Failed" value={metrics.failed} />
      </div>

      <div className="admin-panel grid gap-3 p-4 lg:grid-cols-[1fr_190px_160px_150px_150px_150px]">
        <label className="theme-subcard flex items-center gap-3 rounded-lg px-4 py-3">
          <Search size={18} />
          <input className="w-full bg-transparent text-sm outline-none" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search student, course, assignment" />
        </label>
        <select className="admin-input" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <input className="admin-input" value={filters.courseId} onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value }))} placeholder="Course ID" />
        <input className="admin-input" value={filters.studentId} onChange={(event) => setFilters((current) => ({ ...current, studentId: event.target.value }))} placeholder="Student ID" />
        <input className="admin-input" value={filters.assignmentId} onChange={(event) => setFilters((current) => ({ ...current, assignmentId: event.target.value }))} placeholder="Assignment ID" />
        <input className="admin-input" type="date" value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {loading ? <AdminLoadingState label="Loading submissions..." /> : null}
          {!loading && !submissions.length ? <AdminEmptyState title="No submissions found" message="Try changing filters or wait for learners to submit assignments." /> : null}
          {submissions.map((submission) => (
            <article key={submission.id} className="admin-panel p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <StatusPill status={submission.status} />
                    <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">Attempt {submission.attemptNumber}</span>
                    <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">{submission.obtainedMarks}/{submission.totalMarks} marks</span>
                  </div>
                  <h2 className="mt-3 font-semibold text-[var(--text-primary)]">{submission.assignmentName}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{submission.student?.name} | {submission.course?.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Student ID {submission.studentId} | {new Date(submission.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => selectSubmission(submission)}><Eye size={16} /> View</Button>
                  <a className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-400/50" href={downloadAssessmentSubmissionUrl(submission.id)}>
                    <Download size={16} /> Download
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="admin-panel p-5">
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="theme-eyebrow text-sm uppercase tracking-[0.22em]">Submission detail</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{selected.assignmentName}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{selected.student?.name} answered {selected.questionReviews?.length || 0} questions.</p>
                </div>
                <Button type="button" onClick={saveEvaluation} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Evaluation'}</Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Score" value={`${selected.obtainedMarks}/${selected.totalMarks}`} compact />
                <Metric label="Percentage" value={`${selected.percentage}%`} compact />
                <Metric label="Status" value={selected.status.replaceAll('_', ' ')} compact />
              </div>

              <div className="grid gap-4">
                {(selected.questionReviews || []).map((review, index) => (
                  <ReviewEditor
                    key={review.questionId || index}
                    review={review}
                    index={index}
                    draft={drafts[review.questionId] || { marksAwarded: review.marksAwarded || 0, adminRemarks: review.adminRemarks || '' }}
                    onChange={(nextDraft) => setDrafts((current) => ({ ...current, [review.questionId]: nextDraft }))}
                  />
                ))}
              </div>
            </div>
          ) : (
            <AdminEmptyState title="Select a submission" message="Open a submission to review answers and evaluate descriptive questions." />
          )}
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, compact }) {
  return (
    <div className={`admin-panel ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className={`${compact ? 'text-lg' : 'text-2xl'} mt-2 font-semibold text-[var(--text-primary)]`}>{value}</p>
    </div>
  )
}

function StatusPill({ status }) {
  const className = status === 'PENDING_EVALUATION'
    ? 'bg-amber-400/10 text-amber-700 dark:text-amber-100'
    : status === 'PASSED'
      ? 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-100'
      : 'bg-red-400/10 text-red-700 dark:text-red-100'
  return <span className={`rounded-lg px-2 py-1 font-semibold ${className}`}>{status.replaceAll('_', ' ')}</span>
}

function ReviewEditor({ review, index, draft, onChange }) {
  const manual = review.needsManualEvaluation || review.questionType === 'DESCRIPTIVE'
  return (
    <article className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Question {index + 1}</p>
          <h3 className="mt-2 whitespace-pre-line font-semibold text-[var(--text-primary)]">{review.questionText}</h3>
        </div>
        <span className="rounded-lg bg-[var(--bg-primary)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">{review.result.replaceAll('_', ' ')}</span>
      </div>

      <div className="mt-4 grid gap-3">
        <AnswerBlock label="Student Answer" value={review.studentAnswerText || review.studentAnswer} />
        <AnswerBlock label={review.questionType === 'DESCRIPTIVE' ? 'Model Answer' : 'Correct Answer'} value={review.correctAnswer || review.modelAnswer || 'No model answer saved.'} />
        {manual ? (
          <div className="grid gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 sm:grid-cols-[160px_1fr]">
            <label className="admin-label">
              Marks
              <input
                type="number"
                min="0"
                max={review.marks}
                value={draft.marksAwarded}
                onChange={(event) => onChange({ ...draft, marksAwarded: event.target.value })}
                className="admin-input"
              />
            </label>
            <label className="admin-label">
              Remarks
              <textarea
                value={draft.adminRemarks}
                onChange={(event) => onChange({ ...draft, adminRemarks: event.target.value })}
                className="admin-input min-h-24"
                placeholder="Add evaluation remarks"
              />
            </label>
          </div>
        ) : (
          <AnswerBlock label="Marks Awarded" value={`${review.marksAwarded}/${review.marks}`} />
        )}
      </div>
    </article>
  )
}

function AnswerBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-medium text-[var(--text-primary)]">{String(value || 'Not answered')}</p>
    </div>
  )
}
