import { cn } from '../../utils/classNames.js'

export default function Button({ variant = 'primary', className, children, ...props }) {
  const styles = cn(
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
    variant === 'secondary'
      ? cn(
          'border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors hover:border-cyan-400/50',
        )
      : cn(
          // primary button
          'bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-slate-950 shadow-glow hover:scale-[1.02]',
        ),
    className,
  )

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  )
}
