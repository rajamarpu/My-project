import { Link } from 'react-router-dom'
import { GraduationCap, TrendingUp } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

export default function Logo({ to = '/', admin = false, compact = false, className = '' }) {
  if (admin) {
    return (
      <Link
        to={to}
        className={cn('group flex min-w-0 items-center gap-3 text-[var(--text-primary)]', className)}
        aria-label="UptoSkills admin home"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--accent-primary)] shadow-soft">
          <GraduationCap size={23} />
        </span>
        <span className="min-w-0">
          <span
            className="relative block whitespace-nowrap text-[1.55rem] font-black leading-none tracking-[-0.07em] sm:text-[1.8rem]"
            style={{ fontFamily: '"Arial Rounded MT Bold", "Aptos Display", "Nunito Sans", Poppins, Inter, Arial, Helvetica, sans-serif', WebkitTextStroke: '0.25px currentColor' }}
          >
            <span className="text-[#F97316]">Upto</span><span className="text-[#14B8A6]">Skills</span>
            <TrendingUp className="absolute -right-4 -top-2 h-5 w-5 rotate-12 text-[#FF6B35] transition group-hover:-translate-y-0.5 dark:text-[#F97316]" strokeWidth={3} />
          </span>
          {!compact ? (
            <span className="mt-1 inline-flex max-w-full items-center rounded-full border border-[var(--border-color)] bg-[var(--accent-soft)] px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">
              Admin Panel
            </span>
          ) : null}
        </span>
      </Link>
    )
  }

  return (
    <Link to={to} className={cn('flex items-center gap-3 text-[var(--text-primary)]', className)} aria-label="UptoSkills home">
      <span
        className="shrink-0 text-[1.7rem] font-black leading-none tracking-[-0.06em] drop-shadow-[0_8px_18px_rgba(20,184,166,0.14)] sm:text-[2.15rem]"
        style={{ fontFamily: '"Arial Rounded MT Bold", "Aptos Display", "Nunito Sans", Poppins, Inter, Arial, Helvetica, sans-serif', WebkitTextStroke: '0.25px currentColor' }}
      >
        <span className="text-[#F97316]">Upto</span><span className="text-[#14B8A6]">Skills</span>
      </span>
    </Link>
  )
}
