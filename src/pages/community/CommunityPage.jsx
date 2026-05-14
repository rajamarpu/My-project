import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Button from '../../components/ui/Button.jsx'
import { discussionAPI } from '../../services/api.js'

export default function CommunityPage() {
  const auth = useSelector((state) => state.auth)
  const [threads, setThreads] = useState([])
  const [form, setForm] = useState({ title: '', body: '' })
  const [error, setError] = useState('')

  const load = async () => {
    const response = await discussionAPI.getDiscussions()
    setThreads(response.data.discussions)
  }

  useEffect(() => {
    load()
  }, [])

  const createTopic = async (event) => {
    event.preventDefault()
    if (!auth.user) return setError('Please login to create a discussion.')
    await discussionAPI.createDiscussion(form)
    setForm({ title: '', body: '' })
    setError('')
    load()
  }

  return (
    <section className="space-y-8 pb-16">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Community</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Discussion forums, comments, replies, likes, and announcements</h1>
        <p className="mt-4 text-slate-300">Ask lesson questions, share project progress, and follow mentor announcements.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createTopic} className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Create topic</p>
          {error && <div className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Topic title" className="mt-5 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none" />
          <textarea value={form.body} onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))} placeholder="Question or announcement" rows={6} className="mt-4 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none" />
          <Button type="submit" className="mt-4">Publish</Button>
        </form>

        <div className="grid gap-5">
          {threads.map((thread) => (
            <article key={thread.id} className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold text-white">{thread.title}</p>
                  <p className="mt-2 text-slate-300">{thread.body}</p>
                </div>
                <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">{thread.replies?.length || 0} replies</span>
              </div>
              <div className="mt-5 space-y-3">
                {thread.replies?.map((reply) => <div key={reply.id} className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">{reply.body}</div>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
