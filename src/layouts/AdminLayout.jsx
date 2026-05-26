import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Activity, Award, BarChart3, Bell, BookOpenCheck, CreditCard, FolderTree, GraduationCap, LogOut, Settings, Upload, UserCircle, Users } from 'lucide-react'
import { logout } from '../store/slices/authSlice.js'
import { cn } from '../utils/classNames.js'
import Logo from '../components/ui/Navbar/Logo.jsx'

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Learners', href: '/admin/learners', icon: GraduationCap },
  { label: 'Instructors', href: '/admin/instructors', icon: Users },
  { label: 'Courses', href: '/admin/courses', icon: BookOpenCheck },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Revenue', href: '/admin/revenue', icon: CreditCard },
  { label: 'Certificates', href: '/admin/certificates', icon: Award },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Enrollments', href: '/admin/enrollments', icon: Activity },
  { label: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Upload Course', href: '/admin/upload-course', icon: Upload },
  { label: 'Profile', href: '/admin/profile', icon: UserCircle },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-[var(--border-color)] bg-[var(--bg-elevated)] p-5">
          <Logo to="/admin" admin />

          <nav className="mt-8 max-h-[calc(100vh-190px)] space-y-1 overflow-y-auto pr-1">
            {adminNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition',
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
            className="mt-5 flex w-full items-center gap-3 rounded-lg border border-red-300/20 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
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
