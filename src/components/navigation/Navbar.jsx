import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/classNames.js'
import NotificationCenter from './NotificationCenter.jsx'
import ThemeToggleButton from '../theme/ThemeToggleButton.jsx'
import { logout } from '../../redux/slices/authSlice.js'

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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const dashboardPath = auth.user
    ? auth.role === 'admin'
      ? '/admin'
      : auth.role === 'instructor'
        ? '/instructor'
        : '/dashboard'
    : '/login'

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 border-white/10 dark:border-white/10 light:border-black/10">
      <div className="dark:bg-slate-950/70 light:bg-white/80">
        <div className="dark:border-white/10 light:border-black/10 border-b">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <Link
              to="/"
              className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-white"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-slate-950 shadow-glow">
                CA
              </span>
               UptoSkills
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      'text-sm font-medium transition-colors',
                      isActive
                        ? 'dark:text-cyan-300 light:text-cyan-600'
                        : 'dark:text-slate-300 dark:hover:text-white light:text-slate-700 light:hover:text-slate-900',
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
                    onClick={() => setProfileOpen((value) => !value)}
                    className="btn-secondary gap-2"
                  >
                    {auth.user.fullName || auth.user.email || 'Account'} <ChevronDown size={16} />
                  </button>
                  {profileOpen ? (
                    <div className="absolute right-0 mt-3 w-56 rounded-3xl border border-black/10 bg-white p-2 shadow-glow dark:border-white/10 dark:bg-slate-950">
                      {[
                        ['Dashboard', dashboardPath],
                        ['Profile', '/profile'],
                        ['Settings', '/settings'],
                        ['Notifications', '/notifications'],
                      ].map(([label, href]) => (
                        <button key={href} onClick={() => { setProfileOpen(false); navigate(href) }} className="block w-full rounded-2xl px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10">
                          {label}
                        </button>
                      ))}
                      <button onClick={() => { dispatch(logout()); setProfileOpen(false); navigate('/') }} className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm text-red-600 hover:bg-red-500/10">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hidden items-center gap-2 lg:flex">
                  <button onClick={() => navigate('/login')} className="btn-secondary">Login</button>
                  <button onClick={() => navigate('/register')} className="btn-primary">Register</button>
                </div>
              )}

              <button
                onClick={() => setDrawerOpen((state) => !state)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-200 light:border-black/10 light:bg-black/5 light:text-slate-700"
                aria-label="Mobile menu"
              >
                {drawerOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {drawerOpen && (
            <div className="lg:hidden border-t px-6 py-5 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-slate-950/95 light:border-black/10 light:bg-white/95">
              <div className="space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="block rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-white/5 dark:text-slate-200 dark:hover:bg-white/5 light:text-slate-700 light:hover:bg-black/5"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setDrawerOpen(false)
                    navigate(dashboardPath)
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-3 text-sm font-semibold dark:text-slate-950 light:text-slate-900"
                >
                  {auth.user ? 'Dashboard' : 'Login'}
                </button>
                {!auth.user ? (
                  <button
                    onClick={() => {
                      setDrawerOpen(false)
                      navigate('/register')
                    }}
                    className="w-full rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold dark:border-white/10"
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
