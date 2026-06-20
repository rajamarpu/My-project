import {
  Activity, Award, BarChart3, Bell, BookOpenCheck, BriefcaseBusiness,
  CircleHelp, ClipboardCheck, Compass, CreditCard, FolderTree, GraduationCap,
  LayoutDashboard, LifeBuoy, Medal, MessageCircle, Settings, Upload,
  UserCircle, UserPlus, Users,
} from 'lucide-react'

export const publicNavigation = [
  { label: 'Courses', icon: GraduationCap, href: '/courses' },
  { label: 'Features', icon: BriefcaseBusiness, href: '/features' },
  { label: 'Mentors', icon: Medal, href: '/mentors' },
  { label: 'Pricing', icon: Compass, href: '/pricing' },
]

export const learnerNavigation = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', end: true },
  { label: 'Explore', icon: Compass, href: '/courses' },
  { label: 'Learning Path', icon: GraduationCap, href: '/learning-path' },
  { label: 'Community', icon: MessageCircle, href: '/community' },
]

export const learnerAccountNavigation = [
  { label: 'Profile', icon: UserCircle, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Certificates', icon: Award, href: '/certificates' },
  { label: 'Saved courses', icon: BookOpenCheck, href: '/saved' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  { label: 'Payments', icon: CreditCard, href: '/payments' },
]

export const instructorNavigation = [
  { label: 'Overview', icon: LayoutDashboard, href: '/instructor', end: true },
  { label: 'Courses', icon: BookOpenCheck, href: '/instructor/courses' },
  { label: 'Live Sessions', icon: Activity, href: '/instructor/live-sessions' },
  { label: 'Course Catalog', icon: Compass, href: '/courses' },
  { label: 'Support', icon: LifeBuoy, href: '/support' },
]

export const instructorAccountNavigation = [
  { label: 'Profile', icon: UserCircle, href: '/instructor/profile' },
  { label: 'Settings', icon: Settings, href: '/instructor/settings' },
  { label: 'Notifications', icon: Bell, href: '/instructor/notifications' },
]

export const adminNavigationSections = [
  { label: 'Overview', items: [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { label: 'Reports', href: '/admin/reports', icon: ClipboardCheck },
  ] },
  { label: 'Learning', items: [
    { label: 'Courses', href: '/admin/courses', icon: BookOpenCheck },
    { label: 'Upload Course', href: '/admin/upload-course', icon: Upload },
    { label: 'Categories', href: '/admin/categories', icon: FolderTree },
    { label: 'Questions', href: '/admin/questions', icon: CircleHelp },
    { label: 'Evaluations', href: '/admin/evaluations', icon: ClipboardCheck },
  ] },
  { label: 'People', items: [
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Learners', href: '/admin/learners', icon: GraduationCap },
    { label: 'Instructors', href: '/admin/instructors', icon: Users },
    { label: 'Add Learner', href: '/admin/add-learner', icon: UserPlus },
    { label: 'Add Instructor', href: '/admin/add-instructor', icon: UserPlus },
    { label: 'Enrollments', href: '/admin/enrollments', icon: Activity },
    { label: 'Instructor Changes', href: '/admin/instructor-changes', icon: Activity },
  ] },
  { label: 'Operations', items: [
    { label: 'Revenue', href: '/admin/revenue', icon: CreditCard },
    { label: 'Payments', href: '/admin/payments', icon: CreditCard },
    { label: 'Certificates', href: '/admin/certificates', icon: Award },
    { label: 'Generate Certificate', href: '/admin/generate-certificate', icon: Award },
    { label: 'Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
  ] },
  { label: 'Account', items: [
    { label: 'Profile', href: '/admin/profile', icon: UserCircle },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ] },
]

export const footerNavigation = [
  { label: 'Learn', items: [
    { label: 'Courses', href: '/courses' }, { label: 'Categories', href: '/categories' },
    { label: 'Mentors', href: '/mentors' }, { label: 'Community', href: '/community' },
  ] },
  { label: 'Company', items: [
    { label: 'About', href: '/about' }, { label: 'Features', href: '/features' },
    { label: 'Careers', href: '/careers' }, { label: 'Contact', href: '/contact' },
  ] },
  { label: 'Support', items: [
    { label: 'Help center', href: '/help' }, { label: 'FAQ', href: '/faq' },
    { label: 'Support', href: '/support' }, { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ] },
]

export function navigationForRole(role, authenticated = false) {
  if (!authenticated) return publicNavigation
  if (role === 'instructor') return instructorNavigation
  if (role === 'learner') return learnerNavigation
  return publicNavigation
}

export function accountNavigationForRole(role) {
  if (role === 'instructor') return instructorAccountNavigation
  if (role === 'learner') return learnerAccountNavigation
  return []
}

export function homeForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'instructor') return '/instructor'
  if (role === 'learner') return '/dashboard'
  return '/login'
}
