import { useMemo, useState } from 'react'
import { Eye, EyeOff, Github, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { login } from '../../redux/slices/authSlice.js'
import { forgotPassword, loginRequest, registerRequest, resetPassword, sendOtp, verifyOtp } from '../../services/api.js'
import { fadeInUp } from '../../animations/variants.js'

const routeByRole = {
  admin: '/admin',
  instructor: '/instructor',
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
  const isRegister = mode === 'register'
  const needsPassword = ['login', 'register', 'reset'].includes(mode)

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ type: '', message: '' })
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    role: 'learner',
  })

  const score = passwordScore(form.password)
  const title = copyByMode[mode][0]
  const subtitle = copyByMode[mode][1]

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (mode === 'forgot') return Boolean(form.email)
    if (mode === 'otp') return Boolean(form.email && form.otp)
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
        const response = form.otp ? await verifyOtp({ username: form.email, otp: form.otp, role: form.role }) : await sendOtp(form.email)
        if (response.data?.user) await authenticate(response, 'OTP verified.')
        else setToast({ type: 'success', message: 'OTP sent.' })
      } else {
        const response = isRegister ? await registerRequest(form) : await loginRequest(form)
        await authenticate(response, isRegister ? 'Account created.' : 'Login successful.')
      }
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Request failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_85%_12%,rgba(217,70,239,0.18),transparent_25%),linear-gradient(135deg,#020617,#0f172a)]" />
      <motion.div
        className="absolute left-[12%] top-[16%] h-2 w-2 rounded-full bg-cyan-200"
        animate={{ opacity: [0.2, 1, 0.2], y: [0, -18, 0] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />
      <motion.div
        className="absolute right-[18%] top-[24%] h-2 w-2 rounded-full bg-fuchsia-200"
        animate={{ opacity: [0.2, 1, 0.2], y: [0, 16, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
      />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-glow backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-white/10 bg-slate-950/40 p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/" className="text-lg font-semibold text-cyan-100">UptoSkills AI</Link>
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Virtual teacher engine</p>
            <h2 className="mt-4 text-4xl font-semibold">Secure access for learners and admins.</h2>
            <p className="mt-4 leading-7 text-slate-300">Separate roles, protected dashboards, OTP recovery, and mentor-aware onboarding are ready to connect to your Node, Prisma, PostgreSQL backend.</p>
          </div>
          <div className="grid gap-3 text-sm text-slate-300">
            {['JWT protected routes', 'AI teacher preferences', 'Admin role separation'].map((item) => (
              <span key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">{item}</span>
            ))}
          </div>
        </aside>

        <motion.section variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <Link to="/" className="mb-8 text-sm font-semibold text-cyan-200 lg:hidden">UptoSkills AI</Link>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">{mode === 'otp' ? 'OTP verification' : isRegister ? 'Create account' : mode === 'login' ? 'Secure login' : 'Account recovery'}</p>
          <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
          <p className="mt-4 text-slate-300">{subtitle}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isRegister ? (
              <Field icon={<UserRound size={18} />} label="Full name">
                <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="w-full bg-transparent outline-none" placeholder="Your full name" />
              </Field>
            ) : null}

            {mode !== 'forgot' && mode !== 'reset' ? (
              <label className="block">
                <span className="text-sm text-slate-300">Account type</span>
                <select value={form.role} onChange={(e) => update('role', e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none">
                  <option value="learner">Learner</option>
                  <option value="instructor">Instructor</option>
                  {!isRegister ? <option value="admin">Admin</option> : null}
                </select>
              </label>
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
                <span className="text-sm text-slate-300">Confirm password</span>
                <input value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} type={showPassword ? 'text' : 'password'} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 outline-none" placeholder="Repeat password" />
              </label>
            ) : null}

            {needsPassword ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-cyan-300 to-emerald-300 transition-all" style={{ width: `${score * 25}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-400">Password strength: {['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, score - 1)] || 'Weak'}</p>
              </div>
            ) : null}

            {mode === 'login' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                <label className="inline-flex items-center gap-2">
                  <input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-white/10 bg-slate-900" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-cyan-200">Forgot password?</Link>
              </div>
            ) : null}

            {toast.message ? (
              <p className={`rounded-2xl px-4 py-3 text-sm ${toast.type === 'error' ? 'bg-red-500/10 text-red-200' : 'bg-emerald-500/10 text-emerald-200'}`}>
                {toast.message}
              </p>
            ) : null}

            <Button type="submit" disabled={!canSubmit} className="w-full">{loading ? 'Please wait...' : buttonLabel(mode)}</Button>
          </form>

          {mode === 'login' || isRegister ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.09]">
                <Github size={17} /> Continue with GitHub
              </button>
              <button type="button" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold transition hover:bg-white/[0.09]">
                G Continue with Google
              </button>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
            {mode !== 'login' ? <Link className="font-semibold text-cyan-200" to="/login">Back to login</Link> : null}
            {mode === 'login' ? <Link className="font-semibold text-cyan-200" to="/register">Create account</Link> : null}
            {mode === 'login' ? <Link className="font-semibold text-cyan-200" to="/otp-verification">Use OTP</Link> : null}
          </div>
        </motion.section>
      </div>
    </main>
  )
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
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
  if (mode === 'otp') return 'Verify OTP'
  return 'Login'
}
