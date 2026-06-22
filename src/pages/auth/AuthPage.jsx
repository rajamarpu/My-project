import { useEffect, useMemo, useRef, useState } from 'react'
import { Eye, EyeOff, Github, LockKeyhole, LogIn, Mail, Phone, RefreshCw, Rocket, ShieldCheck, UserRound, Zap } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import AuthShell from '../../components/ui/Auth/AuthShell.jsx'
import AuthField from '../../components/ui/Auth/AuthField.jsx'
import PasswordStrength from '../../components/ui/Auth/PasswordStrength.jsx'
import SocialButton from '../../components/ui/Auth/SocialButton.jsx'
import { login } from '../../store/slices/authSlice.js'
import { fetchAuthCaptcha, forgotPassword, loginRequest, registerRequest, resetPassword, sendOtp, socialLoginUrl, verifyOtp } from '../../api/api.js'
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

export default function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const mode = modeFromPath(location.pathname)
  const isAdminPortal = location.pathname.includes('admin-login')
  const isRegister = mode === 'register'
  const needsPassword = ['login', 'register', 'reset'].includes(mode)
  const needsCaptcha = mode === 'login' || isRegister

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [captchaError, setCaptchaError] = useState('')
  const [captcha, setCaptcha] = useState(null)
  const captchaRequestId = useRef(0)
  const [form, setForm] = useState({
    fullName: '',
    email: location.state?.email || '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    captchaAnswer: '',
    role: isAdminPortal ? 'admin' : 'learner',
  })
  const [toast, setToast] = useState(() => {
    const params = new URLSearchParams(location.search)
    const error = params.get('error')
    return error ? { type: 'error', message: error } : { type: '', message: '' }
  })

  const score = passwordScore(form.password)
  const [eyebrow, title, subtitle] = copyByMode[mode]
  const socialAction = isRegister ? 'Register' : 'Login'

  useEffect(() => {
    if (isAdminPortal) return
    if (!auth.user || !auth.token) return
    navigate(routeByRole[auth.role] || '/dashboard', { replace: true })
  }, [auth.role, auth.token, auth.user, isAdminPortal, navigate])

  useEffect(() => {
    if (!isAdminPortal) return
  }, [isAdminPortal])

  const requestCaptcha = async () => {
    const requestId = ++captchaRequestId.current

    if (!needsCaptcha) {
      setCaptcha(null)
      setCaptchaError('')
      setCaptchaLoading(false)
      return
    }

    setCaptchaLoading(true)
    setCaptchaError('')

    try {
      let lastError = null
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const response = await fetchAuthCaptcha()
          if (captchaRequestId.current !== requestId) return
          setCaptcha(response.data.captcha)
          setForm((prev) => ({ ...prev, captchaAnswer: '' }))
          setCaptchaError('')
          return
        } catch (error) {
          lastError = error
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)))
        }
      }

      if (captchaRequestId.current !== requestId) return
      setCaptcha(null)
      setCaptchaError(lastError?.response?.data?.message || 'Unable to load the security check. Tap retry to try again.')
    } finally {
      if (captchaRequestId.current === requestId) setCaptchaLoading(false)
    }
  }

  useEffect(() => {
    void requestCaptcha()

    return () => {
      captchaRequestId.current += 1
    }
  }, [needsCaptcha])

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

    if (needsCaptcha) {
      if (captchaLoading || !captcha?.captchaId) next.captcha = captchaError || 'Loading the security check.'
      else if (!form.captchaAnswer.trim()) next.captcha = 'Solve the security check.'
      else if (!/^\d+$/.test(form.captchaAnswer.trim())) next.captcha = 'Enter the number only.'
    }

    if (needsPassword) {
      if (!form.password) next.password = 'Password is required.'
      else if (form.password.length < validationRules.passwordMinLength) next.password = `Use at least ${validationRules.passwordMinLength} characters.`
      else if ((isRegister || mode === 'reset') && score < 2) next.password = 'Use a stronger password.'
    }

    return next
  }, [captcha?.captchaId, captchaError, captchaLoading, form, isRegister, mode, needsCaptcha, needsPassword, score])

  const canSubmit = useMemo(() => {
    if (loading) return false
    if (mode === 'forgot') return Boolean(form.email.trim())
    if (mode === 'otp') return Boolean(form.email.trim())
    if (needsCaptcha && (captchaLoading || !captcha?.captchaId)) return false
    return Object.keys(errors).length === 0
  }, [captcha?.captchaId, captchaLoading, errors, form.email, loading, mode, needsCaptcha])

  const fieldError = (key) => (attempted ? errors[key] : '')
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const refreshCaptcha = async () => {
    if (!needsCaptcha) return
    await requestCaptcha()
  }

  const captchaStatus = captchaLoading
    ? 'Loading security check...'
    : captcha?.prompt || captchaError || 'Security check unavailable.'
  const captchaHelpText = captchaLoading
    ? 'Generating a fresh challenge from the server.'
    : captchaError
      ? 'Try again or refresh the page if the backend just restarted.'
      : 'Enter the answer only. Example: 12'
  const captchaChallengeText = formatCaptchaChallenge(captcha?.prompt)

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

    setLoading(true)
    try {
      if (mode === 'forgot') {
        await forgotPassword(form.email)
        setToast({ type: 'success', message: 'Reset code sent. Check your email.' })
        navigate('/reset-password', { state: { email: form.email.trim() } })
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
        const payload = { ...form, role: isAdminPortal ? 'admin' : 'learner', captchaId: captcha?.captchaId, captchaAnswer: form.captchaAnswer }
        const response = isRegister ? await registerRequest(payload) : await loginRequest(payload)
        await authenticate(response, isRegister ? 'Account created.' : 'Login successful.')
      }
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || err.message || 'Request failed. Please try again.' })
      if (needsCaptcha && (!err?.response || err.response.status >= 500)) await refreshCaptcha()
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
      title={isAdminPortal ? 'Administrator sign in' : title}
      subtitle={isAdminPortal ? 'Use your approved account to continue to the admin workspace.' : subtitle}
    >
      {!isAdminPortal && (mode === 'login' || isRegister) ? (
        <div className={cn('auth-mode-tabs', isRegister && 'auth-mode-tabs-dense')}>
          <Link to="/login" className={cn('auth-mode-tab', mode === 'login' && 'auth-mode-tab-active')}>Login</Link>
          <Link to="/register" className={cn('auth-mode-tab', isRegister && 'auth-mode-tab-active')}>Register</Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={cn('auth-form', isRegister && 'auth-form-dense')} noValidate>
        {isRegister ? (
          <AuthField id="auth-full-name" icon={<UserRound size={18} />} label="Full name" error={fieldError('fullName')} compact>
            <input id="auth-full-name" name="fullName" autoComplete="name" required aria-invalid={Boolean(fieldError('fullName'))} aria-describedby={fieldError('fullName') ? 'auth-full-name-error' : undefined} value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Your full name" />
          </AuthField>
        ) : null}

        <AuthField id="auth-email" icon={<Mail size={18} />} label="Email address" error={fieldError('email')} compact={isRegister || mode === 'reset'}>
          <input id="auth-email" name="email" value={form.email} onChange={(e) => update('email', e.target.value)} type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck="false" aria-invalid={Boolean(fieldError('email'))} aria-describedby={fieldError('email') ? 'auth-email-error' : undefined} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="you@example.com" />
        </AuthField>

        {isRegister ? (
          <AuthField id="auth-phone" icon={<Phone size={18} />} label="Phone number" error={fieldError('phone')} compact>
            <input id="auth-phone" name="phone" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} type="tel" inputMode="numeric" autoComplete="tel" maxLength={10} required aria-invalid={Boolean(fieldError('phone'))} aria-describedby={fieldError('phone') ? 'auth-phone-error' : undefined} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="9999999999" />
          </AuthField>
        ) : null}

        {mode === 'otp' || mode === 'reset' ? (
          <AuthField id="auth-otp" icon={<ShieldCheck size={18} />} label="Verification code" error={fieldError('otp')} compact={mode === 'reset'}>
            <input id="auth-otp" name="otp" value={form.otp} onChange={(e) => update('otp', e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" autoComplete="one-time-code" maxLength={8} required aria-invalid={Boolean(fieldError('otp'))} aria-describedby={fieldError('otp') ? 'auth-otp-error' : undefined} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="000000" />
          </AuthField>
        ) : null}

        {needsPassword ? (
          <AuthField id="auth-password" icon={<LockKeyhole size={18} />} label={mode === 'reset' ? 'New password' : 'Password'} error={fieldError('password')} compact={isRegister || mode === 'reset'}>
            <input id="auth-password" name="password" value={form.password} onChange={(e) => update('password', e.target.value)} type={showPassword ? 'text' : 'password'} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} aria-invalid={Boolean(fieldError('password'))} aria-describedby={fieldError('password') ? 'auth-password-error' : undefined} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder={mode === 'login' ? 'Enter your password' : 'Minimum 8 characters'} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="grid min-h-11 min-w-11 place-items-center text-[var(--text-muted)] transition hover:text-[var(--text-primary)]" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </AuthField>
        ) : null}

        {needsCaptcha ? (
          <section
            aria-label="Security check"
            className={cn(
              'rounded-2xl border p-3.5 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition',
              'bg-white/90 dark:bg-slate-950/50',
              captchaError ? 'border-red-400/50 ring-4 ring-red-400/10' : 'border-black/10 dark:border-white/10',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Security check</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                  Solve the challenge to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { void refreshCaptcha() }}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--border-color)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] shadow-sm transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] dark:bg-slate-950/70"
                disabled={captchaLoading || loading}
              >
                <RefreshCw size={14} className={captchaLoading ? 'animate-spin' : ''} />
                {captchaLoading ? 'Refreshing...' : 'New challenge'}
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <div
                className={cn(
                  'flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm',
                  captchaError
                    ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-100'
                    : 'border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)]',
                )}
              >
                <span className="inline-flex shrink-0 items-center rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)] whitespace-nowrap">
                  {captchaLoading ? 'Loading' : 'Challenge'}
                </span>
                <span className="whitespace-nowrap font-mono text-base font-bold tracking-[0.18em] sm:text-lg">
                  {captchaChallengeText}
                </span>
                <input
                  id="auth-captcha"
                  name="captchaAnswer"
                  value={form.captchaAnswer}
                  onChange={(e) => update('captchaAnswer', e.target.value.replace(/\D/g, '').slice(0, 3))}
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(fieldError('captcha') || captchaError)}
                  aria-describedby={fieldError('captcha') || captchaError ? 'auth-captcha-error' : undefined}
                  className={cn(
                    'w-24 rounded-xl border bg-white px-3 py-2.5 text-center text-lg font-semibold tracking-[0.12em] text-[var(--text-primary)] outline-none transition sm:w-24',
                    'placeholder:text-[var(--text-muted)] dark:bg-slate-950/70',
                    fieldError('captcha') || captchaError
                      ? 'border-red-400/70 ring-4 ring-red-400/10'
                      : 'border-[var(--border-color)] focus:border-[var(--accent-primary)] focus:ring-4 focus:ring-[var(--focus-ring)]',
                  )}
                  placeholder="Answer"
                />
              </div>
              <span className="text-[11px] leading-5 font-medium text-[var(--text-muted)]">
                {captchaHelpText}
              </span>
            </div>
          </section>
        ) : null}

        {isRegister ? (
          <AuthField id="auth-confirm-password" icon={<LockKeyhole size={18} />} label="Confirm password" error={fieldError('confirmPassword')} compact>
            <input id="auth-confirm-password" name="confirmPassword" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} type={showConfirmation ? 'text' : 'password'} required autoComplete="new-password" aria-invalid={Boolean(fieldError('confirmPassword'))} aria-describedby={fieldError('confirmPassword') ? 'auth-confirm-password-error' : undefined} className="w-full bg-transparent text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]" placeholder="Repeat password" />
            <button type="button" onClick={() => setShowConfirmation((value) => !value)} className="grid min-h-11 min-w-11 place-items-center text-[var(--text-muted)]" aria-label={showConfirmation ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirmation}>{showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </AuthField>
        ) : null}

        {(isRegister || mode === 'reset') ? <PasswordStrength score={score} compact /> : null}

        {mode === 'login' && !isAdminPortal ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
            <label className="inline-flex items-center gap-2 font-medium">
              <input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} type="checkbox" className="h-4 w-4 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] accent-[var(--accent-primary)]" />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]">Forgot password?</Link>
          </div>
        ) : null}

        <div className="auth-submit-status">
          {toast.message ? (
            <p
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`auth-toast animate-upto-fade-slide rounded-xl px-4 py-3 text-sm font-semibold ${toast.type === 'error' ? 'border border-red-400/25 bg-red-500/10 text-red-700 dark:text-red-100' : 'border border-emerald-400/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'}`}
            >
              {toast.message}
            </p>
          ) : <span className="auth-toast-placeholder" aria-hidden="true" />}
        </div>

        <div className={cn('auth-submit-rail', isAdminPortal && 'auth-submit-rail-admin')}>
          <Button type="submit" disabled={!canSubmit} loading={loading} loadingLabel="Please wait..." className={cn('auth-submit-button', isRegister && 'auth-submit-button-dense')}>
            {mode === 'login' ? (isAdminPortal ? <LockKeyhole size={16} /> : <LogIn size={16} />) : null}
            {buttonLabel(mode, isAdminPortal)}
          </Button>
        </div>
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
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <p className="flex items-center gap-2 font-semibold text-slate-950">
              <Rocket size={16} className="text-teal-300" />
              Personalized learning starts after sign in
            </p>
            <Zap size={16} className="text-[var(--accent-primary)]" />
          </div>
          <p className="px-4 py-3 leading-6 text-slate-700">
            Your courses, certificates, mentor mode, and progress sync into one learner workspace.
          </p>
        </div>
      ) : null}

      {!isAdminPortal ? (
        <div className={cn('auth-footer-links', isRegister && 'auth-footer-links-dense')}>
          {mode !== 'login' ? <Link className="font-semibold text-[var(--accent-primary)] transition hover:text-[var(--accent-bold)]" to="/login">Back to learner login</Link> : null}
          {mode === 'login' ? <span className="text-slate-800">New to UptoSkills? <Link className="font-semibold text-[#FF4B1F] transition hover:text-orange-700" to="/register">Create learner account</Link></span> : null}
          {mode === 'login' ? <Link className="font-semibold text-blue-700 transition hover:text-blue-800" to="/otp-verification">Use OTP instead</Link> : null}
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
  if (isAdminPortal) return 'Sign in'
  return 'Sign in'
}

function formatCaptchaChallenge(prompt = '') {
  const match = String(prompt).match(/(\d+)\s*\+\s*(\d+)/)
  if (!match) return prompt || 'Security challenge'
  return `${match[1]} + ${match[2]}`
}
