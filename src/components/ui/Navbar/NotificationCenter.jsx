import { useEffect, useMemo, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useSelector } from 'react-redux'

const fallbackNotifications = [
  { id: 'new-course', title: 'New course published', message: 'Fresh courses added by admin will appear in your catalog.', read: false },
  { id: 'new-instructor', title: 'Instructor update', message: 'New instructors and mentor profiles are available in the learning network.', read: false },
  { id: 'assignment-update', title: 'Assignment activity', message: 'Assignment uploads and review updates will be shown here for learners.', read: true },
]

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const storedNotifications = useSelector((state) => state.auth.notifications)
  const notifications = Array.isArray(storedNotifications) && storedNotifications.length ? storedNotifications : fallbackNotifications
  const unread = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--accent-primary)]/60"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span> : null}
      </button>
      {open ? (
        <div className="theme-surface absolute right-0 z-[90] mt-3 w-96 max-w-[calc(100vw-2rem)] rounded-2xl p-4 shadow-glow sm:w-[28rem]" role="dialog" aria-label="Notifications panel">
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
