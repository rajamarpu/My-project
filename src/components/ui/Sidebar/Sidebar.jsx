import { NavLink } from 'react-router-dom'
import { cn } from '../../../utils/classNames.js'

export default function Sidebar({ items = [] }) {
  return (
    <nav className="space-y-2">
      {items.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
              isActive
                ? 'bg-cyan-400/15 text-cyan-100 ring-1 ring-cyan-300/25'
                : 'text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]',
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
