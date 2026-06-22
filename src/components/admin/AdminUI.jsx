import { AlertCircle, ArrowRight, CheckCircle2, ClipboardCheck, Loader2, SearchX, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import KpiCard from '../ui/Dashboard/KpiCard.jsx'

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

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
  onClick,
  loading,
  trend,
  trendLabel,
}) {
  return (
    <KpiCard
      label={label}
      value={value}
      detail={detail}
      icon={Icon}
      tone={tone}
      onClick={onClick}
      loading={loading}
      trend={trend}
      trendLabel={trendLabel}
    />
  )
}

export function AdminQuickAction({ icon: Icon, label, description, onClick, tone = 'primary' }) {
  const toneStyles = {
    blue: { border: 'border-blue-200/70 dark:border-blue-400/20', icon: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200', accent: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-50/60 dark:bg-blue-500/8' },
    teal: { border: 'border-teal-200/70 dark:border-teal-400/20', icon: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200', accent: 'text-teal-600 dark:text-teal-300', bg: 'bg-teal-50/60 dark:bg-teal-500/8' },
    orange: { border: 'border-orange-200/70 dark:border-orange-400/20', icon: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200', accent: 'text-orange-600 dark:text-orange-300', bg: 'bg-orange-50/60 dark:bg-orange-500/8' },
    purple: { border: 'border-purple-200/70 dark:border-purple-400/20', icon: 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200', accent: 'text-purple-600 dark:text-purple-300', bg: 'bg-purple-50/60 dark:bg-purple-500/8' },
    pink: { border: 'border-pink-200/70 dark:border-pink-400/20', icon: 'bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-200', accent: 'text-pink-600 dark:text-pink-300', bg: 'bg-pink-50/60 dark:bg-pink-500/8' },
    sky: { border: 'border-sky-200/70 dark:border-sky-400/20', icon: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200', accent: 'text-sky-600 dark:text-sky-300', bg: 'bg-sky-50/60 dark:bg-sky-500/8' },
    amber: { border: 'border-amber-200/70 dark:border-amber-400/20', icon: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200', accent: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50/60 dark:bg-amber-500/8' },
    green: { border: 'border-emerald-200/70 dark:border-emerald-400/20', icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200', accent: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-50/60 dark:bg-emerald-500/8' },
  }
  const toneConfig = toneStyles[tone] || toneStyles.blue
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[18px] border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 ${toneConfig.border} ${toneConfig.bg} bg-white/90 dark:bg-white/5`}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneConfig.icon}`}>
        {Icon ? <Icon size={18} strokeWidth={2} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-xs font-bold uppercase tracking-[0.18em] ${toneConfig.accent}`}>Management</span>
        <span className="mt-1 block text-base font-semibold text-[var(--text-primary)] dark:text-white">{label}</span>
        <span className="mt-1 block text-sm leading-5 text-[var(--text-secondary)] dark:text-slate-300">{description}</span>
      </span>
      <span className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${toneConfig.icon}`}>Open</span>
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
      <Icon className={`mt-0.5 shrink-0 ${type === 'success' ? 'animate-upto-success-pop' : ''}`} size={17} />
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

export function AdminFullPageLoader({ label = 'Loading...' }) {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <Loader2 className="mx-auto animate-spin text-[var(--accent-primary)]" size={42} />
        <p className="mt-4 text-sm font-semibold text-[var(--text-primary)]">{label}</p>
      </div>
    </div>
  )
}

export function AdminModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'info', onConfirm, onClose, children }) {
  const closeButtonRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    closeButtonRef.current?.focus()
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])
  if (!open) return null
  const toneClass = tone === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-primary text-white'
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/58 p-4 backdrop-blur-sm animate-upto-backdrop-enter" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <div className="w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 shadow-soft animate-upto-modal-enter" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="admin-modal-title" className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
            {message ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{message}</p> : null}
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-[var(--bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/70" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[var(--border-color)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-subtle)] active:scale-[0.98]">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} className={`min-h-11 rounded-lg px-4 text-sm font-semibold transition active:scale-[0.98] ${toneClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export function AdminToastStack({ toasts, onDismiss }) {
  return (
    <div className="fixed right-4 top-4 z-[90] grid w-[min(24rem,calc(100vw-2rem))] gap-3" aria-live="polite" aria-label="Admin notifications">
      {toasts.map((toast) => {
        const styles = {
          success: 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-100',
          error: 'border-red-500/30 bg-red-50 text-red-800 dark:bg-red-500/15 dark:text-red-100',
          warning: 'border-amber-500/30 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100',
          info: 'border-cyan-500/30 bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-100',
        }[toast.type || 'info']
        return (
          <div key={toast.id} className={`animate-upto-toast-in rounded-lg border px-4 py-3 text-sm shadow-soft ${styles}`}>
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <button type="button" onClick={() => onDismiss(toast.id)} className="rounded focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/70" aria-label="Dismiss toast">
                <X size={16} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AdminEmptyState({ title = 'No records found', message = 'Try changing filters or creating a new record.', actionLabel, onAction }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-6 text-center">
      <div>
        <SearchX className="mx-auto text-[var(--text-muted)]" size={30} />
        <p className="mt-3 font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{message}</p>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-gradient)] px-4 text-sm font-semibold text-white shadow-soft transition active:scale-[0.98]">
            {actionLabel} <ArrowRight size={16} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return <span className="text-xs font-medium text-red-600 dark:text-red-200">{children}</span>
}

export function AdminStatusBadge({ value }) {
  const label = String(value ?? '').trim()
  const normalized = label.toUpperCase()
  const tone = normalized.includes('APPROVED') || normalized.includes('PAID') || normalized.includes('PASSED') || normalized.includes('ISSUED') || normalized === 'YES' || normalized === 'TRUE'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
    : normalized.includes('PENDING') || normalized.includes('DUE') || normalized.includes('REVIEW')
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-100'
      : normalized.includes('REJECT') || normalized.includes('SUSPEND') || normalized.includes('FAILED') || normalized.includes('NO') || normalized === 'FALSE'
        ? 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-100'
        : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100'

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold uppercase tracking-[0.08em] ${tone}`}>
      {label || 'Unknown'}
    </span>
  )
}

export function AdminInsightStrip({ items = [] }) {
  if (!items.length) return null
  const tones = ['blue', 'teal', 'orange', 'purple', 'pink', 'sky', 'amber', 'green']
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const Icon = item.icon || ClipboardCheck
        return (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.value}
            detail={item.detail}
            icon={Icon}
            tone={item.tone || tones[index % tones.length]}
            trend={item.trend}
            trendLabel={item.trendLabel}
          />
        )
      })}
    </div>
  )
}

export function AdminGuidancePanel({ title, items = [] }) {
  if (!items.length) return null
  return (
    <div className="admin-panel p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{title}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="theme-subcard flex items-start gap-2 rounded-lg p-3 text-sm text-[var(--text-secondary)]">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-500" size={16} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
