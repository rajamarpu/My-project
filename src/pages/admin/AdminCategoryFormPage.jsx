import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createAdminCategory, fetchAdminCategories, updateAdminCategory } from '../../api/api.js'

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
    if (!form.name.trim()) {
      setError('Category name is required.')
      return
    }
    try {
      setSaving(true)
      if (mode === 'edit') await updateAdminCategory(categoryId, form)
      else await createAdminCategory(form)
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
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Categories</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{mode === 'edit' ? 'Edit category' : 'Create category'}</h1>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-white/10 bg-slate-950/70 p-6">
        {loading ? <p className="text-slate-400">Loading category...</p> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(value) => update('name', value)} />
            <Field label="Slug" value={form.slug} onChange={(value) => update('slug', value)} />
            <label className="grid gap-2 text-sm text-slate-300 lg:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={5} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" />
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(event) => update('isActive', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Active
            </label>
          </div>
        )}
        {error ? <p className="mt-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Category'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/categories')}>Cancel</Button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none" />
    </label>
  )
}
