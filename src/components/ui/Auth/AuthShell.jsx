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
    <main className="auth-dark theme-dark relative min-h-screen overflow-hidden bg-[#050815] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(88,80,236,0.28),transparent_32rem),radial-gradient(circle_at_82%_18%,rgba(13,190,255,0.18),transparent_28rem),radial-gradient(circle_at_45%_90%,rgba(249,115,22,0.16),transparent_32rem),linear-gradient(135deg,#050815_0%,#071735_46%,#0a1025_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,transparent,rgba(3,7,18,0.78)),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_54px)] opacity-70" />

      {particles.map((item, index) => (
        <motion.span
          key={item}
          className={`absolute rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.9)] ${item}`}
          animate={{ opacity: [0.18, 0.9, 0.18], y: [0, index % 2 ? -18 : 18, 0] }}
          transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/12 bg-white/[0.08] shadow-[0_34px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <AuthBrandPanel isAdminPortal={isAdminPortal} />

        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative flex min-h-[calc(100vh-3rem)] flex-col justify-center px-6 py-8 sm:px-10 lg:px-12"
        >
          <Logo to="/" className="mb-10 lg:hidden" />
          <div className="absolute inset-y-12 left-0 hidden w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent lg:block" />
          <div className="mx-auto w-full max-w-[440px] rounded-3xl border border-white/12 bg-slate-950/58 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200">{eyebrow}</p>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-4 leading-6 text-slate-300">{subtitle}</p>
            {children}
          </div>
        </motion.section>
      </div>
    </main>
  )
}
