import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Provider, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext.jsx'
import store from './redux/store.js'
import { loadCurrentUser } from './redux/slices/authSlice.js'
import MainLayout from './layouts/MainLayout.jsx'
import LandingPage from './pages/landing/LandingPage.jsx'
import AuthPage from './pages/auth/AuthPage-new.jsx'
import ExploreCoursesPage from './pages/explore/ExploreCoursesPage.jsx'
import ExploreSubPage from './pages/explore/ExploreSubPage.jsx'
import CoursePreviewPage from './pages/course/CoursePreviewPage.jsx'
import CourseDetailPage from './pages/course/CourseDetailPage.jsx'
import StudentDashboard from './pages/dashboard/StudentDashboard.jsx'
import LearnerSubPage from './pages/dashboard/LearnerSubPage.jsx'
import InstructorDashboard from './pages/dashboard/InstructorDashboard.jsx'
import InstructorSubPage from './pages/instructor/InstructorSubPage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminSubPage from './pages/admin/AdminSubPage.jsx'
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
  if (auth.initializing) {
    return (
      <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
        <div className="mx-auto mt-24 max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-glow">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Celebrity Academy</p>
          <p className="mt-4 text-lg font-semibold text-white">Restoring your session...</p>
        </div>
      </div>
    )
  }

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
        <Route path="/explore/:section" element={<MainLayout><ExploreSubPage /></MainLayout>} />
        <Route path="/course/:courseId/preview" element={<MainLayout><CoursePreviewPage /></MainLayout>} />
        <Route path="/community" element={<MainLayout><CommunityPage /></MainLayout>} />
        <Route path="/certificates" element={<MainLayout><CertificatesPage /></MainLayout>} />

        <Route element={<ProtectedRoute allowedRoles={[ 'learner', 'instructor', 'admin' ]} />}>
          <Route path="/course/:courseId" element={<MainLayout><CourseDetailPage /></MainLayout>} />
          <Route path="/player/:courseId" element={<MainLayout><LearningPlayerPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ 'learner', 'admin' ]} />}>
          <Route path="/dashboard" element={<MainLayout><StudentDashboard /></MainLayout>} />
          <Route path="/dashboard/:section" element={<MainLayout><LearnerSubPage /></MainLayout>} />
          <Route path="/user" element={<MainLayout><UserPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ 'instructor', 'admin' ]} />}>
          <Route path="/instructor" element={<MainLayout><InstructorDashboard /></MainLayout>} />
          <Route path="/instructor/:section" element={<MainLayout><InstructorSubPage /></MainLayout>} />
          <Route path="/instructor/create" element={<MainLayout><CreateCoursePage /></MainLayout>} />
          <Route path="/instructor/analytics" element={<MainLayout><AnalyticsPage /></MainLayout>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={[ 'admin' ]} />}>
          <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          <Route path="/admin/:section" element={<MainLayout><AdminSubPage /></MainLayout>} />
          <Route path="/admin/review" element={<MainLayout><AdminReviewPage /></MainLayout>} />
        </Route>

        <Route path="*" element={<MainLayout><NotFoundPage /></MainLayout>} />
      </Routes>
    </AnimatePresence>
  )
}

function SessionBootstrap() {
  useEffect(() => {
    if (localStorage.getItem('authToken')) {
      store.dispatch(loadCurrentUser())
    }
  }, [])

  return <AnimatedRoutes />
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <SessionBootstrap />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  )
}

export default App
