import { useEffect, useState } from 'react'
import { MessageSquare, Plus, RefreshCw, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createCommunityTopic, fetchCommunityTopics } from '../../api/api.js'

export default function CommunityPage() {
  const navigate = useNavigate()
  const [topics, setTopics] = useState([])
  const [state, setState] = useState({ loading: true, error: '', creating: false, notice: '' })
  const [form, setForm] = useState({ title: '', description: '' })
  const [showForm, setShowForm] = useState(false)

  async function load() {
    try {
      setState((current) => ({ ...current, loading: true, error: '' }))
      const response = await fetchCommunityTopics()
      setTopics(response.data?.topics || [])
      setState((current) => ({ ...current, loading: false }))
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error?.response?.status === 401 ? 'Sign in to view and join community discussions.' : error?.response?.data?.message || 'Could not load community topics.' }))
    }
  }

  useEffect(() => { void load() }, [])

  async function createTopic(event) {
    event.preventDefault()
    try {
      setState((current) => ({ ...current, creating: true, error: '', notice: '' }))
      const response = await createCommunityTopic({ title: form.title.trim(), description: form.description.trim() })
      setForm({ title: '', description: '' })
      setShowForm(false)
      navigate(`/community/${response.data.topic.slug}`)
    } catch (error) {
      setState((current) => ({ ...current, creating: false, error: error?.response?.data?.message || 'Could not create the topic.' }))
    }
  }

  return <section className="space-y-8 pb-16">
    <header className="glass-card rounded-2xl p-6 shadow-glow sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="theme-eyebrow text-sm font-bold uppercase tracking-[0.26em]">Community</p><h1 className="mt-3 max-w-3xl text-4xl font-black text-[var(--text-primary)]">Learn through useful, respectful conversations.</h1><p className="mt-4 max-w-2xl text-[var(--text-secondary)]">Create a focused topic, ask for help, reply to learners, and report content that needs moderation.</p></div><Button onClick={() => setShowForm((value) => !value)}><Plus size={17} /> New topic</Button></div>
    </header>

    {showForm ? <form onSubmit={createTopic} className="glass-card grid gap-4 rounded-xl p-6 shadow-soft"><h2 className="text-2xl font-bold text-[var(--text-primary)]">Start a new discussion</h2><label className="admin-label">Topic title<input className="admin-input" required minLength={4} maxLength={120} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label><label className="admin-label">Description<textarea className="admin-input min-h-24 resize-y" maxLength={500} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label><div className="flex gap-3"><Button type="submit" loading={state.creating} disabled={state.creating}>Create topic</Button><Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button></div></form> : null}
    {state.error ? <div className="glass-card rounded-xl p-8 text-center"><p className="text-[var(--text-secondary)]">{state.error}</p><div className="mt-4 flex justify-center gap-3">{state.error.startsWith('Sign in') ? <Button onClick={() => navigate('/login')}>Sign in</Button> : <Button onClick={load}><RefreshCw size={16} /> Retry</Button>}</div></div> : null}
    {state.loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <span key={item} className="skeleton h-56 rounded-xl" />)}</div> : null}
    {!state.loading && !state.error ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <article key={topic.id} className="glass-card flex flex-col rounded-xl p-6 shadow-soft"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><MessageSquare /></span><h2 className="mt-5 text-xl font-bold text-[var(--text-primary)]">{topic.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-secondary)]">{topic.description || 'Join this focused community discussion.'}</p><div className="mt-5 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)]"><Users size={16} /> {topic._count?.posts || 0} posts</span><Button variant="secondary" onClick={() => navigate(`/community/${topic.slug}`)}>Open topic</Button></div></article>)}{!topics.length ? <div className="glass-card p-10 text-center md:col-span-2 xl:col-span-3"><MessageSquare className="mx-auto text-[var(--accent-primary)]" /><h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">No community topics yet</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Create the first focused discussion for the learning community.</p></div> : null}</div> : null}
  </section>
}
