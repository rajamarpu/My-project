import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Activity, Award, BarChart3, Bell, BookOpenCheck, CircleHelp, CreditCard, FolderTree, GraduationCap, LogOut, Menu, Settings, Upload, UserCircle, Users, X } from 'lucide-react'
import { useState } from 'react'
import { logout } from '../store/slices/authSlice.js'
import { cn } from '../utils/classNames.js'
import Logo from '../components/ui/Navbar/Logo.jsx'
import ThemeToggleButton from '../components/ui/Navbar/ThemeToggleButton.jsx'

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Learners', href: '/admin/learners', icon: GraduationCap },
  { label: 'Instructors', href: '/admin/instructors', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpenCheck },
  { label: 'Questions', href: '/admin/questions', icon: CircleHelp },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Revenue', href: '/admin/revenue', icon: CreditCard },
  { label: 'Certificates', href: '/admin/certificates', icon: Award },
  { label: 'Generate Certificate', href: '/admin/generate-certificate', icon: Award },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Enrollments', href: '/admin/enrollments', icon: Activity },
  { label: 'Instructor Changes', href: '/admin/instructor-changes', icon: Activity },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Upload Course', href: '/admin/upload-course', icon: Upload },
  { label: 'Profile', href: '/admin/profile', icon: UserCircle },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="admin-shell min-h-screen text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
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

        <aside className={`${navOpen ? 'block animate-upto-fade-slide' : 'hidden'} fixed inset-x-4 top-20 z-40 max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 shadow-soft backdrop-blur-xl lg:sticky lg:top-0 lg:block lg:h-screen lg:rounded-none lg:border-x-0 lg:border-y-0 lg:border-r lg:shadow-none`}>
          <div className="flex items-center justify-between gap-3">
            <Logo to="/admin" admin />
            <div className="hidden lg:block">
              <ThemeToggleButton />
            </div>
          </div>

          <nav className="admin-scrollbar mt-8 max-h-[calc(100vh-190px)] space-y-1 overflow-y-auto pr-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={(event) => {
                  event.currentTarget.blur()
                  setNavOpen(false)
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/20 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
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
            className="mt-5 flex w-full items-center gap-3 rounded-xl border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-200"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <main className="min-w-0 px-4 py-5 sm:px-5 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
