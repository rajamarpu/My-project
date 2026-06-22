import { AlertCircle } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

export default function AuthField({ id, label, icon, error, compact = false, children }) {
  const errorId = `${id}-error`
  return (
    <div className="block">
      <label htmlFor={id} className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-[var(--text-secondary)]`}>{label}</label>
      <span
        className={cn(
          `${compact ? 'mt-1.5 min-h-11 px-3' : 'mt-2 min-h-12 px-4'} flex min-w-0 items-center gap-3 rounded-xl border bg-white text-[var(--text-primary)] shadow-[0_12px_26px_rgba(15,23,42,0.06)] transition dark:bg-slate-950/70`,
          'focus-within:border-[var(--accent-primary)] focus-within:ring-4 focus-within:ring-[var(--focus-ring)]',
          error ? 'border-red-400/70 ring-4 ring-red-400/10' : 'border-black/10 dark:border-white/10',
        )}
      >
        <span className={`${compact ? 'h-6 w-6' : 'h-7 w-7'} grid shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]`}>{icon}</span>
        <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
      </span>
      {error ? (
        <span id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-5 text-red-600 dark:text-red-200">
          <AlertCircle size={13} />
          {error}
        </span>
      ) : null}
    </div>
  )
}
