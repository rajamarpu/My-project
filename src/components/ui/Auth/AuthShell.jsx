import { motion } from 'framer-motion'
import Logo from '../Navbar/Logo.jsx'
import AuthBrandPanel from './AuthBrandPanel.jsx'
import { fadeInUp } from '../../../utils/animationVariants.js'

const particles = [
  'left-[8%] top-[18%] h-1.5 w-1.5',
  'left-[18%] top-[72%] h-2 w-2',
  'right-[12%] top-[15%] h-1.5 w-1.5',
  'right-[24%] bottom-[16%] h-2 w-2',
  'left-[46%] top-[10%] h-1 w-1',
  'right-[44%] bottom-[9%] h-1 w-1',
]

export default function AuthShell({ isAdminPortal = false, eyebrow, title, subtitle, children }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-4 py-5 text-[var(--text-primary)] sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(79,70,229,0.18),transparent_32rem),radial-gradient(circle_at_86%_16%,rgba(139,92,246,0.16),transparent_30rem),radial-gradient(circle_at_48%_92%,rgba(99,102,241,0.10),transparent_34rem),linear-gradient(135deg,#f8fafc_0%,#eef2ff_54%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_12%_10%,rgba(129,140,248,0.20),transparent_32rem),radial-gradient(circle_at_86%_16%,rgba(167,139,250,0.16),transparent_30rem),linear-gradient(135deg,#020617_0%,#0f172a_50%,#1e1b4b_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-[linear-gradient(180deg,transparent,rgba(79,70,229,0.08)),repeating-linear-gradient(90deg,rgba(79,70,229,0.10)_0_1px,transparent_1px_56px)] opacity-70 dark:bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.88)),repeating-linear-gradient(90deg,rgba(255,255,255,0.07)_0_1px,transparent_1px_56px)]" />
      <div className="absolute inset-y-0 left-1/2 hidden w-px bg-gradient-to-b from-transparent via-white/60 to-transparent opacity-40 lg:block dark:via-white/10" />

      {particles.map((item, index) => (
        <motion.span
          key={item}
          className={`absolute rounded-full bg-[var(--accent-primary)] shadow-[0_0_24px_rgba(79,70,229,0.45)] ${item}`}
          animate={{ opacity: [0.12, 0.55, 0.12], y: [0, index % 2 ? -14 : 14, 0] }}
          transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[1.75rem] border border-[var(--border-color)] bg-white/82 shadow-[0_34px_120px_rgba(79,70,229,0.16)] backdrop-blur-2xl dark:bg-white/[0.07] dark:shadow-[0_34px_120px_rgba(0,0,0,0.46)] lg:grid-cols-[1.02fr_0.98fr]">
        <AuthBrandPanel isAdminPortal={isAdminPortal} />

        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative flex min-h-[calc(100vh-2.5rem)] flex-col justify-center px-5 py-7 sm:px-8 lg:px-12"
        >
          <Logo to="/" className="mb-10 lg:hidden" />
          <div className="mx-auto w-full max-w-[470px] rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-[0_28px_90px_rgba(79,70,229,0.16)] backdrop-blur-xl dark:shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:p-7">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">
              <span className="h-2 w-2 rounded-full bg-[var(--success)] shadow-[0_0_0_4px_rgba(16,185,129,0.14)]" />
              {eyebrow}
            </div>
            <h1 className="text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">{title}</h1>
            <p className="mt-4 leading-7 text-[var(--text-secondary)]">{subtitle}</p>
            {children}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
