import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createAdminCategory, fetchAdminCategories, updateAdminCategory } from '../../api/api.js'
import { AdminLoadingState, AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'

const initialForm = {
  name: '',
  slug: '',
  description: '',
  isActive: true,
}

export default function AdminCategoryFormPage({ mode = 'create' }) {
  const navigate = useNavigate()
  const { categoryId } = useParams()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (mode !== 'edit' || !categoryId) return
    async function loadCategory() {
      try {
        setLoading(true)
        const response = await fetchAdminCategories()
        const category = response.data.categories.find((item) => item.id === categoryId)
        if (!category) throw new Error('Category not found.')
        setForm({
          name: category.name || '',
          slug: category.slug || '',
          description: category.description || '',
          isActive: Boolean(category.isActive),
        })
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load category.')
      } finally {
        setLoading(false)
      }
    }
    void loadCategory()
  }, [categoryId, mode])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!form.name.trim()) {
      setFieldErrors({ name: 'Category name is required.' })
      setError('Category name is required.')
      return
    }
    setFieldErrors({})
    try {
      setSaving(true)
      if (mode === 'edit') await updateAdminCategory(categoryId, form)
      else await createAdminCategory(form)
      setSuccess('Category saved successfully.')
      navigate('/admin/categories')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Category save failed.')
    } finally {
      setSaving(false)
    }
  }

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader eyebrow="Categories" title={mode === 'edit' ? 'Edit category' : 'Create category'} description="Keep course groups clean, searchable, and easy for learners to browse." />

      <form onSubmit={submit} className="admin-panel p-5 sm:p-6">
        {loading ? <AdminLoadingState label="Loading category..." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Name" value={form.name} error={fieldErrors.name} onChange={(value) => update('name', value)} />
            <Field label="Slug" value={form.slug} onChange={(value) => update('slug', value)} />
            <label className="admin-label lg:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={5} className="admin-input" />
            </label>
            <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Active
            </label>
          </div>
        )}
        <AdminNotice type="error">{error}</AdminNotice>
        <AdminNotice type="success">{success}</AdminNotice>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={loading} loading={saving} loadingLabel="Saving...">Save Category</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/categories')}>Cancel</Button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, value, onChange, error }) {
  return (
    <label className="admin-label">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" aria-invalid={Boolean(error)} />
      <FieldError>{error}</FieldError>
    </label>
  )
}
