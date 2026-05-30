import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../utils/classNames.js'
import NotificationCenter from './NotificationCenter.jsx'
import ThemeToggleButton from './ThemeToggleButton.jsx'
import { logout } from '../../../store/slices/authSlice.js'
import Logo from './Logo.jsx'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Courses', href: '/courses' },
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
]

export default function Navbar() {
  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAdminHost = import.meta.env.MODE === 'admin'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const dashboardPath = auth.user
    ? auth.role === 'admin'
      ? '/admin'
      : '/dashboard'
    : '/login'

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[0_12px_36px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-colors duration-300">
      <div>
        <div className="border-b border-[var(--border-color)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <Logo to="/" />

            <nav className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition-all',
                    isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggleButton />

              <div className="hidden lg:block">
                <NotificationCenter />
              </div>

              {auth.user ? (
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    className="btn-secondary gap-2 rounded-xl"
                  >
                    {auth.user.fullName || auth.user.email || 'Account'} <ChevronDown size={16} />
                  </button>
                  {profileOpen ? (
                    <div className="theme-surface animate-upto-fade-slide absolute right-0 mt-3 w-60 rounded-xl p-2 shadow-glow">
                      {[
                        ['Dashboard', dashboardPath],
                        ['Profile', '/profile'],
                        ['Settings', '/settings'],
                        ['Notifications', '/notifications'],
                      ].map(([label, href]) => (
                        <button type="button" key={href} onClick={() => { setProfileOpen(false); navigate(href) }} className="block w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                          {label}
                        </button>
                      ))}
                      <button type="button" onClick={() => { dispatch(logout()); setProfileOpen(false); navigate('/') }} className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-500/10 dark:text-red-200">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hidden items-center gap-2 lg:flex">
                  <button type="button" onClick={() => navigate('/login')} className="btn-secondary">Learner Login</button>
                  {isAdminHost ? <button type="button" onClick={() => navigate('/admin-login')} className="btn-secondary">Admin</button> : null}
                  <button type="button" onClick={() => navigate('/register')} className="btn-primary">Register</button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setDrawerOpen((state) => !state)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm transition hover:border-[var(--accent-primary)]/50 lg:hidden"
                aria-label="Mobile menu"
              >
                {drawerOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {drawerOpen && (
            <div className="theme-surface animate-upto-fade-slide border-t px-6 py-5 backdrop-blur-xl transition-colors duration-300 lg:hidden">
              <div className="space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    navigate(dashboardPath)
                  }}
                  className="btn-primary w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-glow"
                >
                  {auth.user ? 'Dashboard' : 'Login'}
                </button>
                {!auth.user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false)
                      navigate('/register')
                    }}
                    className="w-full rounded-xl border border-[var(--border-color)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-subtle)]"
                  >
                    Register
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

