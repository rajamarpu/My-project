import { motion } from 'framer-motion'
import { BarChart3, BookOpenCheck, BrainCircuit, BriefcaseBusiness, CheckCircle2, GraduationCap, LockKeyhole, ShieldCheck, Sparkles, Star, Trophy, TrendingUp } from 'lucide-react'
import Logo from '../Navbar/Logo.jsx'

export default function AuthBrandPanel({ isAdminPortal = false }) {
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

  const learnerFeatureCards = [
    ['Learn', 'Structured technical and career courses built for steady progress.', BookOpenCheck, 'text-orange-600 bg-orange-50'],
    ['Practice', 'Assignments, assessments, and notes keep every concept active.', BrainCircuit, 'text-blue-600 bg-blue-50'],
    ['Grow', 'Certificates and progress tracking help learners see momentum.', TrendingUp, 'text-emerald-600 bg-emerald-50'],
    ['AI mentors', 'Learn with adaptive teacher personalities.', Sparkles, 'text-purple-600 bg-purple-50'],
    ['Guided progress', 'Continue lessons, assessments, and certificates.', ShieldCheck, 'text-blue-600 bg-blue-50'],
    ['Career-ready', 'Build practical skills with structured paths.', BriefcaseBusiness, 'text-rose-600 bg-rose-50'],
  ]

  return (
    <aside className="auth-brand">
      <div className="auth-brand-bg" />

      <div className="auth-brand-nav">
        <Logo to="/" />
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:border-emerald-400/20 dark:bg-white/5 dark:text-emerald-200">
          <Star size={12} fill="currentColor" />
          Live workspace
        </span>
      </div>

      <div className="auth-brand-main">
        <div className="max-w-2xl">
          <p className="auth-brand-kicker">
            {isAdminPortal ? 'Admin Portal' : 'Learner Portal'}
          </p>
          <h2 className="auth-brand-title">
            {isAdminPortal ? 'Run learning ops with a sharper command center.' : 'A focused learning desk for every next step.'}
          </h2>
          <p className="auth-brand-copy">
            {isAdminPortal
              ? 'Manage learners, courses, assessments, payments, approvals, reports, and platform operations from one secure command center.'
              : 'Resume lessons, compare mentor modes, track progress, and move from course discovery to certification without losing momentum.'}
          </p>
        </div>

        {isAdminPortal ? (
          <div className="auth-feature-grid auth-feature-grid-admin">
            {[
              ['97%', 'uptime', BarChart3],
              ['24/7', 'security', ShieldCheck],
              ['Live', 'analytics', Sparkles],
            ].map(([value, label, Icon]) => (
              <motion.div key={label} className="auth-feature-card auth-metric-card" whileHover={{ y: -3 }}>
                <Icon className="text-[#FF6B35]" size={20} />
                <span className="mt-4 block text-2xl font-black text-slate-950 dark:text-white">{value}</span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="auth-feature-grid">
            {learnerFeatureCards.map(([label, text, Icon, tone]) => (
              <motion.div
                key={label}
                className="auth-feature-card"
                whileHover={{ y: -3 }}
              >
                <span className={`auth-feature-icon ${tone}`}>
                  <Icon size={18} />
                </span>
                <p className="auth-feature-title">{label}</p>
                <p className="auth-feature-copy">{text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {isAdminPortal ? <div className="auth-admin-grid">
        {items.map(([itemTitle, description], index) => {
          const Icon = [BrainCircuit, ShieldCheck, GraduationCap][index]
          return (
            <div key={itemTitle} className="auth-admin-card">
              <span className="auth-admin-icon">
                <Icon size={18} />
              </span>
              <p className="mt-4 font-bold text-slate-950 dark:text-white">{itemTitle}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          )
        })}
      </div> : null}

      {isAdminPortal ? (
        <div className="auth-brand-cta auth-brand-cta-admin">
          <span className="flex items-center gap-3">
            <span className="auth-brand-cta-icon">
              <ShieldCheck size={20} />
            </span>
            <span>
              <span className="block text-sm font-bold">Secure. Reliable. Always On.</span>
              <span className="block text-xs text-slate-600 dark:text-slate-300">Your command center stays protected with enterprise-grade security.</span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 text-slate-700 dark:text-slate-200">
            <LockKeyhole size={20} />
          </span>
        </div>
      ) : (
        <div className="auth-brand-cta">
          <span className="flex items-center gap-3">
            <span className="auth-brand-cta-icon">
              <Trophy size={20} />
            </span>
            <span>
              <span className="block text-sm font-bold">Your learning journey awaits</span>
              <span className="block text-xs text-slate-600 dark:text-slate-300">Pick up where you left off and achieve your goals.</span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-600">
            Continue learning
            <CheckCircle2 size={20} />
          </span>
        </div>
      )}
    </aside>
  )
}
