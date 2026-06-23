import { useEffect, useState } from 'react'
import { Eye, EyeOff, Github, LockKeyhole, LogIn, Mail, Phone, Rocket, ShieldCheck, UserRound, Zap } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import AuthShell from '../../components/ui/Auth/AuthShell.jsx'
import AuthField from '../../components/ui/Auth/AuthField.jsx'
import PasswordStrength from '../../components/ui/Auth/PasswordStrength.jsx'
import SocialButton from '../../components/ui/Auth/SocialButton.jsx'
import { login, logout } from '../../store/slices/authSlice.js'
import { forgotPassword, loginRequest, registerRequest, resetPassword, sendOtp, socialLoginUrl, verifyOtp } from '../../api/api.js'
import { adminLoginHint } from '../../constants/auth.js'
import { validationRules } from '../../constants/validation.js'
import { cn } from '../../utils/classNames.js'

const routeByRole = {
  admin: '/admin',
  learner: '/dashboard',
  instructor: '/instructor',
}

const copyByMode = {
  login: ['Learner access', 'Welcome back to UptoSkills', 'Continue courses, assessments, certificates, and mentor-led learning from your secure workspace.'],
  register: ['New learner', 'Create your UptoSkills profile', 'Join a premium learning platform with guided courses, progress tracking, and career-focused practice.'],
  forgot: ['Account recovery', 'Recover your account', 'We will send a secure verification code so you can restore access safely.'],
  reset: ['Reset password', 'Set a new password', 'Use the verification code from your email and choose a stronger password.'],
  otp: ['OTP access', 'Verify with OTP', 'Use one-time verification for fast, secure learner access.'],
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

function createCaptchaChallenge() {
  const left = Math.floor(Math.random() * 8) + 2
  const right = Math.floor(Math.random() * 8) + 1
  return {
    prompt: `${left} + ${right} = ?`,
    answer: String(left + right),
  }
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
  const requiresCaptcha = mode === 'login'

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [captcha, setCaptcha] = useState(() => createCaptchaChallenge())
  const [captchaInput, setCaptchaInput] = useState('')
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
  const captchaSolved = !requiresCaptcha || captchaInput.trim() === captcha.answer
  const [eyebrow, title, subtitle] = copyByMode[mode]
  const socialAction = isRegister ? 'Register' : 'Login'

  useEffect(() => {
    if (isAdminPortal) return
    if (!auth.user || !auth.token) return
    navigate(routeByRole[auth.role] || '/dashboard', { replace: true })
  }, [auth.role, auth.token, auth.user, isAdminPortal, navigate])

  useEffect(() => {
    if (!isAdminPortal) return
    dispatch(logout())
  }, [dispatch, isAdminPortal])

  const errors = (() => {
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
  })()

  const canSubmit = (() => {
    if (loading) return false
    if (mode === 'forgot') return Boolean(form.email.trim())
    if (mode === 'otp') return Boolean(form.email.trim())
    return Object.keys(errors).length === 0 && captchaSolved
  })()

  const fieldError = (key) => (attempted ? errors[key] : '')
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const authenticate = async (response, fallbackMessage) => {
    const user = response.data.user
    const role = user.role
    dispatch(login({ user, role, token: response.data.token, rememberMe }))
    setToast({ type: 'success', message: fallbackMessage })
    const params = new URLSearchParams(location.search)
    const next = params.get('next')
    const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : ''
    navigate(safeNext || routeByRole[role] || '/dashboard')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setAttempted(true)
    setToast({ type: '', message: '' })

    if (Object.keys(errors).length && mode !== 'forgot' && mode !== 'otp') return
    if (mode === 'forgot' && errors.email) return
    if (mode === 'otp' && (errors.email || errors.otp)) return
    if (requiresCaptcha && !captchaSolved) {
      setToast({ type: 'error', message: 'Complete the CAPTCHA to continue.' })
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
    window.location.assign(socialLoginUrl(provider, 'learner', isRegister ? 'register' : 'login'))
  }

  return (
    <AuthShell
      isAdminPortal={isAdminPortal}
      mode={mode}
      eyebrow={isAdminPortal ? 'Admin portal' : eyebrow}
      title={isAdminPortal ? 'Sign in to UptoSkills Admin' : title}
      subtitle={isAdminPortal ? 'Access your admin dashboard and manage the learning platform with full control.' : subtitle}
    >
      {!isAdminPortal && (mode === 'login' || isRegister) ? (
        <div className={cn('auth-mode-tabs', isRegister && 'auth-mode-tabs-dense')}>
          <Link to="/login" className={cn('auth-mode-tab', mode === 'login' && 'auth-mode-tab-active')}>Login</Link>
          <Link to="/register" className={cn('auth-mode-tab', isRegister && 'auth-mode-tab-active')}>Register</Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={cn('auth-form', isRegister && 'auth-form-dense')} noValidate>
        {isRegister ? (
          <AuthField icon={<UserRound size={18} />} label="Full name" error={fieldError('fullName')} compact>
            <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Your full name" />
          </AuthField>
        ) : null}

        <AuthField icon={<Mail size={18} />} label={isAdminPortal ? 'Email address' : 'Email'} error={fieldError('email')} compact={isRegister || mode === 'reset'}>
          <input value={form.email} onChange={(e) => update('email', e.target.value)} type="email" className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder={isAdminPortal ? adminLoginHint.email : 'you@example.com'} />
        </AuthField>

        {isRegister ? (
          <AuthField icon={<Phone size={18} />} label="Phone number" error={fieldError('phone')} compact>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="9999999999" />
          </AuthField>
        ) : null}

        {mode === 'otp' || mode === 'reset' ? (
          <AuthField icon={<ShieldCheck size={18} />} label="Verification code" error={fieldError('otp')} compact={mode === 'reset'}>
            <input value={form.otp} onChange={(e) => update('otp', e.target.value)} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="000000" />
          </AuthField>
        ) : null}

        {needsPassword ? (
          <AuthField icon={<LockKeyhole size={18} />} label={mode === 'reset' ? 'New password' : 'Password'} error={fieldError('password')} compact={isRegister || mode === 'reset'}>
            <input value={form.password} onChange={(e) => update('password', e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder={mode === 'login' ? 'Enter your password' : 'Minimum 8 characters'} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[var(--text-muted)] transition hover:text-[var(--text-primary)]" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </AuthField>
        ) : null}

        {requiresCaptcha ? (
          <label className="block">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Security check</span>
            <div className={cn('mt-2 grid gap-3 rounded-xl border bg-white px-4 py-3 shadow-[0_12px_26px_rgba(15,23,42,0.06)] transition dark:bg-slate-950/70', captchaSolved ? 'border-emerald-400/60' : 'border-black/10 dark:border-white/10')}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <ShieldCheck size={18} className="text-[var(--accent-primary)]" />
                  Solve this CAPTCHA
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCaptcha(createCaptchaChallenge())
                    setCaptchaInput('')
                  }}
                  className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]"
                >
                  Refresh
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm font-black tracking-[0.2em] text-[var(--accent-primary)]">
                  {captcha.prompt}
                </div>
                <input
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  placeholder="Enter the answer"
                />
              </div>
            </div>
            {attempted && !captchaSolved ? (
              <span className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-5 text-red-600 dark:text-red-200">
                <ShieldCheck size={13} />
                CAPTCHA answer is incorrect.
              </span>
            ) : null}
          </label>
        ) : null}

        {isRegister ? (
          <AuthField icon={<LockKeyhole size={18} />} label="Confirm password" error={fieldError('confirmPassword')} compact>
            <input value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} type={showPassword ? 'text' : 'password'} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Repeat password" />
          </AuthField>
        ) : null}

        {needsPassword ? <PasswordStrength score={score} compact={isRegister || mode === 'reset'} /> : null}

        {mode === 'login' && !isAdminPortal ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
            <label className="inline-flex items-center gap-2 font-medium">
              <input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] accent-[var(--accent-primary)]" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]">Forgot password?</Link>
          </div>
        ) : null}

        {mode === 'login' && isAdminPortal ? (
          <div className="auth-admin-login-note">
            <ShieldCheck size={16} />
            <span>Use your approved admin credentials. Admin sessions are validated before the dashboard opens.</span>
          </div>
        ) : null}

        {toast.message ? (
          <p className={`animate-upto-fade-slide rounded-xl px-4 py-3 text-sm font-semibold ${toast.type === 'error' ? 'border border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-100' : 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'}`}>
            {toast.message}
          </p>
        ) : null}

        <Button type="submit" disabled={!canSubmit} loading={loading} loadingLabel="Please wait..." className={cn('auth-submit-button', isRegister && 'auth-submit-button-dense')}>
          {mode === 'login' ? (isAdminPortal ? <LockKeyhole size={16} /> : <LogIn size={16} />) : null}
          {buttonLabel(mode, isAdminPortal)}
        </Button>
      </form>

      {!isAdminPortal && (mode === 'login' || isRegister) ? (
        <div className={cn('auth-social-block', isRegister && 'auth-social-block-dense')}>
          <div className={cn('auth-divider', isRegister && 'auth-divider-dense')}>
            <span className="h-px flex-1 bg-[var(--border-color)]" />
            <span>or {isRegister ? 'register' : 'login'} with</span>
            <span className="h-px flex-1 bg-[var(--border-color)]" />
          </div>
          <div className="auth-social-grid">
            <SocialButton icon={<span className="text-base font-black text-blue-600">G</span>} onClick={() => handleSocialLogin('google')} disabled={loading} aria-label={`${socialAction} with Google`}>
              {socialAction} with Google
            </SocialButton>
            <SocialButton icon={<Github size={17} />} onClick={() => handleSocialLogin('github')} disabled={loading} aria-label={`${socialAction} with GitHub`}>
              {socialAction} with GitHub
            </SocialButton>
          </div>
        </div>
      ) : null}

      {!isAdminPortal && mode === 'login' ? (
        <div className="auth-info-panel">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3">
            <p className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              <Rocket size={16} className="text-[var(--accent-primary)]" />
              Personalized learning starts after sign in
            </p>
            <Zap size={16} className="text-[var(--accent-primary)]" />
          </div>
          <p className="px-4 py-3 leading-6 text-[var(--text-secondary)]">
            Your courses, certificates, mentor mode, and progress sync into one learner workspace.
          </p>
        </div>
      ) : null}

      {!isAdminPortal ? (
        <div className={cn('auth-footer-links', isRegister && 'auth-footer-links-dense')}>
          {mode !== 'login' ? <Link className="font-semibold text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]" to="/login">Back to learner login</Link> : null}
          {mode === 'login' ? <span className="text-[var(--text-secondary)]">New to UptoSkills? <Link className="font-semibold text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]" to="/register">Create learner account</Link></span> : null}
          {mode === 'login' ? <Link className="font-semibold text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]" to="/otp-verification">Use OTP instead</Link> : null}
        </div>
      ) : null}
    </AuthShell>
  )
}

function buttonLabel(mode, isAdminPortal = false) {
  if (mode === 'register') return 'Create Account'
  if (mode === 'forgot') return 'Send Reset Code'
  if (mode === 'reset') return 'Reset Password'
  if (mode === 'otp') return 'Send or Verify OTP'
  if (isAdminPortal) return 'Sign in to dashboard'
  return 'Login to dashboard'
}
