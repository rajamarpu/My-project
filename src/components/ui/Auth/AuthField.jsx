import { AlertCircle } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

export default function AuthField({ label, icon, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <span
        className={cn(
          'mt-2 flex min-h-12 items-center gap-3 rounded-2xl border bg-white px-4 text-slate-800 shadow-[0_10px_30px_rgba(37,99,235,0.10)] transition backdrop-blur dark:bg-white/[0.08] dark:text-white dark:shadow-[0_10px_30px_rgba(0,0,0,0.16)]',
          'focus-within:border-cyan-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-300/10 dark:focus-within:border-cyan-300/70 dark:focus-within:bg-white/[0.11]',
          error ? 'border-red-400/60 ring-4 ring-red-400/10' : 'border-[var(--border-color)] dark:border-white/12',
        )}
      >
        <span className="text-cyan-600 dark:text-cyan-100">{icon}</span>
        {children}
      </span>
      {error ? (
        <span className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-200">
          <AlertCircle size={13} />
          {error}
        </span>
      ) : null}
    </label>
  )
}
