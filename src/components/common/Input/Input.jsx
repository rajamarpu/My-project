import { cn } from '../../../utils/classNames.js'

export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label ? <span className="text-sm text-[var(--text-secondary)]">{label}</span> : null}
      <input
        className={cn('mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none transition focus:border-cyan-300/60', className)}
        {...props}
      />
      {error ? <span className="mt-2 block text-xs text-red-300">{error}</span> : null}
    </label>
  )
}
