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
    <aside className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 bg-slate-950/55 p-8 lg:flex lg:flex-col lg:justify-between">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f97316] via-[#16a9d8] to-[#10b9a7]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.26),transparent_23rem),radial-gradient(circle_at_82%_32%,rgba(14,165,233,0.16),transparent_22rem),linear-gradient(45deg,transparent_60%,rgba(16,185,167,0.10))]" />
      <div className="absolute inset-x-10 bottom-0 h-44 rounded-t-[5rem] bg-gradient-to-t from-cyan-300/18 to-transparent blur-2xl" />

      <div className="relative">
        <Logo to="/" />
      </div>

      <div className="relative max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">
          {isAdminPortal ? 'Admin Portal' : 'Learner Portal'}
        </p>
        <h2 className="mt-4 text-4xl font-bold leading-tight text-white">
          {isAdminPortal ? 'Operate UptoSkills from a live AI command deck.' : 'Learn with AI mentors in a city-night classroom.'}
        </h2>
        <p className="mt-5 leading-7 text-slate-300">
          {isAdminPortal
            ? 'A focused command center for courses, learners, approvals, reports, and AI-powered teaching workflows.'
            : 'A premium onboarding experience for courses, assessments, certificates, and celebrity-inspired AI mentor personalities.'}
        </p>
      </div>

      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">AI mentor preview</p>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            <Star size={12} fill="currentColor" />
            Live
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {mentors.map((mentor) => (
            <motion.div
              key={mentor.id}
              className="group rounded-2xl border border-white/10 bg-white/[0.06] p-2 text-center shadow-[0_18px_45px_rgba(0,0,0,0.2)] backdrop-blur"
              whileHover={{ y: -4 }}
            >
              <img src={mentor.avatar} alt={mentor.name} className="mx-auto h-14 w-14 rounded-xl object-cover ring-2 ring-cyan-300/30" />
              <p className="mt-2 truncate text-xs font-semibold text-white">{mentor.name.split(' ')[0]}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-orange-300/20 bg-orange-300/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-orange-100">
            <ArrowRightLeft size={16} />
            Switch your AI mentor anytime during learning
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Start with Rohit Sharma, switch to MS Dhoni mid-lecture, and the voice plus personality UI adapts instantly.
          </p>
        </div>
      </div>

      <div className="relative grid gap-3">
        {items.map(([itemTitle, description], index) => {
          const Icon = [BrainCircuit, ShieldCheck, GraduationCap][index]
          return (
            <div key={itemTitle} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.16)] backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f97316] to-[#10b9a7] text-white">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="font-semibold text-white">{itemTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
