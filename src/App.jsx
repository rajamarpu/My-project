import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Provider, useSelector } from 'react-redux'
import store from './redux/store.js'
import ThemeProvider from './ThemeProvider.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import LandingPage from './pages/landing/LandingPage.jsx'
import AuthPage from './pages/auth/AuthPage.jsx'
import ExploreCoursesPage from './pages/explore/ExploreCoursesPage.jsx'
import CourseDetailPage from './pages/course/CourseDetailPage.jsx'
import StudentDashboard from './pages/dashboard/StudentDashboard.jsx'
import InstructorDashboard from './pages/dashboard/InstructorDashboard.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import UserPage from './pages/user/UserPage.jsx'
import LearningPlayerPage from './pages/player/LearningPlayerPage.jsx'
import CommunityPage from './pages/community/CommunityPage.jsx'
import CertificatesPage from './pages/certificates/CertificatesPage.jsx'
import CreateCoursePage from './pages/instructor/CreateCoursePage.jsx'
import AnalyticsPage from './pages/instructor/AnalyticsPage.jsx'
import AdminReviewPage from './pages/admin/AdminReviewPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AssessmentsPage from './pages/assessments/AssessmentsPage.jsx'
import {
  AdminReportsPage,
  AdminSettingsPage,
  AdminUsersPage,
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
  InstructorCoursesPage,
  LearnerReportsPage,
  LearningPathPage,
  LiveSessionsPage,
  MentorsPage,
  NotificationsPage,
  PolicyPage,
  PricingPage,
  SavedCoursesPage,
  ServicesPage,
  SettingsPage,
  StudentFeedbackPage,
  SupportPage,
  TeamPage,
  AdminCreateCoursePage,
  AdminAddLearnerPage,
  AdminManageCoursesPage,
  AdminManageLearnersPage,
  AdminGenerateCertificatePage,
} from './pages/lms/LmsPages.jsx'
import PersonalityShowcasePage from './pages/personality/PersonalityShowcasePage.jsx'
import './index.css'

function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
  const auth = useSelector((state) => state.auth)
  if (!auth.user || !auth.token) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainLayout><LandingPage /></MainLayout>} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/forgot-password" element={<AuthPage />} />
        <Route path="/reset-password" element={<AuthPage />} />
        <Route path="/otp-verification" element={<AuthPage />} />
        <Route path="/about" element={<MainLayout><AboutPage /></MainLayout>} />
        <Route path="/services" element={<MainLayout><ServicesPage /></MainLayout>} />
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
<Route path="/certificates" element={<MainLayout><CertificatesPage /></MainLayout>} />
         <Route path="/personalities" element={<MainLayout><PersonalityShowcasePage /></MainLayout>} />

         <Route element={<ProtectedRoute allowedRoles={['learner', 'instructor', 'admin']} />}>
          <Route path="/player/:courseId" element={<MainLayout><LearningPlayerPage /></MainLayout>} />
          <Route path="/course/:courseId/assessments" element={<MainLayout><AssessmentsPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['learner', 'admin']} />}>
          <Route path="/dashboard" element={<MainLayout><StudentDashboard /></MainLayout>} />
          <Route path="/user" element={<MainLayout><UserPage /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><UserPage /></MainLayout>} />
          <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
          <Route path="/notifications" element={<MainLayout><NotificationsPage /></MainLayout>} />
          <Route path="/learning-path" element={<MainLayout><LearningPathPage /></MainLayout>} />
          <Route path="/live-sessions" element={<MainLayout><LiveSessionsPage /></MainLayout>} />
          <Route path="/saved" element={<MainLayout><SavedCoursesPage /></MainLayout>} />
          <Route path="/reports" element={<MainLayout><LearnerReportsPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['instructor', 'admin']} />}>
          <Route path="/instructor" element={<MainLayout><InstructorDashboard /></MainLayout>} />
          <Route path="/instructor/courses" element={<MainLayout><InstructorCoursesPage /></MainLayout>} />
          <Route path="/instructor/create" element={<MainLayout><CreateCoursePage /></MainLayout>} />
          <Route path="/instructor/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />
          <Route path="/instructor/feedback" element={<MainLayout><StudentFeedbackPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
           <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
           <Route path="/admin/review" element={<MainLayout><AdminReviewPage /></MainLayout>} />
           <Route path="/admin/users" element={<MainLayout><AdminUsersPage /></MainLayout>} />
           <Route path="/admin/settings" element={<MainLayout><AdminSettingsPage /></MainLayout>} />
           <Route path="/admin/reports" element={<MainLayout><AdminReportsPage /></MainLayout>} />
           <Route path="/admin/create-course" element={<MainLayout><AdminCreateCoursePage /></MainLayout>} />
           <Route path="/admin/add-learner" element={<MainLayout><AdminAddLearnerPage /></MainLayout>} />
           <Route path="/admin/manage-courses" element={<MainLayout><AdminManageCoursesPage /></MainLayout>} />
           <Route path="/admin/manage-learners" element={<MainLayout><AdminManageLearnersPage /></MainLayout>} />
           <Route path="/admin/generate-certificate" element={<MainLayout><AdminGenerateCertificatePage /></MainLayout>} />
         </Route>

        <Route path="*" element={<MainLayout><NotFoundPage /></MainLayout>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
}

export default App
