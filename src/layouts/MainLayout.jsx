import { useLocation } from 'react-router-dom'
import Navbar from '../components/ui/Navbar/Navbar.jsx'
import Footer from '../components/ui/Navbar/Footer.jsx'
import { Breadcrumbs, RouteProgress } from '../components/common/RouteFeedback/RouteFeedback.jsx'

export default function MainLayout({ children }) {
  const location = useLocation()
  const isCoursesShell = location.pathname === '/explore' || location.pathname === '/courses'

  return (
    <div className="app-shell min-h-screen overflow-x-hidden text-[var(--text-primary)] transition-colors duration-150">
      <RouteProgress />
      <Navbar />
      <main
        className={
          isCoursesShell
            ? 'mx-auto flex h-[calc(100vh-72px)] w-full max-w-full flex-col overflow-hidden'
            : 'mx-auto flex w-full max-w-full flex-col px-[clamp(16px,4vw,64px)] pb-24 pt-6 sm:pt-8'
        }
      >
        {isCoursesShell ? null : <Breadcrumbs />}
        {children}
      </main>
      {isCoursesShell ? null : <Footer />}
    </div>
  )
}

