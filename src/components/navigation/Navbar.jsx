import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useSelector } from 'react-redux'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/classNames.js'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Explore Courses', href: '/explore' },
  { label: 'Celebrity Mentors', href: '/community' },
  { label: 'Categories', href: '/explore' },
  { label: 'Community', href: '/community' },
  { label: 'Pricing', href: '/#pricing' },
]

export default function Navbar() {
  const { theme, toggleTheme } = useTheme()
  const auth = useSelector((state) => state.auth)
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const dashboardPath = auth.user
    ? auth.role === 'admin'
      ? '/admin'
      : auth.role === 'instructor'
      ? '/instructor'
      : '/dashboard'
    : '/login'

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-glow">
            CA
          </span>
          Celebrity Academy
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors',
                  isActive ? 'text-cyan-300' : 'text-slate-300 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={() => navigate(dashboardPath)}
            className="btn-secondary hidden rounded-full px-5 py-3 text-sm lg:inline-flex"
          >
            {auth.user ? 'Dashboard' : 'Login'}
          </button>

          <button
            onClick={() => setDrawerOpen((state) => !state)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 lg:hidden"
            aria-label="Mobile menu"
          >
            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="lg:hidden border-t border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur-xl">
          <div className="space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setDrawerOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setDrawerOpen(false)
                navigate(dashboardPath)
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              {auth.user ? 'Dashboard' : 'Login'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
