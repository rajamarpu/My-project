import { motion } from 'framer-motion'
import { ArrowRightLeft, BrainCircuit, GraduationCap, ShieldCheck, Star } from 'lucide-react'
import Logo from '../Navbar/Logo.jsx'
import { aiPersonalities } from '../../../constants/aiPersonalities.js'

const mentorIds = ['rohit', 'dhoni', 'virat', 'srk']

export default function AuthBrandPanel({ isAdminPortal = false }) {
  const mentors = mentorIds
    .map((id) => aiPersonalities.find((mentor) => mentor.id === id))
    .filter(Boolean)

  const items = isAdminPortal
    ? [
        ['Approvals', 'Review courses, instructors, and platform requests.'],
        ['Analytics', 'Monitor growth, engagement, and system health.'],
        ['AI Teachers', 'Manage teacher personalities and learning quality.'],
      ]
    : [
        ['AI mentors', 'Learn with adaptive teacher personalities.'],
        ['Guided progress', 'Continue lessons, assessments, and certificates.'],
        ['Career-ready', 'Build practical skills with structured paths.'],
      ]

  return (
    <aside className="relative hidden min-h-[680px] overflow-hidden border-r border-[var(--border-color)] bg-white/70 p-8 dark:border-white/10 dark:bg-slate-950/55 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--accent-warm)] via-[var(--accent-secondary)] to-[var(--accent-primary)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.14),transparent_23rem),radial-gradient(circle_at_82%_32%,rgba(6,182,212,0.14),transparent_22rem),linear-gradient(45deg,transparent_60%,rgba(219,39,119,0.08))] dark:bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.20),transparent_23rem),radial-gradient(circle_at_82%_32%,rgba(45,212,191,0.14),transparent_22rem),linear-gradient(45deg,transparent_60%,rgba(16,185,167,0.10))]" />
      <div className="absolute inset-x-10 bottom-0 h-44 rounded-t-[5rem] bg-gradient-to-t from-cyan-300/18 to-transparent blur-2xl" />

      <div className="relative">
        <Logo to="/" />
      </div>

      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-700 dark:text-cyan-200">
          {isAdminPortal ? 'Admin Portal' : 'Learner Portal'}
        </p>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-slate-800 dark:text-white">
          {isAdminPortal ? 'Operate UptoSkills from a live AI command deck.' : 'Learn with AI mentors in a gamified skill campus.'}
        </h2>
        <p className="mt-5 leading-7 text-[var(--text-secondary)] dark:text-slate-300">
          {isAdminPortal
            ? 'A focused command center for courses, learners, approvals, reports, and AI-powered teaching workflows.'
            : 'A premium onboarding experience for courses, assessments, certificates, and celebrity-inspired AI mentor personalities.'}
        </p>
      </div>

      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)] dark:text-slate-400">AI mentor preview</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-300/10 dark:text-cyan-100">
            <Star size={12} fill="currentColor" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {mentors.map((mentor) => (
            <motion.div
              key={mentor.id}
              className="group rounded-2xl border border-[var(--border-color)] bg-white/80 p-2 text-center shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_18px_45px_rgba(0,0,0,0.2)]"
              whileHover={{ y: -4 }}
            >
              <img src={mentor.avatar} alt={mentor.name} className="mx-auto h-14 w-14 rounded-xl object-cover ring-2 ring-cyan-300/30" />
              <p className="mt-2 truncate text-xs font-semibold text-slate-800 dark:text-white">{mentor.name.split(' ')[0]}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-orange-300/30 bg-orange-50 p-4 dark:bg-orange-300/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-100">
            <ArrowRightLeft size={16} />
            Switch your AI mentor anytime during learning
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] dark:text-slate-300">
            Start with Rohit Sharma, switch to MS Dhoni mid-lecture, and the voice plus personality UI adapts instantly.
          </p>
        </div>
      </div>

      <div className="relative grid gap-3">
        {items.map(([itemTitle, description], index) => {
          const Icon = [BrainCircuit, ShieldCheck, GraduationCap][index]
          return (
            <div key={itemTitle} className="rounded-2xl border border-[var(--border-color)] bg-white/82 p-4 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_16px_45px_rgba(0,0,0,0.16)]">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--accent-warm)] to-[var(--accent-secondary)] text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{itemTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)] dark:text-slate-300">{description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
