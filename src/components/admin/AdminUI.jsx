import { AlertCircle, CheckCircle2, Loader2, SearchX } from 'lucide-react'

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="admin-panel p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em] sm:text-sm">{eyebrow}</p>
          <h1 className="mt-3 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">{title}</h1>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  )
}

export function AdminMetricCard({ label, value, detail, icon: Icon, tone = 'cyan', onClick, loading }) {
  const toneClass = {
    cyan: 'from-cyan-400/18 to-teal-400/10 text-cyan-700 dark:text-cyan-100',
    orange: 'from-orange-400/18 to-amber-400/10 text-orange-700 dark:text-orange-100',
    green: 'from-emerald-400/18 to-teal-400/10 text-emerald-700 dark:text-emerald-100',
    blue: 'from-blue-400/18 to-cyan-400/10 text-blue-700 dark:text-blue-100',
    red: 'from-red-400/18 to-orange-400/10 text-red-700 dark:text-red-100',
  }[tone]

  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="admin-panel admin-panel-hover min-h-[144px] w-full p-5 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
        <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${toneClass}`}>
          {Icon ? <Icon size={19} /> : null}
        </span>
      </div>
      <p className="mt-5 text-2xl font-semibold text-[var(--text-primary)]">{loading ? <span className="skeleton inline-block h-8 w-20" /> : value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{detail}</p>
    </Wrapper>
  )
}

export function AdminQuickAction({ icon: Icon, label, description, onClick, tone = 'primary' }) {
  const toneClass = tone === 'primary'
    ? 'border-transparent bg-[var(--brand-gradient)] text-white'
    : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-cyan-400/50'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${toneClass}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/16">
        {Icon ? <Icon size={18} /> : null}
      </span>
      <span className="min-w-0">
        <span className="block font-semibold">{label}</span>
        <span className={`mt-0.5 block text-xs ${tone === 'primary' ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{description}</span>
      </span>
    </button>
  )
}

export function AdminNotice({ type = 'info', children }) {
  if (!children) return null
  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100',
    error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-100',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-100',
    info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100',
  }[type]
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle
  return (
    <p className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      <Icon className="mt-0.5 shrink-0" size={17} />
      <span>{children}</span>
    </p>
  )
}

export function AdminLoadingState({ label = 'Loading data...' }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-6 text-center">
      <div>
        <Loader2 className="mx-auto animate-spin text-[var(--accent-primary)]" size={28} />
        <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Fetching the latest platform records.</p>
      </div>
    </div>
  )
}

export function AdminEmptyState({ title = 'No records found', message = 'Try changing filters or creating a new record.' }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-6 text-center">
      <div>
        <SearchX className="mx-auto text-[var(--text-muted)]" size={30} />
        <p className="mt-3 font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
      </div>
    </div>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return <span className="text-xs font-medium text-red-600 dark:text-red-200">{children}</span>
}
