import { cn } from '../../../utils/classNames.js'

export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label ? <span className="text-sm text-[var(--text-secondary)]">{label}</span> : null}
      <input
        className={cn('mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-[var(--text-primary)] outline-none transition-colors duration-100 focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--accent-primary)]/15', className)}
        {...props}
      />
      {error ? <span className="mt-2 block text-xs text-[var(--color-danger)]">{error}</span> : null}
    </label>
  )
}
