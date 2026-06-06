import { NavLink } from 'react-router-dom'
import { cn } from '../../../utils/classNames.js'

export default function Sidebar({ items = [] }) {
  return (
    <nav className="grid gap-1" aria-label="Section navigation">
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-semibold transition',
              isActive
                ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
            )
          }
        >
          {item.icon ? <item.icon size={18} /> : null}
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
