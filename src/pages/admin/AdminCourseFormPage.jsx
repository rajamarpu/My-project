import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createCourseRequest, fetchAdminCourses, updateAdminCourse } from '../../api/api.js'

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
    if (!form.title.trim() || !form.description.trim() || !form.category.trim()) {
      setError('Title, description, and category are required.')
      return
    }
    try {
      setSaving(true)
      const payload = { ...form, priceCents: Number(form.priceCents || 0) }
      if (mode === 'edit') await updateAdminCourse(courseId, payload)
      else await createCourseRequest(payload)
      navigate('/admin/courses')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Course save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 pb-16">
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Course catalog</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{mode === 'edit' ? 'Edit course' : 'Upload course'}</h1>
        <p className="mt-3 text-sm text-slate-300">
          Save course details, publication state, preview media, and catalog metadata.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-white/10 bg-slate-950/70 p-6">
        {loading ? <p className="text-slate-400">Loading course...</p> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(value) => update('title', value)} />
            <Field label="Category" value={form.category} onChange={(value) => update('category', value)} />
            <label className="grid gap-2 text-sm text-slate-300">
              Level
              <select value={form.level} onChange={(event) => update('level', event.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <Field label="Price in paise" type="number" value={form.priceCents} onChange={(value) => update('priceCents', value)} />
            <label className="grid gap-2 text-sm text-slate-300">
              Thumbnail image
              <input
                type="file"
                accept="image/*"
                onChange={chooseThumbnail}
                className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300 light:border-black/10 light:bg-white light:text-slate-900"
              />
              <span className="text-xs text-slate-400 light:text-slate-500">Choose a 1200 x 360 course thumbnail from your computer. Maximum file size: 2 MB.</span>
            </label>
            <Field label="Preview video URL" value={form.videoPreviewUrl} onChange={(value) => update('videoPreviewUrl', value)} />
            {form.thumbnailUrl ? (
              <div className="lg:col-span-2">
                <p className="mb-2 text-sm text-slate-300 light:text-slate-700">Thumbnail preview</p>
                <img src={form.thumbnailUrl} alt="Course thumbnail preview" className="h-48 w-full rounded-lg border border-white/10 object-cover light:border-black/10" />
              </div>
            ) : null}
            <label className="grid gap-2 text-sm text-slate-300 lg:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={5} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" />
            </label>
            {mode === 'create' ? (
              <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm text-cyan-100 light:text-cyan-800">
                A celebrity instructor will be assigned automatically at random when this course is saved.
              </div>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Published
            </label>
          </div>
        )}

        {error ? <p className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Course'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" />
    </label>
  )
}
