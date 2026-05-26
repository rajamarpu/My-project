import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login } from '../../store/slices/authSlice.js'

function decodeUser(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  const bytes = Uint8Array.from(window.atob(padded), (char) => char.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [message, setMessage] = useState('Completing secure login...')

  useEffect(() => {
    try {
      const token = searchParams.get('token')
      const encodedUser = searchParams.get('user')
      const role = searchParams.get('role') || 'learner'
      if (!token || !encodedUser) throw new Error('Login callback is missing session data.')
      const user = decodeUser(encodedUser)
      dispatch(login({ user, role, token }))
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true })
    } catch (error) {
      window.setTimeout(() => {
        setMessage(error.message || 'Login failed. Please try again.')
      }, 0)
    }
  }, [dispatch, navigate, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-6 text-[var(--text-primary)]">
      <section className="glass-card max-w-md p-8 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-500">OAuth login</p>
        <h1 className="mt-3 text-2xl font-semibold">UptoSkills</h1>
        <p className="mt-4 text-[var(--text-secondary)]">{message}</p>
        {message.includes('failed') || message.includes('missing') ? (
          <Link to="/login" className="btn-primary mt-6">
            Back to login
          </Link>
        ) : null}
      </section>
    </main>
  )
}
