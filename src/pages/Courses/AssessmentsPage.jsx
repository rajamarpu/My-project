import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'

export default function AssessmentsPage() {
  const { courseId } = useParams()
  const role = useSelector((state) => state.auth.role)
  const isInstructor = role === 'instructor' || role === 'admin'
  const [items, setItems] = useState([
    { id: 'a1', title: 'Reflection task', prompt: 'Summarize the most important lesson and how you will apply it.', status: 'Open' },
  ])
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')

  const addAssessment = (event) => {
    event.preventDefault()
    if (!title.trim() || !prompt.trim()) return
    setItems((prev) => [{ id: `a${Date.now()}`, title, prompt, status: 'Open' }, ...prev])
    setTitle('')
    setPrompt('')
    setMessage('Assessment assigned.')
  }

  const submitAnswer = (event) => {
    event.preventDefault()
    if (!answer.trim()) return
    setAnswer('')
    setMessage('Assessment submitted successfully.')
  }

  return (
    <section className="space-y-8 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-700 dark:text-cyan-300">Assessments</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">Course assessment workflow</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">Course: {courseId}. Instructors assign tasks, learners submit answers, and the backend is ready for full persistence.</p>
      </div>

      {message ? <p className="rounded-3xl bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-200">{message}</p> : null}

      {isInstructor ? (
        <form onSubmit={addAssessment} className="glass-card space-y-4 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Assign task</h2>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900" placeholder="Assessment title" />
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="h-32 w-full rounded-3xl border border-black/10 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900" placeholder="Prompt" />
          <Button type="submit">Assign Assessment</Button>
        </form>
      ) : (
        <form onSubmit={submitAnswer} className="glass-card space-y-4 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Submit answer</h2>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} className="h-40 w-full rounded-3xl border border-black/10 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900" placeholder="Type your assessment response" />
          <Button type="submit">Submit</Button>
        </form>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="glass-card p-5 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{item.prompt}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

