import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Settings, UserCircle, X } from 'lucide-react'
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
    <header className="site-header sticky top-0 z-50 transition-colors duration-300">
      <div>
        <div>
          <div className="mx-auto flex w-full max-w-full items-center justify-between gap-6 px-[clamp(16px,4vw,64px)] py-3">
            <Logo to="/" />

            <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex" aria-label="Primary navigation">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'nav-link',
                      isActive && 'nav-link-active',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex shrink-0 items-center gap-3">
              <ThemeToggleButton />

              <div className="hidden lg:block">
                <NotificationCenter />
              </div>

              {auth.user ? (
                <div className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((value) => !value)}
                    className="btn-secondary min-w-[112px] gap-2 whitespace-nowrap rounded-xl px-4"
                  >
                    <span className="max-w-[9rem] truncate">{auth.user.fullName || auth.user.name || auth.user.email || 'Account'}</span>
                    <ChevronDown size={16} className="shrink-0" />
                  </button>
                  {profileOpen ? (
                    <div className="absolute right-0 z-[90] mt-3 w-72 overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-2 text-[var(--text-primary)] shadow-glow backdrop-blur-xl animate-upto-fade-slide">
                      {[
                        ['Dashboard', dashboardPath, LayoutDashboard],
                        ['Profile', '/profile', UserCircle],
                        ['Settings', '/settings', Settings],
                        ['Notifications', '/notifications', Bell],
                      ].map(([label, href, Icon]) => (
                        <button type="button" key={href} onClick={() => { setProfileOpen(false); navigate(href) }} className="flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]">
                          <Icon size={16} className="shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{label}</span>
                        </button>
                      ))}
                      <button type="button" onClick={() => { dispatch(logout()); setProfileOpen(false); navigate('/') }} className="flex min-h-11 w-full items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-200">
                        <LogOut size={16} className="shrink-0" />
                        <span className="min-w-0 flex-1 truncate">Logout</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hidden items-center gap-2 lg:flex">
                  <button type="button" onClick={() => navigate('/login')} className="action-link">Learner Login</button>
                  {isAdminHost ? <button type="button" onClick={() => navigate('/admin-login')} className="action-link">Admin</button> : null}
                  <button type="button" onClick={() => navigate('/register')} className="btn-primary min-h-10 rounded-lg px-4 py-2 text-sm">Register</button>
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
            <div className="mobile-drawer animate-upto-fade-slide px-4 py-4 transition-colors duration-300 sm:px-6 lg:hidden">
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) => cn('nav-link w-full justify-start', isActive && 'nav-link-active')}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="my-2 h-px bg-[var(--border-color)]" />
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    navigate(dashboardPath)
                  }}
                  className="btn-primary w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-glow"
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
                    className="action-link w-full py-3"
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

