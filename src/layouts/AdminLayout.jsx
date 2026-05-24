import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { BarChart3, BookOpenCheck, LogOut, Settings, Users, WandSparkles } from 'lucide-react'
import { logout } from '../redux/slices/authSlice.js'
import { cn } from '../utils/classNames.js'

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Courses', href: '/admin/manage-courses', icon: BookOpenCheck },
  { label: 'AI Teachers', href: '/admin/review', icon: WandSparkles },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[var(--border-color)] bg-[var(--bg-elevated)] p-5">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#14b8a6] font-bold text-white">
              US
            </span>
            <span>
              <span className="block text-lg font-semibold">UptoSkills</span>
              <span className="block text-xs uppercase tracking-[0.22em] text-cyan-500">Admin</span>
            </span>
          </Link>

          <nav className="mt-8 space-y-2">
            {adminNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-cyan-400/15 text-cyan-600 ring-1 ring-cyan-300/25 dark:text-cyan-100'
                      : 'text-[var(--text-secondary)] hover:bg-black/[0.04] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.06]',
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => {
              dispatch(logout())
              navigate('/admin-login')
            }}
            className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-red-300/20 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <main className="min-w-0 bg-[var(--bg-primary)] px-5 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
