import { useMemo, useState } from 'react'
import { Eye, EyeOff, Github, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { login } from '../../redux/slices/authSlice.js'
import { forgotPassword, loginRequest, registerRequest, resetPassword, sendOtp, socialLoginUrl, verifyOtp } from '../../services/api.js'
import { fadeInUp } from '../../animations/variants.js'

const routeByRole = {
  admin: '/admin',
  learner: '/dashboard',
}

const copyByMode = {
  login: ['Welcome back', 'Continue learning with your selected AI teacher and saved progress.'],
  register: ['Create your learner profile', 'Choose your first mentor personality after sign up.'],
  forgot: ['Recover your account', 'We will send a verification code to reset your password.'],
  reset: ['Set a new password', 'Use the OTP from your email and choose a stronger password.'],
  otp: ['Verify with OTP', 'Use one-time verification for quick secure access.'],
}

function passwordScore(password) {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
}

function modeFromPath(pathname) {
  if (pathname.includes('register')) return 'register'
  if (pathname.includes('forgot')) return 'forgot'
  if (pathname.includes('reset')) return 'reset'
  if (pathname.includes('otp')) return 'otp'
  return 'login'
}

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const mode = modeFromPath(location.pathname)
  const isAdminPortal = location.pathname.includes('admin-login')
  const isRegister = mode === 'register'
  const needsPassword = ['login', 'register', 'reset'].includes(mode)

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(() => {
    const params = new URLSearchParams(location.search)
    const error = params.get('error')
    return error ? { type: 'error', message: error } : { type: '', message: '' }
  })
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    role: isAdminPortal ? 'admin' : 'learner',
  })

  const score = passwordScore(form.password)
  const title = isAdminPortal ? 'Admin control login' : copyByMode[mode][0]
  const subtitle = isAdminPortal
    ? 'Use your administrator account to manage learners, courses, AI teachers, reports, and approvals.'
    : copyByMode[mode][1]

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (mode === 'forgot') return Boolean(form.email)
    if (mode === 'otp') return Boolean(form.email)
    if (mode === 'reset') return Boolean(form.email && form.otp && form.password && score >= 2)
    if (!form.email || !form.password) return false
    if (!isRegister) return true
    return Boolean(form.fullName && form.phone && form.confirmPassword && score >= 2)
  }, [form, isRegister, loading, mode, score])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const authenticate = async (response, fallbackMessage) => {
    const user = response.data.user
    const role = user.role
    dispatch(login({ user, role, token: response.data.token, rememberMe }))
    setToast({ type: 'success', message: fallbackMessage })
    navigate(routeByRole[role] || '/dashboard')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setToast({ type: '', message: '' })

    if ((isRegister || mode === 'reset') && form.password !== form.confirmPassword && isRegister) {
      setToast({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      if (mode === 'forgot') {
        await forgotPassword(form.email)
        setToast({ type: 'success', message: 'Reset code sent. Check your email.' })
        navigate('/reset-password')
      } else if (mode === 'reset') {
        await resetPassword({ email: form.email, otp: form.otp, newPassword: form.password })
        setToast({ type: 'success', message: 'Password updated. You can log in now.' })
        navigate('/login')
      } else if (mode === 'otp') {
        const response = form.otp
          ? await verifyOtp({ username: form.email, otp: form.otp, role: isAdminPortal ? 'admin' : 'learner' })
          : await sendOtp(form.email)
        if (response.data?.user) await authenticate(response, 'OTP verified.')
        else setToast({ type: 'success', message: 'OTP sent.' })
      } else {
        const payload = { ...form, role: isAdminPortal ? 'admin' : 'learner' }
        const response = isRegister ? await registerRequest(payload) : await loginRequest(payload)
        await authenticate(response, isRegister ? 'Account created.' : 'Login successful.')
      }
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Request failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    setToast({ type: '', message: '' })
    setLoading(true)
    window.location.assign(socialLoginUrl(provider, 'learner'))
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] px-5 py-8 text-[var(--text-primary)] sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(20,184,166,0.12),transparent_25%)]" />
      <motion.div
        className="absolute left-[12%] top-[16%] h-2 w-2 rounded-full bg-cyan-200"
        animate={{ opacity: [0.2, 1, 0.2], y: [0, -18, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      <motion.div
        className="absolute right-[18%] top-[24%] h-2 w-2 rounded-full bg-teal-200"
        animate={{ opacity: [0.2, 1, 0.2], y: [0, 16, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-glow backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="theme-dark hidden border-r border-white/10 bg-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="text-lg font-semibold text-cyan-100">UptoSkills</Link>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">{isAdminPortal ? 'Admin portal' : 'Learner portal'}</p>
            <h2 className="mt-4 text-4xl font-semibold">{isAdminPortal ? 'Data-focused control room for UptoSkills.' : 'Secure learning access for UptoSkills learners.'}</h2>
            <p className="mt-4 leading-7 text-slate-300">
              {isAdminPortal
                ? 'Use the dedicated admin host to manage learners, courses, reports, and platform activity.'
                : 'Create an account, choose any celebrity AI teacher, and continue your technical learning path.'}
            </p>
          </div>
        </aside>

        <motion.section variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col justify-center p-6 text-[var(--text-primary)] sm:p-10 lg:p-12">
          <Link to="/" className="mb-8 text-sm font-semibold text-cyan-600 dark:text-cyan-200 lg:hidden">UptoSkills</Link>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-300">{mode === 'otp' ? 'OTP verification' : isRegister ? 'Create account' : mode === 'login' ? 'Secure login' : 'Account recovery'}</p>
          <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">{title}</h1>
          <p className="mt-4 text-[var(--text-secondary)]">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isRegister ? (
              <Field icon={<UserRound size={18} />} label="Full name">
                <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="w-full bg-transparent outline-none" placeholder="Your full name" />
              </Field>
            ) : null}

            <Field icon={<Mail size={18} />} label="Email">
              <input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" className="w-full bg-transparent outline-none" placeholder="you@example.com" />
            </Field>

            {isRegister ? (
              <Field icon={<Phone size={18} />} label="Phone number">
                <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full bg-transparent outline-none" placeholder="9999999999" />
              </Field>
            ) : null}

            {mode === 'otp' || mode === 'reset' ? (
              <Field icon={<ShieldCheck size={18} />} label="Verification code">
                <input value={form.otp} onChange={(e) => update('otp', e.target.value)} className="w-full bg-transparent tracking-[0.24em] outline-none" placeholder="000000" />
              </Field>
            ) : null}

            {needsPassword ? (
              <Field icon={<LockKeyhole size={18} />} label={mode === 'reset' ? 'New password' : 'Password'}>
                <input value={form.password} onChange={(e) => update('password', e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full bg-transparent outline-none" placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>
            ) : null}

            {isRegister ? (
              <label className="block">
                <span className="text-sm text-[var(--text-secondary)]">Confirm password</span>
                <input value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} type={showPassword ? 'text' : 'password'} className="mt-2 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Repeat password" />
              </label>
            ) : null}

            {needsPassword ? (
              <div className="rounded-2xl border border-[var(--border-color)] bg-black/[0.03] p-4 dark:bg-white/[0.04]">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] transition-all" style={{ width: `${score * 25}%` }} />
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">Password strength: {['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, score - 1)] || 'Weak'}</p>
              </div>
            ) : null}

            {mode === 'login' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
                <label className="inline-flex items-center gap-2">
                  <input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-secondary)]" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-cyan-600 dark:text-cyan-300">Forgot password?</Link>
              </div>
            ) : null}

            {toast.message ? (
              <p className={`rounded-2xl px-4 py-3 text-sm ${toast.type === 'error' ? 'bg-red-500/10 text-red-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
                {toast.message}
              </p>
            ) : null}

            <Button type="submit" disabled={!canSubmit} className="w-full">{loading ? 'Please wait...' : buttonLabel(mode)}</Button>
          </form>

          {!isAdminPortal && (mode === 'login' || isRegister) ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => handleSocialLogin('github')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-400/50 disabled:opacity-60">
                <Github size={17} /> Continue with GitHub
              </button>
              <button type="button" onClick={() => handleSocialLogin('google')} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-400/50 disabled:opacity-60">
                G Continue with Google
              </button>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
            {mode !== 'login' ? <Link className="font-semibold text-cyan-600 dark:text-cyan-300" to="/login">Back to learner login</Link> : null}
            {!isAdminPortal && mode === 'login' ? <Link className="font-semibold text-cyan-600 dark:text-cyan-300" to="/register">Create learner account</Link> : null}
            {!isAdminPortal && mode === 'login' ? <Link className="font-semibold text-cyan-600 dark:text-cyan-300" to="/otp-verification">Use OTP</Link> : null}
          </div>
        </motion.section>
      </div>
    </main>
  )
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)]">
        {icon}
        {children}
      </span>
    </label>
  )
}

function buttonLabel(mode) {
  if (mode === 'register') return 'Create Account'
  if (mode === 'forgot') return 'Send Reset Code'
  if (mode === 'reset') return 'Reset Password'
  if (mode === 'otp') return 'Send or Verify OTP'
  return 'Login'
}
