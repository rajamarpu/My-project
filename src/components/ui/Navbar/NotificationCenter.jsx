import { useMemo, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useSelector } from 'react-redux'

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const notifications = useSelector((state) => state.auth.notifications)
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
        <div className="theme-surface absolute right-0 mt-3 w-80 rounded-2xl p-4 shadow-glow">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[var(--text-primary)]">Notifications</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close notifications">
              <X size={18} />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {notifications.map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border-color)] bg-black/[0.03] p-3 text-sm dark:bg-white/5">
                <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                <p className="mt-1 text-[var(--text-secondary)]">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
