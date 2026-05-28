import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, Github, LockKeyhole, Mail, Phone, Rocket, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import AuthShell from '../../components/ui/Auth/AuthShell.jsx'
import AuthField from '../../components/ui/Auth/AuthField.jsx'
import PasswordStrength from '../../components/ui/Auth/PasswordStrength.jsx'
import SocialButton from '../../components/ui/Auth/SocialButton.jsx'
import { login } from '../../store/slices/authSlice.js'
import { forgotPassword, loginRequest, registerRequest, resetPassword, sendOtp, socialLoginUrl, verifyOtp } from '../../api/api.js'
import { adminLoginHint } from '../../constants/auth.js'
import { validationRules } from '../../constants/validation.js'

const routeByRole = {
  admin: '/admin',
  learner: '/dashboard',
}

const copyByMode = {
  login: ['Secure login', 'Welcome back to your UptoSkills campus', 'Continue earning XP, finishing quests, and learning with adaptive AI mentors.'],
  register: ['Create account', 'Create your learner profile', 'Start your gamified AI learning journey with guided courses, badges, and mentor-led practice.'],
  forgot: ['Account recovery', 'Recover your account', 'We will send a secure verification code to reset your password.'],
  reset: ['Reset password', 'Set a new password', 'Use the verification code from your email and choose a stronger password.'],
  otp: ['OTP verification', 'Verify with OTP', 'Use one-time verification for quick and secure access.'],
}

function passwordScore(password) {
  return [
    password.length >= validationRules.passwordMinLength,
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
  const auth = useSelector((state) => state.auth)
  const mode = modeFromPath(location.pathname)
  const isAdminPortal = location.pathname.includes('admin-login')
  const isRegister = mode === 'register'
  const needsPassword = ['login', 'register', 'reset'].includes(mode)

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)
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
  const [eyebrow, title, subtitle] = copyByMode[mode]
  const socialAction = isRegister ? 'Register' : 'Login'

  useEffect(() => {
    if (!auth.user || !auth.token) return
    navigate(routeByRole[auth.role] || '/dashboard', { replace: true })
  }, [auth.role, auth.token, auth.user, navigate])

  const errors = useMemo(() => {
    const next = {}
    const loginId = form.email.trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)
    if (!loginId) next.email = 'Email is required.'
    else if (!isEmail) next.email = 'Enter a valid email address.'

    if (isRegister) {
      if (!form.fullName.trim()) next.fullName = 'Full name is required.'
      if (!validationRules.phonePattern.test(form.phone.trim())) next.phone = 'Enter a valid 10 digit phone number.'
      if (!form.confirmPassword) next.confirmPassword = 'Confirm your password.'
      else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match.'
    }

    if (mode === 'reset' && !form.otp.trim()) next.otp = 'Verification code is required.'
    if (mode === 'otp' && form.otp && !validationRules.otpPattern.test(form.otp.trim())) next.otp = 'Enter a valid OTP.'

    if (needsPassword) {
      if (!form.password) next.password = 'Password is required.'
      else if (form.password.length < validationRules.passwordMinLength) next.password = `Use at least ${validationRules.passwordMinLength} characters.`
      else if ((isRegister || mode === 'reset') && score < 2) next.password = 'Use a stronger password.'
    }

    return next
  }, [form, isRegister, mode, needsPassword, score])

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (mode === 'forgot') return Boolean(form.email.trim())
    if (mode === 'otp') return Boolean(form.email.trim())
    return Object.keys(errors).length === 0
  }, [errors, form.email, loading, mode])

  const fieldError = (key) => (attempted ? errors[key] : '')
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
    setAttempted(true)
    setToast({ type: '', message: '' })

    if (Object.keys(errors).length && mode !== 'forgot' && mode !== 'otp') return
    if (mode === 'forgot' && errors.email) return
    if (mode === 'otp' && (errors.email || errors.otp)) return

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
    window.location.assign(socialLoginUrl(provider, 'learner', isRegister ? 'register' : 'login'))
  }

  return (
    <AuthShell
      isAdminPortal={isAdminPortal}
      eyebrow={isAdminPortal ? 'Admin portal' : eyebrow}
      title={isAdminPortal ? 'Admin control login' : title}
      subtitle={isAdminPortal ? 'Sign in to manage learners, courses, reports, approvals, and AI teacher operations.' : subtitle}
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {isRegister ? (
          <AuthField icon={<UserRound size={18} />} label="Full name" error={fieldError('fullName')}>
            <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" placeholder="Your full name" />
          </AuthField>
        ) : null}

        <AuthField icon={<Mail size={18} />} label="Email" error={fieldError('email')}>
          <input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" placeholder={isAdminPortal ? adminLoginHint.email : 'you@example.com'} />
        </AuthField>

        {isRegister ? (
          <AuthField icon={<Phone size={18} />} label="Phone number" error={fieldError('phone')}>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" placeholder="9999999999" />
          </AuthField>
        ) : null}

        {mode === 'otp' || mode === 'reset' ? (
          <AuthField icon={<ShieldCheck size={18} />} label="Verification code" error={fieldError('otp')}>
            <input value={form.otp} onChange={(e) => update('otp', e.target.value)} className="w-full bg-transparent text-slate-800 tracking-[0.18em] outline-none placeholder:text-slate-400 dark:text-white" placeholder="000000" />
          </AuthField>
        ) : null}

        {needsPassword ? (
          <AuthField icon={<LockKeyhole size={18} />} label={mode === 'reset' ? 'New password' : 'Password'} error={fieldError('password')}>
            <input value={form.password} onChange={(e) => update('password', e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" placeholder="Minimum 8 characters" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-slate-500 transition hover:text-slate-800 dark:text-slate-300 dark:hover:text-white" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </AuthField>
        ) : null}

        {isRegister ? (
          <AuthField icon={<LockKeyhole size={18} />} label="Confirm password" error={fieldError('confirmPassword')}>
            <input value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" placeholder="Repeat password" />
          </AuthField>
        ) : null}

        {needsPassword ? <PasswordStrength score={score} /> : null}

        {mode === 'login' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)] dark:text-slate-300">
            <label className="inline-flex items-center gap-2">
              <input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/10 accent-cyan-400" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-cyan-700 transition hover:text-blue-700 dark:text-cyan-200 dark:hover:text-white">Forgot password?</Link>
          </div>
        ) : null}

        {toast.message ? (
          <p className={`rounded-2xl px-4 py-3 text-sm font-medium ${toast.type === 'error' ? 'border border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-100' : 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'}`}>
            {toast.message}
          </p>
        ) : null}

        <Button type="submit" disabled={!canSubmit} className="min-h-12 w-full">
          {loading ? 'Please wait...' : buttonLabel(mode)}
        </Button>
      </form>

      {!isAdminPortal && (mode === 'login' || isRegister) ? (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)] dark:text-slate-400">
            <span className="h-px flex-1 bg-[var(--border-color)]" />
            <span>or {isRegister ? 'register' : 'login'} with</span>
            <span className="h-px flex-1 bg-[var(--border-color)]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <SocialButton icon={<span className="text-base font-black text-blue-600">G</span>} onClick={() => handleSocialLogin('google')} disabled={loading} aria-label={`${socialAction} with Google`}>
              {socialAction} with Google
            </SocialButton>
            <SocialButton icon={<Github size={17} />} onClick={() => handleSocialLogin('github')} disabled={loading} aria-label={`${socialAction} with GitHub`}>
              {socialAction} with GitHub
            </SocialButton>
          </div>
        </div>
      ) : null}

      {!isAdminPortal && (mode === 'login' || isRegister) ? (
        <div className="mt-5 rounded-2xl border border-cyan-300/30 bg-cyan-50 p-4 text-sm text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-50">
          <p className="flex items-center gap-2 font-semibold">
            <Rocket size={16} />
            Switch your AI mentor anytime during learning
          </p>
          <p className="mt-2 leading-6 text-[var(--text-secondary)] dark:text-slate-300">
            Keep the same progress while mentor style, XP goals, and practice prompts adapt around your course.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {mode !== 'login' ? <Link className="font-semibold text-cyan-700 transition hover:text-blue-700 dark:text-cyan-200 dark:hover:text-white" to="/login">Back to learner login</Link> : null}
        {!isAdminPortal && mode === 'login' ? <Link className="font-semibold text-cyan-700 transition hover:text-blue-700 dark:text-cyan-200 dark:hover:text-white" to="/register">Create learner account</Link> : null}
        {!isAdminPortal && mode === 'login' ? <Link className="font-semibold text-cyan-700 transition hover:text-blue-700 dark:text-cyan-200 dark:hover:text-white" to="/otp-verification">Use OTP</Link> : null}
      </div>
    </AuthShell>
  )
}

function buttonLabel(mode) {
  if (mode === 'register') return 'Create Account'
  if (mode === 'forgot') return 'Send Reset Code'
  if (mode === 'reset') return 'Reset Password'
  if (mode === 'otp') return 'Send or Verify OTP'
  return 'Login'
}
