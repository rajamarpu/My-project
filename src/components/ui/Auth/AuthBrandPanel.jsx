import { motion } from 'framer-motion'
import { ArrowRightLeft, BarChart3, BrainCircuit, GraduationCap, ShieldCheck, Sparkles, Star } from 'lucide-react'
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
    <aside className="relative hidden min-h-[700px] overflow-hidden border-r border-[var(--border-color)] bg-white/64 p-8 dark:border-white/10 dark:bg-slate-950/48 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--brand-gradient)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(79,70,229,0.16),transparent_24rem),radial-gradient(circle_at_84%_30%,rgba(139,92,246,0.14),transparent_22rem),linear-gradient(45deg,transparent_58%,rgba(99,102,241,0.09))] dark:bg-[radial-gradient(circle_at_16%_20%,rgba(129,140,248,0.20),transparent_24rem),radial-gradient(circle_at_84%_30%,rgba(167,139,250,0.14),transparent_22rem),linear-gradient(45deg,transparent_58%,rgba(99,102,241,0.10))]" />
      <div className="absolute inset-x-10 bottom-0 h-44 rounded-t-[5rem] bg-gradient-to-t from-indigo-300/18 to-transparent blur-2xl" />

      <div className="relative">
        <Logo to="/" />
      </div>

      <div className="relative max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--accent-primary)]">
          {isAdminPortal ? 'Admin Portal' : 'Learner Portal'}
        </p>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-[var(--text-primary)]">
          {isAdminPortal ? 'Operate UptoSkills from a premium learning command center.' : 'Start a polished learning journey built around your goals.'}
        </h2>
        <p className="mt-5 leading-7 text-[var(--text-secondary)]">
          {isAdminPortal
            ? 'A focused enterprise console for courses, learners, approvals, question banks, reports, and AI-supported learning operations.'
            : 'A refined onboarding experience for courses, assessments, certificates, progress tracking, and adaptive mentor-led learning.'}
        </p>
      </div>

      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{isAdminPortal ? 'Platform pulse' : 'AI mentor preview'}</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)]">
            <Star size={12} fill="currentColor" />
            Live
          </span>
        </div>
        {isAdminPortal ? (
          <div className="grid gap-3">
            {[
              ['97%', 'platform uptime', BarChart3],
              ['24/7', 'secure operations', ShieldCheck],
              ['Live', 'learning analytics', Sparkles],
            ].map(([value, label, Icon]) => (
              <motion.div key={label} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-soft backdrop-blur" whileHover={{ y: -3 }}>
                <div className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-2xl font-bold text-[var(--text-primary)]">{value}</span>
                    <span className="mt-1 block text-sm text-[var(--text-secondary)]">{label}</span>
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={19} /></span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3">
              {mentors.map((mentor) => (
                <motion.div
                  key={mentor.id}
                  className="group rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-center shadow-soft backdrop-blur"
                  whileHover={{ y: -4 }}
                >
                  <img src={mentor.avatar} alt={mentor.name} className="mx-auto h-14 w-14 rounded-lg object-cover ring-2 ring-[var(--accent-primary)]/20" />
                  <p className="mt-2 truncate text-xs font-semibold text-[var(--text-primary)]">{mentor.name.split(' ')[0]}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-soft">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]">
                <ArrowRightLeft size={16} />
                Switch your mentor anytime
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Keep progress stable while mentor style, practice prompts, and lesson guidance adapt around your course.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="relative grid gap-3">
        {items.map(([itemTitle, description], index) => {
          const Icon = [BrainCircuit, ShieldCheck, GraduationCap][index]
          return (
            <div key={itemTitle} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-soft backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-gradient)] text-white shadow-glow">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{itemTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
