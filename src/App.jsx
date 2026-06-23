import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { Component, useEffect, useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'
import store from './store/store.js'
import ThemeProvider from './store/ThemeProvider.jsx'
import { fetchMe } from './api/api.js'
import { login, logout } from './store/slices/authSlice.js'
import MainLayout from './layouts/MainLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import LandingPage from './pages/Landing/LandingPage.jsx'
import AuthPage from './pages/Auth/AuthPage.jsx'
import AuthCallbackPage from './pages/Auth/AuthCallbackPage.jsx'
import ExploreCoursesPage from './pages/Courses/ExploreCoursesPage.jsx'
import CourseDetailPage from './pages/Courses/CourseDetailPage.jsx'
import StudentDashboard from './pages/Dashboard/StudentDashboard.jsx'
import InstructorDashboard from './pages/Dashboard/InstructorDashboard.jsx'
import AdminDashboard from './pages/Admin/AdminDashboard.jsx'
import AdminDataPage from './pages/Admin/AdminDataPage.jsx'
import AnalyticsPage from './pages/Admin/AnalyticsPage.jsx'
import AdminReportsPage from './pages/Admin/AdminReportsPage.jsx'
import AdminCourseFormPage from './pages/Admin/AdminCourseFormPage.jsx'
import AdminCategoryFormPage from './pages/Admin/AdminCategoryFormPage.jsx'
import QuestionManagementPage from './pages/Admin/QuestionManagementPage.jsx'
import AssessmentEvaluationsPage from './pages/Admin/AssessmentEvaluationsPage.jsx'
import UserPage from './pages/Dashboard/UserPage.jsx'
import LearningPlayerPage from './pages/Courses/LearningPlayerPage.jsx'
import QuestionPracticePage from './pages/Courses/QuestionPracticePage.jsx'
import CommunityPage from './pages/Dashboard/CommunityPage.jsx'
import CertificatesPage from './pages/Dashboard/CertificatesPage.jsx'
import AdminReviewPage from './pages/Admin/AdminReviewPage.jsx'
import NotFoundPage from './pages/Landing/NotFoundPage.jsx'
import AssessmentsPage from './pages/Courses/AssessmentsPage.jsx'
import {
  AdminSettingsPage,
  AboutPage,
  BlogPage,
  CategoriesPage,
  CareersPage,
  CommunityTopicPage,
  ContactPage,
  FaqPage,
  FeaturesPage,
  ForbiddenPage,
  HelpCenterPage,
  LearnerReportsPage,
  LearningPathPage,
  LiveSessionsPage,
  MentorsPage,
  NotificationsPage,
  PolicyPage,
  PaymentHistoryPage,
  PricingPage,
  SavedCoursesPage,
  SettingsPage,
  SupportPage,
  TeamPage,
  AdminAddInstructorPage,
  AdminAddLearnerPage,
  AdminGenerateCertificatePage,
  InstructorCoursesPage,
} from './pages/Courses/LmsPages.jsx'
import PersonalityShowcasePage from './pages/Courses/PersonalityShowcasePage.jsx'

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-6 text-[var(--text-primary)] shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--accent-primary)]">Profile unavailable</p>
        <h1 className="text-2xl font-semibold">We could not load the user panel</h1>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          A render error was caught before the page could open. Please refresh the page, or continue to the dashboard and try again.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-primary min-h-11 rounded-full px-5 text-sm font-semibold text-white">
            Refresh page
          </button>
          <button type="button" onClick={() => (window.location.href = '/dashboard')} className="btn-secondary min-h-11 rounded-full px-5 text-sm font-semibold">
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }
}

function UserPageRoute() {
  return (
    <RouteErrorBoundary>
      <UserPage />
    </RouteErrorBoundary>
  )
}

function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const location = useLocation()
  const initialAllowed = Boolean(auth.token && auth.user && (!allowedRoles || allowedRoles.includes(auth.role || auth.user?.role)))
  const [status, setStatus] = useState(initialAllowed ? 'verified' : auth.token ? 'checking' : 'guest')
  const rolesKey = allowedRoles?.join('|') || ''
  const loginPath = `${redirectTo}?next=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`

  useEffect(() => {
    let active = true
    async function verifySession() {
      if (!auth.token) {
        setStatus('guest')
        return
      }

      if (auth.user && (!allowedRoles || allowedRoles.includes(auth.role || auth.user.role))) {
        setStatus('verified')
        return
      }

      try {
        setStatus('checking')
        const response = await fetchMe()
        const user = response.data?.user
        const role = user?.role
        const allowed = rolesKey ? rolesKey.split('|') : null
        if (!user || (allowed && !allowed.includes(role))) {
          dispatch(logout())
          if (active) setStatus('guest')
          return
        }
        dispatch(login({ user, role, token: auth.token, rememberMe: role !== 'admin' }))
        if (active) setStatus('verified')
      } catch {
        dispatch(logout())
        if (active) setStatus('guest')
      }
    }
    void verifySession()
    return () => {
      active = false
    }
  }, [rolesKey, auth.token, auth.role, auth.user, allowedRoles, dispatch])

  if (!auth.user || !auth.token) {
    return <Navigate to={loginPath} replace />
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={loginPath} replace />
  }

  if (status !== 'verified') {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
        <div className="theme-card rounded-lg p-6">
          <div className="skeleton mx-auto h-10 w-10 rounded-full" />
          <p className="mt-4 font-semibold">Verifying secure session...</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Admin pages open only after a valid admin login.</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

function AdminLoginRedirect() {
  useEffect(() => {
    if (import.meta.env.DEV && window.location.port !== '5174') {
      window.location.assign(`${window.location.protocol}//${window.location.hostname}:5174/admin-login`)
    }
  }, [])

  if (import.meta.env.DEV && window.location.port !== '5174') {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
        <div className="theme-card rounded-lg p-6">
          <div className="skeleton mx-auto h-10 w-10 rounded-full" />
          <p className="mt-4 font-semibold">Opening admin portal...</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Admin runs on http://localhost:5174 in development.</p>
        </div>
      </div>
    )
  }

  return <Navigate to="/login" replace />
}

function AdminHostRedirect() {
  const location = useLocation()

  useEffect(() => {
    if (import.meta.env.DEV && window.location.port !== '5174') {
      window.location.assign(`${window.location.protocol}//${window.location.hostname}:5174${location.pathname}${location.search}${location.hash}`)
    }
  }, [location.hash, location.pathname, location.search])

  if (import.meta.env.DEV) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
        <div>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-4 text-sm font-semibold">Opening admin workspace...</p>
        </div>
      </div>
    )
  }

  return <Navigate to="/login" replace />
}

function AnimatedRoutes() {
  const location = useLocation()
  const isAdminHost = import.meta.env.MODE === 'admin'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (isAdminHost) {
    return (
        <Routes location={location}>
          <Route path="/" element={<Navigate to="/admin-login" replace />} />
          <Route path="/admin-login" element={<AuthPage />} />
          <Route element={<ProtectedRoute allowedRoles={['admin']} redirectTo="/admin-login" />}>
            <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
            <Route path="/admin/review" element={<AdminLayout><AdminReviewPage /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminDataPage resource="users" /></AdminLayout>} />
            <Route path="/admin/usrs" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/user" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/learners" element={<AdminLayout><AdminDataPage resource="learners" /></AdminLayout>} />
            <Route path="/admin/instructors" element={<AdminLayout><AdminDataPage resource="instructors" /></AdminLayout>} />
            <Route path="/admin/courses" element={<AdminLayout><AdminDataPage resource="courses" /></AdminLayout>} />
            <Route path="/admin/questions" element={<AdminLayout><QuestionManagementPage /></AdminLayout>} />
            <Route path="/admin/evaluations" element={<AdminLayout><AssessmentEvaluationsPage /></AdminLayout>} />
            <Route path="/admin/categories" element={<AdminLayout><AdminDataPage resource="categories" /></AdminLayout>} />
            <Route path="/admin/create-category" element={<AdminLayout><AdminCategoryFormPage /></AdminLayout>} />
            <Route path="/admin/edit-category/:categoryId" element={<AdminLayout><AdminCategoryFormPage mode="edit" /></AdminLayout>} />
            <Route path="/admin/analytics" element={<AdminLayout><AnalyticsPage /></AdminLayout>} />
            <Route path="/admin/revenue" element={<AdminLayout><AdminDataPage resource="revenue" /></AdminLayout>} />
            <Route path="/admin/certificates" element={<AdminLayout><AdminDataPage resource="certificates" /></AdminLayout>} />
            <Route path="/admin/notifications" element={<AdminLayout><AdminDataPage resource="notifications" /></AdminLayout>} />
            <Route path="/admin/enrollments" element={<AdminLayout><AdminDataPage resource="enrollments" /></AdminLayout>} />
            <Route path="/admin/instructor-changes" element={<AdminLayout><AdminDataPage resource="instructor-changes" /></AdminLayout>} />
            <Route path="/admin/activity-logs" element={<AdminLayout><AdminDataPage resource="activity-logs" /></AdminLayout>} />
            <Route path="/admin/payments" element={<AdminLayout><AdminDataPage resource="payments" /></AdminLayout>} />
            <Route path="/admin/profile" element={<AdminLayout><UserPageRoute /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />
            <Route path="/admin/reports" element={<AdminLayout><AdminReportsPage /></AdminLayout>} />
            <Route path="/admin/create-course" element={<AdminLayout><AdminCourseFormPage /></AdminLayout>} />
            <Route path="/admin/upload-course" element={<AdminLayout><AdminCourseFormPage /></AdminLayout>} />
            <Route path="/admin/edit-course/:courseId" element={<AdminLayout><AdminCourseFormPage mode="edit" /></AdminLayout>} />
            <Route path="/admin/add-learner" element={<AdminLayout><AdminAddLearnerPage /></AdminLayout>} />
            <Route path="/admin/add-instructor" element={<AdminLayout><AdminAddInstructorPage /></AdminLayout>} />
            <Route path="/admin/manage-courses" element={<AdminLayout><AdminDataPage resource="courses" /></AdminLayout>} />
            <Route path="/admin/manage-learners" element={<AdminLayout><AdminDataPage resource="learners" /></AdminLayout>} />
            <Route path="/admin/generate-certificate" element={<AdminLayout><AdminGenerateCertificatePage /></AdminLayout>} />
          </Route>
          <Route path="*" element={<Navigate to="/admin-login" replace />} />
        </Routes>
    )
  }

  return (
      <Routes location={location}>
        <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/admin-login" element={<AdminLoginRedirect />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="/otp-verification" element={<AuthPage />} />
        <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
        <Route path="/services" element={<MainLayout><FeaturesPage /></MainLayout>} />
        <Route path="/courses" element={<MainLayout><ExploreCoursesPage /></MainLayout>} />
        <Route path="/features" element={<MainLayout><FeaturesPage /></MainLayout>} />
        <Route path="/team" element={<MainLayout><TeamPage /></MainLayout>} />
        <Route path="/faq" element={<MainLayout><FaqPage /></MainLayout>} />
        <Route path="/blog" element={<MainLayout><BlogPage /></MainLayout>} />
        <Route path="/careers" element={<MainLayout><CareersPage /></MainLayout>} />
        <Route path="/help" element={<MainLayout><HelpCenterPage /></MainLayout>} />
        <Route path="/support" element={<MainLayout><SupportPage /></MainLayout>} />
        <Route path="/403" element={<MainLayout><ForbiddenPage /></MainLayout>} />
        <Route path="/explore" element={<MainLayout><ExploreCoursesPage /></MainLayout>} />
        <Route path="/categories" element={<MainLayout><CategoriesPage /></MainLayout>} />
        <Route path="/mentors" element={<MainLayout><MentorsPage /></MainLayout>} />
        <Route path="/pricing" element={<MainLayout><PricingPage /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PolicyPage type="privacy" /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><PolicyPage type="terms" /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
        <Route path="/course/:courseId" element={<MainLayout><CourseDetailPage /></MainLayout>} />
        <Route path="/community" element={<MainLayout><CommunityPage /></MainLayout>} />
        <Route path="/community/:topicId" element={<MainLayout><CommunityTopicPage /></MainLayout>} />
         <Route path="/personalities" element={<MainLayout><PersonalityShowcasePage /></MainLayout>} />

         <Route element={<ProtectedRoute allowedRoles={['learner']} />}>
          <Route path="/player/:courseId" element={<MainLayout><LearningPlayerPage /></MainLayout>} />
          <Route path="/course/:courseId/assessments" element={<MainLayout><AssessmentsPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['learner']} />}>
          <Route path="/dashboard" element={<MainLayout><StudentDashboard /></MainLayout>} />
          <Route path="/questions" element={<MainLayout><QuestionPracticePage /></MainLayout>} />
          <Route path="/user" element={<MainLayout><UserPageRoute /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><UserPageRoute /></MainLayout>} />
          <Route path="/dashboard/profile" element={<MainLayout><UserPageRoute /></MainLayout>} />
          <Route path="/dashboard/user" element={<MainLayout><UserPageRoute /></MainLayout>} />
          <Route path="/account" element={<MainLayout><UserPageRoute /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          <Route path="/notifications" element={<MainLayout><NotificationsPage /></MainLayout>} />
          <Route path="/certificates" element={<MainLayout><CertificatesPage /></MainLayout>} />
          <Route path="/learning-path" element={<MainLayout><LearningPathPage /></MainLayout>} />
          <Route path="/live-sessions" element={<MainLayout><LiveSessionsPage /></MainLayout>} />
          <Route path="/saved" element={<MainLayout><SavedCoursesPage /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><LearnerReportsPage /></MainLayout>} />
          <Route path="/payments" element={<MainLayout><PaymentHistoryPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
          <Route path="/instructor" element={<MainLayout><InstructorDashboard /></MainLayout>} />
          <Route path="/instructor/courses" element={<MainLayout><InstructorCoursesPage /></MainLayout>} />
          <Route path="/instructor/live-sessions" element={<MainLayout><LiveSessionsPage /></MainLayout>} />
          <Route path="/instructor/profile" element={<MainLayout><UserPageRoute /></MainLayout>} />
          <Route path="/instructor/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          <Route path="/instructor/notifications" element={<MainLayout><NotificationsPage /></MainLayout>} />
        </Route>

        <Route path="/admin/*" element={<AdminHostRedirect />} />

        <Route path="*" element={<MainLayout><NotFoundPage /></MainLayout>} />
      </Routes>
  )
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
}

export default App
