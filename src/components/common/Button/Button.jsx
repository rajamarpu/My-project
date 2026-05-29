import { cn } from '../../../utils/classNames.js'

export default function Button({ variant = 'primary', className, children, type = 'button', ...props }) {
  const styles = cn(
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
    variant === 'secondary'
      ? 'border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors hover:border-cyan-400/50'
      : 'bg-gradient-to-r from-orange-500 via-cyan-500 to-teal-500 text-white shadow-glow hover:scale-[1.02]',
    className,
  )

  return (
    <button type={type} className={styles} {...props}>
      {children}
    </button>
  )
}
