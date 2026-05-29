import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMe } from '../api/api.js'
import { login, logout } from '../store/slices/authSlice.js'

export default function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
  const auth = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [status, setStatus] = useState(auth.token ? 'checking' : 'guest')
  const rolesKey = allowedRoles?.join('|') || ''

  useEffect(() => {
    let active = true

    async function verifySession() {
      if (!auth.token) {
        setStatus('guest')
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
  }, [auth.token, dispatch, rolesKey])

  if (!auth.user || !auth.token) {
    return <Navigate to={redirectTo} replace />
  }

  if (allowedRoles && !allowedRoles.includes(auth.role)) {
    return <Navigate to={redirectTo} replace />
  }

  if (status !== 'verified') {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--bg-primary)] px-6 text-center text-[var(--text-primary)]">
        <div className="theme-card rounded-lg p-6">
          <div className="skeleton mx-auto h-10 w-10 rounded-full" />
          <p className="mt-4 font-semibold">Verifying secure session...</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Protected pages open only after a valid login.</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}
