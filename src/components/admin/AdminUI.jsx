import { AlertCircle, ArrowRight, CheckCircle2, ClipboardCheck, Loader2, SearchX, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import MetricCard from '../ui/Dashboard/MetricCard.jsx'

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

export function AdminMetricCard({ label, value, detail, icon: Icon, tone = 'cyan', onClick, href, loading, className, trendLabel, trendValue }) {
  return (
    <MetricCard
      title={label}
      value={value}
      detail={detail}
      icon={Icon}
      tone={tone}
      onClick={onClick}
      href={href}
      loading={loading}
      className={className}
      trendLabel={trendLabel}
      trendValue={trendValue}
    />
  )
}

export function AdminQuickAction({ icon: Icon, label, description, onClick, tone = 'primary' }) {
  const toneClass = tone === 'primary'
    ? 'border-transparent bg-[var(--brand-gradient)] text-white'
    : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:shadow-soft ${toneClass}`}
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
  const defaultTones = ['blue', 'teal', 'orange', 'rose', 'violet', 'emerald', 'sky', 'amber']
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        return (
          <MetricCard
            key={item.label}
            title={item.label}
            value={item.value}
            detail={item.detail}
            icon={item.icon || ClipboardCheck}
            tone={item.tone || defaultTones[index % defaultTones.length]}
            trendValue={item.trendValue}
            trendLabel={item.trendLabel}
            href={item.href}
            className="min-h-[170px]"
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
