import { Link } from 'react-router-dom'
import { useTheme } from '../../../hooks/useTheme.js'

const tones = {
  blue: {
    strip: 'from-blue-600 via-blue-700 to-cyan-500',
    learnerAccent: 'text-blue-600 dark:text-blue-300',
  },
  teal: {
    strip: 'from-cyan-600 via-teal-600 to-emerald-500',
    learnerAccent: 'text-teal-600 dark:text-teal-300',
  },
  cyan: {
    strip: 'from-cyan-600 via-sky-600 to-blue-500',
    learnerAccent: 'text-cyan-600 dark:text-cyan-300',
  },
  sky: {
    strip: 'from-sky-600 via-blue-600 to-cyan-500',
    learnerAccent: 'text-sky-600 dark:text-sky-300',
  },
  orange: {
    strip: 'from-orange-600 via-amber-500 to-orange-400',
    learnerAccent: 'text-orange-600 dark:text-orange-300',
  },
  amber: {
    strip: 'from-amber-600 via-orange-500 to-amber-400',
    learnerAccent: 'text-amber-600 dark:text-amber-300',
  },
  green: {
    strip: 'from-emerald-600 via-green-600 to-teal-500',
    learnerAccent: 'text-emerald-600 dark:text-emerald-300',
  },
  emerald: {
    strip: 'from-emerald-600 via-teal-500 to-cyan-400',
    learnerAccent: 'text-emerald-600 dark:text-emerald-300',
  },
  violet: {
    strip: 'from-violet-600 via-indigo-600 to-blue-500',
    learnerAccent: 'text-violet-600 dark:text-violet-300',
  },
  rose: {
    strip: 'from-rose-600 via-pink-600 to-fuchsia-500',
    learnerAccent: 'text-rose-600 dark:text-rose-300',
  },
  pink: {
    strip: 'from-pink-600 via-rose-600 to-orange-400',
    learnerAccent: 'text-pink-600 dark:text-pink-300',
  },
  red: {
    strip: 'from-rose-600 via-red-600 to-orange-500',
    learnerAccent: 'text-red-600 dark:text-red-300',
  },
  slate: {
    strip: 'from-slate-700 via-slate-600 to-slate-500',
    learnerAccent: 'text-slate-600 dark:text-slate-300',
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
  compact = false,
  className = '',
}) {
  const { theme: resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const palette = tones[tone] || tones.blue
  const detailText = typeof detail === 'string' ? detail.trim() : detail
  const textColor = isDark ? '#ffffff' : '#000000'
  const textToneClass = isDark ? 'text-white' : 'text-black'
  const badgeBackground = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.98)'
  const badgeBorder = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.82)'
  const pillBackground = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.98)'
  const pillBorder = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.75)'
  const pillTextColor = textColor
  const cardClasses = variant === 'learner'
    ? `rounded-[18px] border border-white/12 bg-gradient-to-br shadow-[0_18px_42px_rgba(15,23,42,0.16)] ${palette.strip}`
    : `rounded-[16px] bg-gradient-to-br shadow-[0_16px_36px_rgba(15,23,42,0.14)] ${palette.strip}`
  const minHeightClass = compact ? 'min-h-[138px]' : 'min-h-[178px]'

  return (
    <div className={`group relative isolate overflow-hidden ${cardClasses} ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(2,6,23,0.12))]" />
      <div className={`relative flex ${minHeightClass} flex-col p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`font-black uppercase tracking-[0.34em] ${compact ? 'text-[0.7rem]' : 'text-[0.78rem]'} ${textToneClass}`} style={{ color: textColor, WebkitTextFillColor: textColor }}>
              {title}
            </p>
            <p
              className={`${compact ? 'mt-2 text-[clamp(1.55rem,2.6vw,2.05rem)]' : 'mt-3 text-[clamp(2.1rem,3.2vw,2.55rem)]'} font-black leading-none tracking-[-0.04em] ${textToneClass}`}
              style={{ color: textColor, WebkitTextFillColor: textColor }}
            >
              {loading ? <span className="skeleton inline-block h-8 w-20 rounded bg-white/25" /> : value}
            </p>
            {detailText ? (
              <p
                className={`max-w-[16rem] font-semibold leading-5 ${compact ? 'mt-1.5 text-xs' : 'mt-2 text-sm'} ${textToneClass}`}
                style={{ color: textColor, WebkitTextFillColor: textColor }}
              >
                {detailText}
              </p>
            ) : null}
          </div>
          {Icon ? (
            <span
              className={`grid shrink-0 place-items-center rounded-2xl border shadow-[0_12px_28px_rgba(15,23,42,0.18)] backdrop-blur-md ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}
              style={{
                backgroundColor: badgeBackground,
                borderColor: badgeBorder,
                color: textColor,
              }}
            >
              <Icon
                size={compact ? 18 : 23}
                strokeWidth={2.4}
                className={textToneClass}
                color={textColor}
                style={{ color: textColor, fill: 'none' }}
                aria-hidden="true"
              />
            </span>
          ) : null}
        </div>
        {trendValue || trendLabel ? (
          <div className="mt-auto flex items-center gap-2 pt-4 text-xs font-semibold">
            {trendValue ? (
              <span
                className="inline-flex min-h-7 items-center rounded-full border px-3 font-black shadow-[0_1px_2px_rgba(15,23,42,0.16)]"
                style={{
                  backgroundColor: pillBackground,
                  borderColor: pillBorder,
                  color: pillTextColor,
                  WebkitTextFillColor: pillTextColor,
                }}
              >
                {trendValue}
              </span>
            ) : null}
            {trendLabel ? <span className={textToneClass} style={{ color: textColor, WebkitTextFillColor: textColor }}>{trendLabel}</span> : null}
          </div>
        ) : null}
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
