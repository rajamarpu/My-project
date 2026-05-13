import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Provider, useSelector } from 'react-redux'
import { ThemeProvider } from './context/ThemeContext.jsx'
import store from './redux/store.js'
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
import './index.css'

function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
  const auth = useSelector((state) => state.auth)
  if (!auth.user) {
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
        <Route path="/explore" element={<MainLayout><ExploreCoursesPage /></MainLayout>} />
        <Route path="/course/:courseId" element={<MainLayout><CourseDetailPage /></MainLayout>} />
        <Route path="/community" element={<MainLayout><CommunityPage /></MainLayout>} />
        <Route path="/certificates" element={<MainLayout><CertificatesPage /></MainLayout>} />

        <Route element={<ProtectedRoute allowedRoles={[ 'learner', 'instructor', 'admin' ]} />}>
          <Route path="/player/:courseId" element={<MainLayout><LearningPlayerPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ 'learner', 'admin' ]} />}>
          <Route path="/dashboard" element={<MainLayout><StudentDashboard /></MainLayout>} />
          <Route path="/user" element={<MainLayout><UserPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ 'instructor', 'admin' ]} />}>
          <Route path="/instructor" element={<MainLayout><InstructorDashboard /></MainLayout>} />
          <Route path="/instructor/create" element={<MainLayout><CreateCoursePage /></MainLayout>} />
          <Route path="/instructor/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ 'admin' ]} />}>
          <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          <Route path="/admin/review" element={<MainLayout><AdminReviewPage /></MainLayout>} />
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
