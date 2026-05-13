import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser, forgotPassword, verifyOTP, resetPassword, clearError, clearSuccess } from '../../redux/slices/authSlice.js'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { fadeInUp } from '../../animations/variants.js'

const roles = [
  { key: 'learner', label: 'Learner', color: 'from-cyan-400 to-sky-500' },
  { key: 'instructor', label: 'Instructor', color: 'from-violet-500 to-fuchsia-500' },
  { key: 'admin', label: 'Admin', color: 'from-amber-400 to-orange-500' },
]

export default function AuthPage() {
  const [role, setRole] = useState('learner')
  const [page, setPage] = useState('login') // login, register, forgotPassword, verifyOTP, resetPassword
  const [formData, setFormData] = useState({
    email: 'student@example.com',
    password: 'password123',
    username: '',
    fullName: '',
    otp: '',
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading, error, success, token, resetToken } = useSelector((state) => state.auth)

  // Auto-redirect on successful login
  useEffect(() => {
    if (user && token) {
      const redirectPath = role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/dashboard'
      navigate(redirectPath)
    }
  }, [user, token, navigate, role])

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        dispatch(clearError())
        dispatch(clearSuccess())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success, dispatch])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    dispatch(loginUser({
      email: formData.email,
      password: formData.password,
    }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    dispatch(registerUser({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      fullName: formData.fullName,
      role,
    }))
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    dispatch(forgotPassword(formData.email))
    if (success) {
      setPage('verifyOTP')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    dispatch(verifyOTP({
      email: formData.email,
      otp: formData.otp,
    }))
    if (success) {
      setPage('resetPassword')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    dispatch(resetPassword({
      resetToken,
      newPassword: formData.password,
    }))
    if (success) {
      setPage('login')
      setFormData({ ...formData, password: '', otp: '' })
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-12 rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-glow sm:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <motion.section variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6 rounded-[2rem] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900/90 p-8 shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">
              {page === 'login' && 'Secure sign in'}
              {page === 'register' && 'Create your account'}
              {page === 'forgotPassword' && 'Recover password'}
              {page === 'verifyOTP' && 'Verify OTP'}
              {page === 'resetPassword' && 'Reset password'}
            </p>
            <h1 className="text-4xl font-semibold text-white">
              {page === 'login' && 'Welcome back to Celebrity Academy'}
              {page === 'register' && 'Join Celebrity Academy'}
              {page === 'forgotPassword' && 'Forgot Password?'}
              {page === 'verifyOTP' && 'Verify Your OTP'}
              {page === 'resetPassword' && 'Set New Password'}
            </h1>
            <p className="text-slate-400">
              {page === 'login' && 'Login with your role to continue your premium journey.'}
              {page === 'register' && 'Create an account to start learning from celebrity mentors.'}
              {page === 'forgotPassword' && 'Enter your email to receive an OTP code.'}
              {page === 'verifyOTP' && 'Enter the 6-digit code sent to your email.'}
              {page === 'resetPassword' && 'Create a strong password for your account.'}
            </p>
          </div>

          {/* Notifications */}
          {error && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              <p className="text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-green-300">
              <p className="text-sm">✓ Operation successful!</p>
            </div>
          )}

          {/* Role Selection */}
          {(page === 'login' || page === 'register') && (
            <div className="grid gap-3 sm:grid-cols-3">
              {roles.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRole(item.key)}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    role === item.key
                      ? `border-transparent bg-gradient-to-r ${item.color} text-slate-950 shadow-glow`
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40'
                  }`}
                >
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{item.label}</p>
                  <p className="mt-2 text-xs text-slate-200">
                    {item.key === 'learner' && 'Explore courses and learn'}
                    {item.key === 'instructor' && 'Create and teach courses'}
                    {item.key === 'admin' && 'Manage the platform'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Auth Forms */}
          <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <form onSubmit={page === 'login' ? handleLogin : page === 'register' ? handleRegister : page === 'forgotPassword' ? handleForgotPassword : page === 'verifyOTP' ? handleVerifyOTP : handleResetPassword} className="space-y-4">
              {/* Login Form */}
              {page === 'login' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300">Email address</label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email"
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Password</label>
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      type="password"
                      placeholder="Enter your password"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400" />
                      Remember me
                    </label>
                    <button type="button" onClick={() => setPage('forgotPassword')} className="text-cyan-300 hover:text-cyan-100">
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                  <p className="text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setPage('register')} className="text-cyan-300 hover:text-cyan-100">
                      Register here
                    </button>
                  </p>
                </>
              )}

              {/* Register Form */}
              {page === 'register' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300">Full Name</label>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="Your full name"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Username</label>
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="Choose a username"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Email address</label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email"
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Password</label>
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      type="password"
                      placeholder="Create a strong password"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Register'}
                  </Button>
                  <p className="text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setPage('login')} className="text-cyan-300 hover:text-cyan-100">
                      Login here
                    </button>
                  </p>
                </>
              )}

              {/* Forgot Password */}
              {page === 'forgotPassword' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300">Email address</label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email"
                      placeholder="Enter your registered email"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                  <button type="button" onClick={() => setPage('login')} className="w-full text-sm text-cyan-300 hover:text-cyan-100">
                    Back to login
                  </button>
                </>
              )}

              {/* Verify OTP */}
              {page === 'verifyOTP' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300">6-digit OTP</label>
                    <input
                      name="otp"
                      value={formData.otp}
                      onChange={handleInputChange}
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-center text-3xl tracking-widest text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <button type="button" onClick={() => setPage('forgotPassword')} className="w-full text-sm text-cyan-300 hover:text-cyan-100">
                    Resend OTP
                  </button>
                </>
              )}

              {/* Reset Password */}
              {page === 'resetPassword' && (
                <>
                  <div>
                    <label className="block text-sm text-slate-300">New Password</label>
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      type="password"
                      placeholder="Create a strong password"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </>
              )}
            </form>
          </div>
        </motion.section>

        <motion.aside variants={fadeInUp} initial="hidden" animate="visible" className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-soft">
          <div className="mb-8 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Security & Privacy</p>
            <h2 className="text-3xl font-semibold text-white">An immersive experience for every role</h2>
            <p className="text-slate-400">Secure authentication with OTP verification, role-based access, and premium features.</p>
          </div>
          <div className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">🔐 Security</p>
              <p className="text-xs text-slate-300">JWT tokens, OTP verification, and encrypted passwords keep your account secure.</p>
            </div>
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">👥 Role-Based</p>
              <p className="text-xs text-slate-300">Learner, Instructor, or Admin roles with customized dashboards and features.</p>
            </div>
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">⚡ Fast</p>
              <p className="text-xs text-slate-300">Lightning-fast API responses and optimized authentication flow.</p>
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  )
}
