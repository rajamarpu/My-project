import { cn } from '../../utils/classNames.js'

export default function Button({ variant = 'primary', className, children, ...props }) {
  const styles = cn(
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300',
    variant === 'secondary'
      ? 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
      : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-violet-500 text-slate-950 shadow-glow hover:scale-[1.02]',
    className,
  )

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  )
}
