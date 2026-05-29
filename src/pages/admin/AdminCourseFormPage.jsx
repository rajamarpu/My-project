import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createCourseRequest, fetchAdminCourses, updateAdminCourse } from '../../api/api.js'
import { AdminLoadingState, AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024

const initialForm = {
  title: '',
  description: '',
  category: '',
  level: 'BEGINNER',
  priceCents: 0,
  thumbnailUrl: '',
  videoPreviewUrl: '',
  isPublished: true,
}

export default function AdminCourseFormPage({ mode = 'create' }) {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (mode !== 'edit' || !courseId) return
    async function loadCourse() {
      try {
        setLoading(true)
        const response = await fetchAdminCourses()
        const course = response.data.courses.find((item) => item.id === courseId)
        if (!course) throw new Error('Course not found.')
        setForm({
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          level: course.level || 'BEGINNER',
          priceCents: course.priceCents || 0,
          thumbnailUrl: course.thumbnailUrl || '',
          videoPreviewUrl: course.videoPreviewUrl || '',
          isPublished: Boolean(course.isPublished),
        })
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load course.')
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [courseId, mode])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  function chooseThumbnail(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the course thumbnail.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      setError('Thumbnail image must be smaller than 2 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      update('thumbnailUrl', String(reader.result || ''))
      setError('')
    }
    reader.onerror = () => setError('Could not read the selected thumbnail image.')
    reader.readAsDataURL(file)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Course title is required.'
    if (!form.description.trim()) nextErrors.description = 'Course description is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required.'
    if (Number(form.priceCents || 0) < 0) nextErrors.priceCents = 'Price cannot be negative.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setError('Please fix the highlighted fields before saving.')
      return
    }
    try {
      setSaving(true)
      const payload = { ...form, priceCents: Number(form.priceCents || 0) }
      if (mode === 'edit') await updateAdminCourse(courseId, payload)
      else await createCourseRequest(payload)
      setSuccess('Course saved successfully.')
      navigate('/admin/courses')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Course save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader eyebrow="Course catalog" title={mode === 'edit' ? 'Edit course' : 'Upload course'} description="Save course details, publication state, preview media, and catalog metadata." />

      <form onSubmit={submit} className="admin-panel p-5 sm:p-6">
        {loading ? <AdminLoadingState label="Loading course..." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Title" value={form.title} error={fieldErrors.title} onChange={(value) => update('title', value)} />
            <Field label="Category" value={form.category} error={fieldErrors.category} onChange={(value) => update('category', value)} />
            <label className="admin-label">
              Level
              <select value={form.level} onChange={(event) => update('level', event.target.value)} className="admin-input">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <Field label="Price in paise" type="number" value={form.priceCents} error={fieldErrors.priceCents} onChange={(value) => update('priceCents', value)} />
            <label className="admin-label">
              Thumbnail image
              <input
                type="file"
                accept="image/*"
                onChange={chooseThumbnail}
                className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
              />
              <span className="text-xs text-[var(--text-muted)]">Choose a 1200 x 360 course thumbnail from your computer. Maximum file size: 2 MB.</span>
            </label>
            <Field label="Preview video URL" value={form.videoPreviewUrl} onChange={(value) => update('videoPreviewUrl', value)} />
            {form.thumbnailUrl ? (
              <div className="lg:col-span-2">
                <p className="mb-2 text-sm text-[var(--text-secondary)]">Thumbnail preview</p>
                <img src={form.thumbnailUrl} alt="Course thumbnail preview" className="h-48 w-full rounded-lg border border-[var(--border-color)] object-cover" />
              </div>
            ) : null}
            <label className="admin-label lg:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={5} className="admin-input" />
              <FieldError>{fieldErrors.description}</FieldError>
            </label>
            {mode === 'create' ? (
              <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 p-4 text-sm text-cyan-800 dark:text-cyan-100">
                A celebrity instructor will be assigned automatically at random when this course is saved.
              </div>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Published
            </label>
          </div>
        )}

        <AdminNotice type="error">{error}</AdminNotice>
        <AdminNotice type="success">{success}</AdminNotice>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Course'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text', error }) {
  return (
    <label className="admin-label">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" aria-invalid={Boolean(error)} />
      <FieldError>{error}</FieldError>
    </label>
  )
}
