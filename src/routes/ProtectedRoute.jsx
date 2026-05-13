import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export default function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
  const auth = useSelector((state) => state.auth)

  if (!auth.user) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
