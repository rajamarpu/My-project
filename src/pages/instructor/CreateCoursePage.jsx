import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'

const steps = ['Basic Info', 'Upload Thumbnail', 'Add Lessons', 'Resources', 'Quiz', 'Pricing', 'Publish']

export default function CreateCoursePage() {
  const [activeStep, setActiveStep] = useState(1)

  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Course builder</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Create a celebrity course</h1>
        <p className="mt-4 text-slate-300">A multi-step instructor workflow with drag-and-drop uploads, lesson ordering, and publishing tools.</p>
        <div className="mt-10 overflow-auto rounded-full bg-white/5 p-2">
          <div className="flex min-w-[720px] gap-3">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(index + 1)}
                className={`min-w-[120px] rounded-full px-5 py-3 text-sm transition ${activeStep === index + 1 ? 'bg-cyan-400 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="space-y-5 rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 text-slate-300 shadow-soft">
            <div>
              <label className="text-sm text-slate-400">Course title</label>
              <input className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none" placeholder="Cinematic brand storytelling" />
            </div>
            <div>
              <label className="text-sm text-slate-400">Description</label>
              <textarea className="mt-2 h-32 w-full rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none" placeholder="Write a premium course summary..."></textarea>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none" placeholder="Duration" />
              <input className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none" placeholder="Price" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button>Save draft</Button>
              <Button variant="secondary">Preview</Button>
            </div>
          </form>
          <aside className="space-y-5 rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Pro tips</p>
            <ul className="space-y-3 text-slate-300">
              <li>Use cinematic thumbnails and authentic mentor stories.</li>
              <li>Include AI-generated summaries for every lesson.</li>
              <li>Set milestones and live sessions for extra engagement.</li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}
