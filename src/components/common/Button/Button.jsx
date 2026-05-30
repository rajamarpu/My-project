import { cn } from '../../../utils/classNames.js'

export default function Button({ variant = 'primary', className, children, type = 'button', ...props }) {
  const styles = cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
    'disabled:pointer-events-none disabled:opacity-55',
    variant === 'secondary'
      ? 'border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-card-hover)]'
      : 'btn-primary text-white shadow-[0_14px_34px_rgba(79,70,229,0.24)] hover:-translate-y-0.5 hover:shadow-glow',
    className,
  )

  return (
    <button type={type} className={styles} {...props}>
      {children}
    </button>
  )
}
