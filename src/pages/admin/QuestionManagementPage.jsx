import { useEffect, useMemo, useState } from 'react'
import { BarChart3, ClipboardCheck, Edit3, Plus, Search, Tags, Trash2, Upload } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { AdminEmptyState, AdminGuidancePanel, AdminInsightStrip, AdminLoadingState, AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'
import { QuestionPreview } from '../../components/questions/QuestionRenderer.jsx'
import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS, emptyQuestion, normalizeQuestionForForm } from '../../components/questions/questionUtils.js'
import { bulkImportQuestions, createQuestion, deleteQuestion, fetchAdminCourses, fetchQuestions, updateQuestion } from '../../api/api.js'

const questionTypes = Object.keys(QUESTION_TYPE_LABELS)
const difficulties = Object.keys(DIFFICULTY_LABELS)

export default function QuestionManagementPage() {
  const [questions, setQuestions] = useState([])
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState(emptyQuestion())
  const [editingId, setEditingId] = useState('')
  const [filters, setFilters] = useState({ search: '', type: 'ALL', difficulty: 'ALL', courseId: 'ALL', page: 1, pageSize: 10 })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importCourseId, setImportCourseId] = useState('')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([])

  const selectedFilterCourseId = filters.courseId !== 'ALL' ? filters.courseId : ''
  const newDraft = (courseId = selectedFilterCourseId) => ({ ...emptyQuestion(), courseId })

  async function loadQuestions(nextFilters = filters) {
    try {
      setLoading(true)
      const query = { ...nextFilters }
      if (query.courseId === 'ALL') delete query.courseId
      const response = await fetchQuestions(query)
      setQuestions(response.data.questions || [])
      setPagination(response.data.pagination || pagination)
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not load questions.' })
    } finally {
      setLoading(false)
    }
  }

  async function loadCourses() {
    try {
      const response = await fetchAdminCourses()
      setCourses(response.data.courses || [])
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not load courses for question assignment.' })
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadCourses()
    }, 0)
    return () => window.clearTimeout(initial)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQuestions()
    }, 250)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.type, filters.difficulty, filters.courseId, filters.page, filters.pageSize])

  const previewQuestion = useMemo(() => normalizeQuestionForForm(form), [form])
  const questionMetrics = useMemo(() => {
    const descriptive = questions.filter((question) => question.type === 'DESCRIPTIVE').length
    const mcq = questions.filter((question) => String(question.type).includes('MCQ')).length
    const hard = questions.filter((question) => question.difficulty === 'HARD').length
    const courseCoverage = new Set(questions.map((question) => question.course?.id || question.courseId).filter(Boolean)).size
    return [
      { label: 'Visible questions', value: questions.length, detail: `${pagination.total} total in filter`, icon: ClipboardCheck },
      { label: 'MCQ coverage', value: mcq, detail: 'auto-gradable items', icon: BarChart3 },
      { label: 'Manual review', value: descriptive, detail: 'descriptive questions', icon: Edit3 },
      { label: 'Hard questions', value: hard, detail: `${courseCoverage} course${courseCoverage === 1 ? '' : 's'} covered`, icon: Tags },
    ]
  }, [pagination.total, questions])

  function update(key, value) {
    if (key === 'type') {
      setForm({ ...emptyQuestion(value), type: value, marks: form.marks, difficulty: form.difficulty, courseId: form.courseId })
      setErrors({})
      return
    }
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateOption(index, value) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? { ...option, text: value } : option),
    }))
  }

  function addOption() {
    setForm((current) => ({
      ...current,
      options: [...current.options, { id: `option-${current.options.length + 1}`, text: '' }],
    }))
  }

  function removeOption(index) {
    setForm((current) => {
      const removed = current.options[index]
      return {
        ...current,
        options: current.options.filter((_, optionIndex) => optionIndex !== index),
        correctAnswers: current.correctAnswers.filter((answer) => answer !== removed?.id),
      }
    })
  }

  function chooseCorrect(optionId, checked) {
    setForm((current) => {
      if (current.type === 'MCQ_SINGLE') return { ...current, correctAnswers: [optionId] }
      return {
        ...current,
        correctAnswers: checked
          ? [...new Set([...current.correctAnswers, optionId])]
          : current.correctAnswers.filter((answer) => answer !== optionId),
      }
    })
  }

  function validate() {
    const nextErrors = {}
    if (!form.courseId) nextErrors.courseId = 'Select the course this question belongs to.'
    if (!form.text.trim()) nextErrors.text = 'Question text cannot be empty.'
    if (form.type.includes('MCQ')) {
      const filledOptions = form.options.filter((option) => option.text.trim())
      if (filledOptions.length < 2) nextErrors.options = 'MCQs must contain at least 2 options.'
      if (!form.correctAnswers.length) nextErrors.correctAnswers = 'Select the correct answer.'
      if (form.type === 'MCQ_SINGLE' && form.correctAnswers.length !== 1) nextErrors.correctAnswers = 'Select exactly one correct answer.'
    }
    if (form.type === 'FILL_BLANK' && !form.correctAnswers[0]?.trim()) nextErrors.correctAnswers = 'Correct answer is required.'
    if (form.type === 'DESCRIPTIVE' && !form.correctAnswers[0]?.trim()) nextErrors.correctAnswers = 'Model answer is required.'
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  async function submit(event) {
    event.preventDefault()
    setNotice({ type: '', message: '' })
    if (!validate()) return

    const payload = {
      ...form,
      options: form.type.includes('MCQ') ? form.options.filter((option) => option.text.trim()) : [],
      correctAnswers: ['FILL_BLANK', 'DESCRIPTIVE'].includes(form.type) ? [form.correctAnswers[0]] : form.correctAnswers,
      marks: Number(form.marks || 1),
    }

    try {
      setSaving(true)
      if (editingId) await updateQuestion(editingId, payload)
      else await createQuestion(payload)
      setNotice({ type: 'success', message: editingId ? 'Question updated.' : 'Question added.' })
      setEditingId('')
      setForm(newDraft())
      await loadQuestions()
    } catch (err) {
      setErrors(err?.response?.data?.errors || {})
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not save question.' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(question) {
    if (!window.confirm('Delete this question?')) return
    await deleteQuestion(question.id)
    setNotice({ type: 'success', message: 'Question deleted.' })
    await loadQuestions()
  }

  async function bulkRemoveSelected() {
    if (!selectedQuestionIds.length) return
    if (!window.confirm(`Delete ${selectedQuestionIds.length} selected question${selectedQuestionIds.length === 1 ? '' : 's'}?`)) return
    await Promise.all(selectedQuestionIds.map((id) => deleteQuestion(id)))
    setSelectedQuestionIds([])
    setNotice({ type: 'success', message: 'Selected questions deleted.' })
    await loadQuestions()
  }

  async function importQuestions() {
    try {
      if (!importCourseId) {
        setNotice({ type: 'error', message: 'Select a course before importing questions.' })
        return
      }
      const parsed = JSON.parse(importText)
      const rows = Array.isArray(parsed) ? parsed : parsed.questions
      if (!Array.isArray(rows) || !rows.length) {
        setNotice({ type: 'error', message: 'Import JSON must be an array or an object with a questions array.' })
        return
      }
      const response = await bulkImportQuestions(rows.map((question) => ({ ...question, courseId: question.courseId || importCourseId })))
      setNotice({ type: 'success', message: `Imported ${response.data.imported} questions. Rejected: ${response.data.rejected?.length || 0}.` })
      setImportText('')
      setImportCourseId('')
      setShowImport(false)
      await loadQuestions()
    } catch (err) {
      setNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Import must be valid JSON.' })
    }
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Question bank"
        title="Question Management System"
        description="Create MCQ, fill-in-the-blank, and descriptive questions with validation, preview, search, filters, and pagination."
        actions={<Button variant="secondary" onClick={() => setShowImport((current) => !current)}><Upload size={16} /> Bulk Import</Button>}
      />
      <AdminNotice type={notice.type || 'info'}>{notice.message}</AdminNotice>

      <AdminInsightStrip items={questionMetrics} />
      <AdminGuidancePanel
        title="Assessment bank workflow"
        items={[
          'Use course, type, and difficulty filters before bulk operations.',
          'Preview every question before publishing it into assessments.',
          'Keep a balanced mix of easy, medium, and hard questions per course.',
        ]}
      />

      {showImport ? (
        <div className="admin-panel p-5">
          <p className="font-semibold text-[var(--text-primary)]">Bulk import JSON</p>
          <label className="admin-label mt-3">
            Assign imported questions to course
            <select className="admin-input" value={importCourseId} onChange={(event) => setImportCourseId(event.target.value)}>
              <option value="">Select course / subject</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <textarea className="admin-input mt-3 min-h-44" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder='[{"type":"FILL_BLANK","text":"React is a ____ library.","correctAnswers":["JavaScript"],"marks":1,"difficulty":"EASY"}]' />
          <div className="mt-3 flex gap-3">
            <Button type="button" onClick={importQuestions}>Import Questions</Button>
            <Button type="button" variant="secondary" onClick={() => setShowImport(false)}>Cancel</Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={submit} className="admin-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.22em]">{editingId ? 'Edit question' : 'Add question'}</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Question builder</h2>
            </div>
            <Button type="button" variant="secondary" onClick={() => { setEditingId(''); setForm(newDraft()); setErrors({}) }}><Plus size={16} /> New</Button>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="admin-label">
              Course / subject
              <select className="admin-input" value={form.courseId} onChange={(event) => update('courseId', event.target.value)}>
                <option value="">Select course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <FieldError>{errors.courseId}</FieldError>
            </label>

            <label className="admin-label">
              Question type
              <select className="admin-input" value={form.type} onChange={(event) => update('type', event.target.value)}>
                {questionTypes.map((type) => <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>)}
              </select>
              <FieldError>{errors.type}</FieldError>
            </label>

            <label className="admin-label">
              Question text
              <textarea className="admin-input min-h-28" value={form.text} onChange={(event) => update('text', event.target.value)} placeholder={form.type === 'FILL_BLANK' ? 'Example: React is a ____ library.' : 'Enter the question text'} />
              <FieldError>{errors.text}</FieldError>
            </label>

            {form.type.includes('MCQ') ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Options</p>
                  <Button type="button" variant="secondary" onClick={addOption}>Add Option</Button>
                </div>
                {form.options.map((option, index) => (
                  <div key={option.id} className="grid gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <input
                      type={form.type === 'MCQ_SINGLE' ? 'radio' : 'checkbox'}
                      checked={form.correctAnswers.includes(option.id)}
                      onChange={(event) => chooseCorrect(option.id, event.target.checked)}
                    />
                    <input className="admin-input" value={option.text} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Option ${index + 1}`} />
                    <Button type="button" variant="secondary" onClick={() => removeOption(index)} disabled={form.options.length <= 2}>Remove</Button>
                  </div>
                ))}
                <FieldError>{errors.options || errors.correctAnswers}</FieldError>
              </div>
            ) : null}

            {form.type === 'FILL_BLANK' ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="admin-label">
                  Correct answer
                  <input className="admin-input" value={form.correctAnswers[0] || ''} onChange={(event) => update('correctAnswers', [event.target.value])} placeholder="Accepted answer" />
                  <FieldError>{errors.correctAnswers}</FieldError>
                </label>
                <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--border-color)] px-4 text-sm text-[var(--text-secondary)]">
                  <input type="checkbox" checked={form.caseSensitive} onChange={(event) => update('caseSensitive', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
                  Case sensitive
                </label>
              </div>
            ) : null}

            {form.type === 'DESCRIPTIVE' ? (
              <div className="grid gap-4">
                <label className="admin-label">
                  Model answer / expected answer
                  <textarea
                    className="admin-input min-h-28"
                    value={form.correctAnswers[0] || ''}
                    onChange={(event) => update('correctAnswers', [event.target.value])}
                    placeholder="Write the answer admins can use during manual evaluation."
                  />
                  <FieldError>{errors.correctAnswers}</FieldError>
                </label>
                <label className="admin-label">
                  Evaluation notes
                  <textarea className="admin-input min-h-20" value={form.explanation} onChange={(event) => update('explanation', event.target.value)} placeholder="Optional rubric or marking guidance." />
                </label>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="admin-label">
                Marks
                <input className="admin-input" type="number" min="1" value={form.marks} onChange={(event) => update('marks', event.target.value)} />
              </label>
              <label className="admin-label">
                Difficulty
                <select className="admin-input" value={form.difficulty} onChange={(event) => update('difficulty', event.target.value)}>
                  {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</option>)}
                </select>
              </label>
            </div>

            {form.type !== 'DESCRIPTIVE' ? <label className="admin-label">
              Explanation
              <textarea className="admin-input min-h-20" value={form.explanation} onChange={(event) => update('explanation', event.target.value)} placeholder="Optional explanation shown to staff." />
            </label> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="submit" loading={saving} loadingLabel="Saving...">{editingId ? 'Update Question' : 'Add Question'}</Button>
            <Button type="button" variant="secondary" onClick={() => { setEditingId(''); setForm(newDraft()) }}>Reset</Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="admin-panel p-5">
            <p className="theme-eyebrow text-sm uppercase tracking-[0.22em]">Preview</p>
            <div className="mt-4">
              <QuestionPreview question={previewQuestion} />
            </div>
          </div>

          <div className="admin-panel p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_160px]">
              <label className="theme-subcard flex items-center gap-3 rounded-lg px-4 py-3">
                <Search size={18} />
                <input className="w-full bg-transparent text-sm outline-none" value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder="Search questions" />
              </label>
              <select className="admin-input" value={filters.courseId} onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value, page: 1 }))}>
                <option value="ALL">All courses</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <select className="admin-input" value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))}>
                <option value="ALL">All types</option>
                {questionTypes.map((type) => <option key={type} value={type}>{QUESTION_TYPE_LABELS[type]}</option>)}
              </select>
              <select className="admin-input" value={filters.difficulty} onChange={(event) => setFilters((current) => ({ ...current, difficulty: event.target.value, page: 1 }))}>
                <option value="ALL">All difficulty</option>
                {difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{DIFFICULTY_LABELS[difficulty]}</option>)}
              </select>
            </div>
            {selectedQuestionIds.length ? (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-orange-400/30 bg-orange-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedQuestionIds.length} question{selectedQuestionIds.length === 1 ? '' : 's'} selected for bulk action</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => setSelectedQuestionIds([])}>Clear</Button>
                  <Button type="button" variant="secondary" onClick={bulkRemoveSelected}><Trash2 size={16} /> Delete selected</Button>
                </div>
              </div>
            ) : null}
          </div>

          {loading ? <AdminLoadingState label="Loading questions..." /> : null}
          {!loading && !questions.length ? <AdminEmptyState title="No questions found" message="Create a question or adjust your filters." /> : null}

          <div className="grid gap-3">
            {questions.map((question) => (
              <div key={question.id} className="admin-panel p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <label className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(question.id)}
                          onChange={(event) => setSelectedQuestionIds((current) => event.target.checked ? [...new Set([...current, question.id])] : current.filter((id) => id !== question.id))}
                        />
                        Select
                      </label>
                      <span className="rounded-lg bg-cyan-400/10 px-2 py-1 font-semibold text-cyan-700 dark:text-cyan-200">{QUESTION_TYPE_LABELS[question.type]}</span>
                      <span className="rounded-lg bg-blue-500/10 px-2 py-1 font-semibold text-blue-700 dark:text-blue-200">{question.course?.title || 'No course'}</span>
                      <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">{DIFFICULTY_LABELS[question.difficulty]}</span>
                      <span className="rounded-lg bg-[var(--bg-subtle)] px-2 py-1 text-[var(--text-muted)]">{question.marks} marks</span>
                    </div>
                    <p className="mt-3 line-clamp-2 font-semibold text-[var(--text-primary)]">{question.text}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Created {new Date(question.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" onClick={() => { setEditingId(question.id); setForm(normalizeQuestionForForm(question)); setErrors({}) }}><Edit3 size={16} /> Edit</Button>
                    <button type="button" onClick={() => remove(question)} className="grid h-10 w-10 place-items-center rounded-lg border border-red-500/30 text-red-600 transition hover:bg-red-500/10 dark:text-red-200" aria-label="Delete question">
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-panel flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-[var(--text-secondary)]">Page {pagination.page} of {pagination.totalPages} | {pagination.total} questions</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</Button>
              <Button type="button" variant="secondary" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
