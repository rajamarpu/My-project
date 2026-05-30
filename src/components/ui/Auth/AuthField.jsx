import { AlertCircle } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

export default function AuthField({ label, icon, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[var(--text-secondary)]">{label}</span>
      <span
        className={cn(
          'mt-2 flex min-h-12 items-center gap-3 rounded-xl border bg-[var(--bg-secondary)] px-4 text-[var(--text-primary)] shadow-[0_10px_30px_rgba(79,70,229,0.08)] transition backdrop-blur',
          'focus-within:border-[var(--accent-primary)] focus-within:bg-[var(--bg-secondary)] focus-within:ring-4 focus-within:ring-[var(--accent-primary)]/10',
          error ? 'border-red-400/70 ring-4 ring-red-400/10' : 'border-[var(--border-color)]',
        )}
      >
        <span className="text-[var(--accent-primary)]">{icon}</span>
        {children}
      </span>
      {error ? (
        <span className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-200">
          <AlertCircle size={13} />
          {error}
        </span>
      ) : null}
    </label>
  )
}
