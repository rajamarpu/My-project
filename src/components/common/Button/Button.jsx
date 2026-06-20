import { Loader2 } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

export default function Button({ variant = 'primary', className, children, type = 'button', loading = false, loadingLabel, disabled, ...props }) {
  const variants = {
    primary: 'btn-primary text-[var(--color-button-primary-text)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-button-primary-hover)]',
    secondary: 'border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-card-hover)]',
    outline: 'border border-[var(--border-color)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-subtle)]',
    danger: 'border border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-95',
    ghost: 'border border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]',
  }
  const styles = cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors duration-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]',
    'disabled:pointer-events-none disabled:opacity-55',
    variants[variant] || variants.primary,
    className,
  )

  return (
    <button type={type} className={styles} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden="true" /> : null}
      {loading ? loadingLabel || children : children}
    </button>
  )
}
