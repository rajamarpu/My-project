import { Link } from 'react-router-dom'

const tones = {
  blue: {
    strip: 'from-blue-500 via-blue-600 to-cyan-400',
    adminChip: 'bg-blue-500/15 text-blue-100',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-blue-600 dark:text-blue-300',
    learnerChip: 'bg-blue-500/10 text-blue-700 dark:text-blue-200',
    learnerIcon: 'bg-blue-500/10 text-blue-700 dark:text-blue-200',
  },
  teal: {
    strip: 'from-cyan-500 via-teal-500 to-emerald-400',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-teal-600 dark:text-teal-300',
    learnerChip: 'bg-teal-500/10 text-teal-700 dark:text-teal-200',
    learnerIcon: 'bg-teal-500/10 text-teal-700 dark:text-teal-200',
  },
  cyan: {
    strip: 'from-cyan-500 via-sky-500 to-blue-400',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-cyan-600 dark:text-cyan-300',
    learnerChip: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-200',
    learnerIcon: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-200',
  },
  sky: {
    strip: 'from-sky-500 via-blue-500 to-cyan-300',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-sky-600 dark:text-sky-300',
    learnerChip: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
    learnerIcon: 'bg-sky-500/10 text-sky-700 dark:text-sky-200',
  },
  orange: {
    strip: 'from-orange-500 via-amber-400 to-yellow-300',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-orange-600 dark:text-orange-300',
    learnerChip: 'bg-orange-500/10 text-orange-700 dark:text-orange-200',
    learnerIcon: 'bg-orange-500/10 text-orange-700 dark:text-orange-200',
  },
  amber: {
    strip: 'from-amber-500 via-orange-400 to-yellow-300',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-amber-600 dark:text-amber-300',
    learnerChip: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
    learnerIcon: 'bg-amber-500/10 text-amber-700 dark:text-amber-200',
  },
  green: {
    strip: 'from-emerald-500 via-green-500 to-teal-400',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-emerald-600 dark:text-emerald-300',
    learnerChip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    learnerIcon: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  },
  emerald: {
    strip: 'from-emerald-500 via-teal-400 to-cyan-300',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-emerald-600 dark:text-emerald-300',
    learnerChip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    learnerIcon: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
  },
  violet: {
    strip: 'from-violet-500 via-indigo-500 to-blue-400',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-violet-600 dark:text-violet-300',
    learnerChip: 'bg-violet-500/10 text-violet-700 dark:text-violet-200',
    learnerIcon: 'bg-violet-500/10 text-violet-700 dark:text-violet-200',
  },
  rose: {
    strip: 'from-rose-500 via-pink-500 to-fuchsia-500',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-rose-600 dark:text-rose-300',
    learnerChip: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
    learnerIcon: 'bg-rose-500/10 text-rose-700 dark:text-rose-200',
  },
  pink: {
    strip: 'from-pink-500 via-rose-500 to-orange-300',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-pink-600 dark:text-pink-300',
    learnerChip: 'bg-pink-500/10 text-pink-700 dark:text-pink-200',
    learnerIcon: 'bg-pink-500/10 text-pink-700 dark:text-pink-200',
  },
  red: {
    strip: 'from-rose-500 via-red-500 to-orange-400',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-red-600 dark:text-red-300',
    learnerChip: 'bg-red-500/10 text-red-700 dark:text-red-200',
    learnerIcon: 'bg-red-500/10 text-red-700 dark:text-red-200',
  },
  slate: {
    strip: 'from-slate-600 via-slate-500 to-slate-400',
    adminChip: 'bg-white/15 text-white',
    adminIcon: 'bg-white/15 text-white',
    learnerAccent: 'text-slate-600 dark:text-slate-300',
    learnerChip: 'bg-slate-500/10 text-slate-700 dark:text-slate-200',
    learnerIcon: 'bg-slate-500/10 text-slate-700 dark:text-slate-200',
  },
}

function MetricCardContent({
  title,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
  loading = false,
  trendLabel,
  trendValue,
  variant = 'admin',
  className = '',
  href,
}) {
  const theme = tones[tone] || tones.blue
  const isLearner = variant === 'learner'

  return (
    <div className={`relative overflow-hidden ${isLearner ? `rounded-[18px] border border-white/12 bg-gradient-to-br text-white shadow-[0_18px_42px_rgba(15,23,42,0.16)] ${theme.strip}` : `rounded-[16px] bg-gradient-to-br text-white shadow-[0_16px_36px_rgba(15,23,42,0.14)] ${theme.strip}`} ${className}`}>
      {isLearner ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.10),transparent_30%)]" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />
      )}
      <div className={`relative flex min-h-[170px] flex-col p-5 ${isLearner ? 'text-white' : 'text-white'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/90">{title}</p>
            <p className="mt-3 text-[2.15rem] font-bold leading-none text-white">
              {loading ? <span className="skeleton inline-block h-8 w-20 rounded bg-white/25" /> : value}
            </p>
            <p className="mt-2 max-w-[16rem] text-sm leading-5 text-white/86">{detail}</p>
          </div>
          {Icon ? (
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/25 ${isLearner ? theme.learnerIcon : theme.adminIcon} shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md`}>
              <Icon size={22} strokeWidth={2.15} className="shrink-0 text-white drop-shadow-[0_1px_1px_rgba(15,23,42,0.45)]" aria-hidden="true" />
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-4 text-xs font-semibold text-white/92">
          <span className={`inline-flex min-h-7 items-center rounded-full px-3 ${theme.adminChip}`}>
            {trendValue || 'Live data'}
          </span>
          <span>{trendLabel || 'vs last 30 days'}</span>
        </div>
      </div>
    </div>
  )
}

export default function MetricCard(props) {
  const { onClick, href } = props
  const content = <MetricCardContent {...props} />

  if (href) {
    return (
      <Link
        to={href}
        className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
      >
        {content}
      </Link>
    )
  }

  if (!onClick) return content

  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
    >
      {content}
    </button>
  )
}
