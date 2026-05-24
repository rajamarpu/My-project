import { cn } from '../../utils/classNames.js'

export default function Button({ variant = 'primary', className, children, ...props }) {
  const styles = cn(
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
    variant === 'secondary'
      ? cn(
          // secondary button
          'border transition-colors',
          'dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
          'light:border-black/10 light:bg-black/5 light:text-slate-900 light:hover:bg-black/10',
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
