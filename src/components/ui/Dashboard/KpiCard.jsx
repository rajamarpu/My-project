import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '../../../utils/classNames.js'

const KPI_TONES = {
  blue: {
    gradient: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 56%, #60A5FA 100%)',
  },
  teal: {
    gradient: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 56%, #2DD4BF 100%)',
  },
  orange: {
    gradient: 'linear-gradient(135deg, #C2410C 0%, #F97316 56%, #FB923C 100%)',
  },
  purple: {
    gradient: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 56%, #A78BFA 100%)',
  },
  green: {
    gradient: 'linear-gradient(135deg, #15803D 0%, #22C55E 56%, #4ADE80 100%)',
  },
  red: {
    gradient: 'linear-gradient(135deg, #B91C1C 0%, #EF4444 56%, #F87171 100%)',
  },
  pink: {
    gradient: 'linear-gradient(135deg, #DB2777 0%, #EC4899 56%, #F472B6 100%)',
  },
  sky: {
    gradient: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 56%, #38BDF8 100%)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 56%, #FBBF24 100%)',
  },
}

function TrendIcon({ direction }) {
  if (direction === 'down') return <ArrowDownRight size={14} strokeWidth={2.5} />
  if (direction === 'flat') return <Minus size={14} strokeWidth={2.5} />
  return <ArrowUpRight size={14} strokeWidth={2.5} />
}

export default function KpiCard({
  label,
  value,
  detail,
  trend,
  trendLabel = 'vs last 30 days',
  icon: Icon,
  tone = 'blue',
  loading = false,
  onClick,
  className,
}) {
  const toneConfig = KPI_TONES[tone] || KPI_TONES.blue
  const Wrapper = onClick ? 'button' : 'article'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'kpi-card group relative min-h-[186px] overflow-hidden rounded-[20px] border border-white/18 p-5 text-left shadow-[0_18px_42px_rgba(15,23,42,0.14)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(15,23,42,0.2)] focus:outline-none focus:ring-2 focus:ring-white/50',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{ backgroundImage: toneConfig.gradient }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.34) 0 10%, transparent 11%), radial-gradient(circle at 82% 12%, rgba(255,255,255,0.2) 0 8%, transparent 9%), linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02))',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute right-[-0.4rem] top-[-0.4rem] opacity-20"
      >
        {Icon ? <Icon size={122} strokeWidth={1.5} /> : null}
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-[-1.1rem] left-[-0.9rem] h-24 w-24 rounded-full bg-white/12 blur-2xl"
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.22em] text-white/82">{label}</p>
            <p className="mt-2 text-xs leading-5 text-white/85">{detail}</p>
          </div>
          {Icon ? (
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md">
              <Icon size={20} strokeWidth={2} />
            </span>
          ) : null}
        </div>

        <div className="mt-6 flex-1">
          <p className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
            {loading ? <span className="inline-block h-9 w-24 animate-pulse rounded-full bg-white/30" /> : value}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {trend ? (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/18 bg-white/18 px-3 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-md">
              <TrendIcon direction={trend.startsWith('-') ? 'down' : trend === '0%' || trend === '0' ? 'flat' : 'up'} />
              <span>{trend}</span>
              <span className="text-white/80">{trendLabel}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Wrapper>
  )
}
