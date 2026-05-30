import { useEffect, useState } from 'react'
import Button from '../../components/common/Button/Button.jsx'
import { AdminEmptyState, AdminLoadingState, AdminNotice } from '../../components/admin/AdminUI.jsx'
import { StudentQuestionCard } from '../../components/questions/QuestionRenderer.jsx'
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from '../../components/questions/questionUtils.js'
import { fetchQuestions, validateQuestionAnswer } from '../../api/api.js'

export default function QuestionPracticePage() {
  const [questions, setQuestions] = useState([])
  const [filters, setFilters] = useState({ type: 'ALL', difficulty: 'ALL', page: 1, pageSize: 10 })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadQuestions() {
    try {
      setLoading(true)
      setError('')
      const response = await fetchQuestions(filters)
      setQuestions(response.data.questions || [])
      setPagination(response.data.pagination || pagination)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load practice questions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuestions()
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.difficulty, filters.page])

  async function submitAnswer(id, answer) {
    const response = await validateQuestionAnswer(id, answer)
    return response.data.result
  }

  return (
    <section className="space-y-6 pb-16">
      <div className="glass-card p-6 shadow-glow lg:p-8">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Question practice</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">Online examination question bank</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Practice MCQs, fill-in-the-blank questions, and descriptive responses with the same controls learners see during exams.
        </p>
      </div>

      <AdminNotice type="error">{error}</AdminNotice>

      <div className="theme-card grid gap-3 rounded-lg p-4 sm:grid-cols-2 lg:grid-cols-[220px_180px_auto]">
        <select className="admin-input" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}>
          <option value="ALL">All question types</option>
          {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className="admin-input" value={filters.difficulty} onChange={(event) => setFilters((current) => ({ ...current, difficulty: event.target.value, page: 1 }))}>
          <option value="ALL">All difficulty</option>
          {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Button type="button" variant="secondary" onClick={loadQuestions} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</Button>
      </div>

      {loading ? <AdminLoadingState label="Loading practice questions..." /> : null}
      {!loading && !questions.length ? <AdminEmptyState title="No questions available" message="Ask an admin to add questions to the question bank." /> : null}

      <div className="grid gap-4">
        {questions.map((question) => (
          <StudentQuestionCard key={question.id} question={question} onSubmit={submitAnswer} />
        ))}
      </div>

      <div className="theme-card flex flex-wrap items-center justify-between gap-3 rounded-lg p-4">
        <p className="text-sm text-[var(--text-secondary)]">Page {pagination.page} of {pagination.totalPages} | {pagination.total} questions</p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button>
          <Button type="button" variant="secondary" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button>
        </div>
      </div>
    </section>
  )
}
