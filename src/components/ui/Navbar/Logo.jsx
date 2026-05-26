import { Link } from 'react-router-dom'
import logoUrl from '../../../assets/logos/uptoskills-logo.svg'
import { cn } from '../../../utils/classNames.js'

export default function Logo({ to = '/', admin = false, compact = false, className = '' }) {
  return (
    <Link to={to} className={cn('flex items-center gap-3 text-[var(--text-primary)]', className)}>
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-white p-1.5 shadow-[0_12px_30px_rgba(8,62,87,0.14)]">
        <img src={logoUrl} alt="UptoSkills" className="h-full w-full object-contain" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block text-lg font-bold leading-tight">UptoSkills</span>
          {admin ? <span className="block text-xs uppercase tracking-[0.22em] text-cyan-400">Admin</span> : null}
        </span>
      ) : null}
    </Link>
  )
}
