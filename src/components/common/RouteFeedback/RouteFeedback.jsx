import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

const labels = {
  admin: 'Admin',
  courses: 'Courses',
  course: 'Course',
  explore: 'Explore',
  dashboard: 'Dashboard',
  questions: 'Questions',
  profile: 'Profile',
  settings: 'Settings',
  notifications: 'Notifications',
  certificates: 'Certificates',
  reports: 'Reports',
  analytics: 'Analytics',
  users: 'Users',
  learners: 'Learners',
  instructors: 'Instructors',
  assessments: 'Assessments',
  evaluations: 'Evaluations',
  payments: 'Payments',
  categories: 'Categories',
  enrollments: 'Enrollments',
  revenue: 'Revenue',
  'activity-logs': 'Activity Logs',
  'instructor-changes': 'Instructor Changes',
  'upload-course': 'Upload Course',
  'add-learner': 'Add Learner',
  'add-instructor': 'Add Instructor',
  'generate-certificate': 'Generate Certificate',
  instructor: 'Instructor',
  'learning-path': 'Learning Path',
  'live-sessions': 'Live Sessions',
  saved: 'Saved Courses',
}

function titleize(value) {
  return labels[value] || String(value || '').replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function RouteProgress() {
  const location = useLocation()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setActive(true))
    const timer = window.setTimeout(() => setActive(false), 280)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [location.pathname, location.search])

  return <span className={`route-progress ${active ? 'route-progress-active' : ''}`} aria-hidden="true" />
}

export function Breadcrumbs({ admin = false, compact = false }) {
  const location = useLocation()
  const segments = useMemo(() => location.pathname.split('/').filter(Boolean), [location.pathname])
  const rootHref = admin ? '/admin' : '/'
  const rootLabel = admin ? 'Admin' : 'Home'
  const crumbs = (() => {
    if (admin) {
      const pageSegments = segments[0] === 'admin' ? segments.slice(1) : segments
      if (!pageSegments.length) return []
      if (pageSegments[0] === 'edit-course') return [{ href: '/admin/courses', label: 'Courses' }, { label: 'Edit Course' }]
      if (pageSegments[0] === 'edit-category') return [{ href: '/admin/categories', label: 'Categories' }, { label: 'Edit Category' }]
      return [{ label: titleize(pageSegments[0]) }]
    }
    if (segments[0] === 'course') return [{ href: '/courses', label: 'Courses' }, { label: segments[2] === 'assessments' ? 'Assessments' : 'Course Details' }]
    if (segments[0] === 'player') return [{ href: '/courses', label: 'Courses' }, { label: 'Learning Player' }]
    return segments.map((segment, index) => ({
      href: index < segments.length - 1 ? `/${segments.slice(0, index + 1).join('/')}` : undefined,
      label: titleize(segment),
    }))
  })()

  if (compact || !crumbs.length) return null

  return (
    <nav className="breadcrumb-nav" aria-label="Breadcrumb">
      <Link to={rootHref}>{rootLabel}</Link>
      {crumbs.map((crumb, index) => {
        const current = index === crumbs.length - 1
        return (
          <span key={`${crumb.href}-${index}`} className="inline-flex min-w-0 items-center gap-2">
            <ChevronRight size={14} aria-hidden="true" />
            {current || !crumb.href ? <span aria-current={current ? 'page' : undefined}>{crumb.label}</span> : <Link to={crumb.href}>{crumb.label}</Link>}
          </span>
        )
      })}
    </nav>
  )
}
