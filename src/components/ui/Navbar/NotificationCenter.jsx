import { useMemo, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useSelector } from 'react-redux'

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const storedNotifications = useSelector((state) => state.auth.notifications)
  const notifications = Array.isArray(storedNotifications) ? storedNotifications : []
  const unread = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-cyan-400/50"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">{unread}</span> : null}
      </button>
      {open ? (
        <div className="theme-surface absolute right-0 z-[90] mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl p-4 shadow-glow sm:w-[28rem]">
          <div className="flex items-center justify-between gap-4">
            <p className="font-semibold text-[var(--text-primary)]">Notifications</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
            {notifications.length ? notifications.map((item, index) => (
              <div key={item.id || `${item.title || 'notification'}-${index}`} className="flex min-w-0 items-start gap-3 rounded-xl border border-[var(--border-color)] bg-black/[0.03] p-3 text-sm dark:bg-white/5">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-primary)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-[var(--text-primary)]">{item.title || 'Notification'}</p>
                  <p className="mt-1 leading-5 text-[var(--text-secondary)]">{item.message || 'No details available.'}</p>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-[var(--border-color)] bg-black/[0.03] p-4 text-sm text-[var(--text-secondary)] dark:bg-white/5">
                No notifications right now.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
