import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Activity, Award, BarChart3, Bell, BookOpenCheck, CircleHelp, ClipboardCheck, CreditCard, FolderTree, GraduationCap, LogOut, Menu, Settings, Upload, UserCircle, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'
import { logout } from '../store/slices/authSlice.js'
import { cn } from '../utils/classNames.js'
import Logo from '../components/ui/Navbar/Logo.jsx'
import ThemeToggleButton from '../components/ui/Navbar/ThemeToggleButton.jsx'

const adminNavSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: BarChart3 },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Courses', href: '/admin/courses', icon: BookOpenCheck },
      { label: 'Upload Course', href: '/admin/upload-course', icon: Upload },
      { label: 'Questions', href: '/admin/questions', icon: CircleHelp },
      { label: 'Evaluations', href: '/admin/evaluations', icon: ClipboardCheck },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Learners', href: '/admin/learners', icon: GraduationCap },
      { label: 'Instructors', href: '/admin/instructors', icon: Users },
      { label: 'Add Instructor', href: '/admin/add-instructor', icon: UserPlus },
      { label: 'Enrollments', href: '/admin/enrollments', icon: Activity },
      { label: 'Instructor Changes', href: '/admin/instructor-changes', icon: Activity },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Revenue', href: '/admin/revenue', icon: CreditCard },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Certificates', href: '/admin/certificates', icon: Award },
      { label: 'Generate Certificate', href: '/admin/generate-certificate', icon: Award },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/admin/profile', icon: UserCircle },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
]

export default function AdminLayout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="admin-shell min-h-screen text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[288px_1fr]">
        <div className="sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/95 p-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Logo to="/admin" admin />
            <div className="flex items-center gap-2">
              <ThemeToggleButton />
              <button
                type="button"
                onClick={() => setNavOpen((current) => !current)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-color)] text-[var(--text-primary)]"
                aria-label={navOpen ? 'Close admin menu' : 'Open admin menu'}
              >
                {navOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {navOpen ? <button type="button" aria-label="Close admin menu overlay" onClick={() => setNavOpen(false)} className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm lg:hidden" /> : null}

        <aside className={`${navOpen ? 'block animate-upto-fade-slide' : 'hidden'} fixed inset-x-3 top-20 z-40 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 shadow-soft backdrop-blur-xl sm:inset-x-4 sm:p-4 lg:sticky lg:top-0 lg:block lg:h-screen lg:max-h-none lg:rounded-none lg:border-x-0 lg:border-y-0 lg:border-r lg:p-5 lg:shadow-none`}>
          <div className="flex items-center justify-between gap-3">
            <Logo to="/admin" admin />
            <div className="hidden lg:block">
              <ThemeToggleButton />
            </div>
          </div>

          <nav className="admin-scrollbar mt-7 max-h-[calc(100vh-190px)] space-y-6 overflow-y-auto pr-1" aria-label="Admin navigation">
            {adminNavSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{section.label}</p>
                <div className="mt-2 grid gap-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={(event) => {
                        event.currentTarget.blur()
                        setNavOpen(false)
                      }}
                      className={({ isActive }) =>
                        cn(
                          'admin-nav-link',
                          isActive
                            ? 'admin-nav-link-active'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
                        )
                      }
                    >
                      <item.icon size={17} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => {
              dispatch(logout())
              navigate('/admin-login')
            }}
            className="mt-5 flex w-full items-center gap-3 rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <main key={location.pathname} className="admin-main min-w-0 animate-upto-page-enter px-3 py-4 sm:px-5 sm:py-6 lg:px-5 lg:py-5 xl:px-6">
          {children}
        </main>
      </div>
    </div>
  )
}
