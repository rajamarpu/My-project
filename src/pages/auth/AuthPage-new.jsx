import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginUser, registerUser, forgotPassword, verifyOTP, resetPassword, googleLogin, clearError, clearSuccess } from '../../redux/slices/authSlice.js'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { fadeInUp, staggerContainer, staggerItem } from '../../animations/variants.js'

const roles = [
  { key: 'learner', label: 'General User', email: 'student@example.com', color: 'from-cyan-400 to-sky-500' },
  { key: 'instructor', label: 'Instructor', email: 'instructor@example.com', color: 'from-violet-500 to-fuchsia-500' },
  { key: 'admin', label: 'Admin', email: 'admin@example.com', color: 'from-amber-400 to-orange-500' },
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
    rememberMe: true,
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading, error, success, token, resetToken } = useSelector((state) => state.auth)

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setPage('register')
    }
  }, [searchParams])

  // Auto-redirect on successful login
  useEffect(() => {
    if (user && token) {
      const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/dashboard'
      navigate(redirectPath)
    }
  }, [user, token, navigate])

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
      role,
      rememberMe: formData.rememberMe,
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
      rememberMe: true,
    }))
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    const result = await dispatch(forgotPassword(formData.email))
    if (!result.error) {
      setPage('verifyOTP')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const result = await dispatch(verifyOTP({
      email: formData.email,
      otp: formData.otp,
    }))
    if (!result.error) {
      setPage('resetPassword')
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const result = await dispatch(resetPassword({
      resetToken,
      newPassword: formData.password,
    }))
    if (!result.error) {
      setPage('login')
      setFormData({ ...formData, password: '', otp: '' })
    }
  }

  const handleGoogleLogin = async () => {
    // For demo purposes, simulate Google login with demo data
    // In production, integrate with Google OAuth library
    const demoGoogleData = {
      email: 'googleuser@example.com',
      fullName: 'Google User',
      avatar: 'https://via.placeholder.com/150',
      role: 'learner'
    }
    dispatch(googleLogin(demoGoogleData))
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-12 rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-glow sm:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <motion.section key={page} variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6 rounded-[2rem] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900/90 p-8 shadow-soft">
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
                  onClick={() => {
                    setRole(item.key)
                    if (page === 'login') {
                      setFormData((prev) => ({ ...prev, email: item.email, password: 'password123' }))
                    }
                  }}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    role === item.key
                      ? `border-transparent bg-gradient-to-r ${item.color} text-slate-950 shadow-glow`
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40'
                  }`}
                >
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{item.label}</p>
                  <p className="mt-2 text-xs text-slate-200">
                    {item.key === 'learner' && 'Create account, enroll, learn'}
                    {item.key === 'instructor' && 'Create and teach courses'}
                    {item.key === 'admin' && 'Manage the platform'}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Auth Forms */}
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <form onSubmit={page === 'login' ? handleLogin : page === 'register' ? handleRegister : page === 'forgotPassword' ? handleForgotPassword : page === 'verifyOTP' ? handleVerifyOTP : handleResetPassword} className="space-y-4">
              {/* Login Form */}
              {page === 'login' && (
                <>
                  <motion.div variants={staggerItem}>
                    <label className="block text-sm text-slate-300">Email address</label>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email"
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </motion.div>
                  <motion.div variants={staggerItem}>
                    <label className="block text-sm text-slate-300">Password</label>
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      type="password"
                      placeholder="Enter your password"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                    />
                  </motion.div>
                  <motion.div variants={staggerItem} className="flex items-center justify-between gap-4 text-sm text-slate-400">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(event) => setFormData((prev) => ({ ...prev, rememberMe: event.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400"
                      />
                      Remember me
                    </label>
                    <button type="button" onClick={() => setPage('forgotPassword')} className="text-cyan-300 hover:text-cyan-100">
                      Forgot password?
                    </button>
                  </motion.div>
                  <motion.div variants={staggerItem}>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Logging in...' : `Login as ${roles.find((item) => item.key === role)?.label}`}
                    </Button>
                  </motion.div>
                  
                  {/* Google Login Button */}
                  <motion.div variants={staggerItem} className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-slate-950 px-2 text-slate-400">Or continue with</span>
                    </div>
                  </motion.div>
                  <motion.div variants={staggerItem}>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </motion.div>
                  
                  <motion.div variants={staggerItem} className="grid gap-2 rounded-3xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-400 sm:grid-cols-3">
                    {roles.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setRole(item.key)
                          setFormData((prev) => ({ ...prev, email: item.email, password: 'password123' }))
                        }}
                        className="rounded-2xl bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                      >
                        <span className="block font-semibold text-white">{item.label}</span>
                        {item.email}
                      </button>
                    ))}
                  </motion.div>
                  <motion.div variants={staggerItem} className="text-center text-sm text-slate-400">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setPage('register')} className="text-cyan-300 hover:text-cyan-100">
                      Register here
                    </button>
                  </motion.div>
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
          </motion.div>
        </motion.section>

        <motion.aside variants={fadeInUp} initial="hidden" animate="visible" className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-soft">
          <div className="mb-8 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Security & Privacy</p>
            <h2 className="text-3xl font-semibold text-white">An immersive experience for every role</h2>
            <p className="text-slate-400">Secure authentication with OTP verification, role-based access, and premium features.</p>
          </div>
          <div className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Security</p>
              <p className="text-xs text-slate-300">JWT tokens, OTP verification, and encrypted passwords keep your account secure.</p>
            </div>
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Role-Based</p>
              <p className="text-xs text-slate-300">Learner, Instructor, or Admin roles with customized dashboards and features.</p>
            </div>
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Fast</p>
              <p className="text-xs text-slate-300">Lightning-fast API responses and optimized authentication flow.</p>
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  )
}
