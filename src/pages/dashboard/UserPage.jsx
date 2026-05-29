import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Award, BookOpenCheck, Eye, EyeOff, LockKeyhole, MessageSquare, ShieldCheck, UserRound } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { pageTransition } from '../../utils/animationVariants.js'
import { changePassword, forgotPassword, resetPassword } from '../../api/api.js'

const userPermissions = [
  'Browse and enroll in upskilling and technical courses',
  'Save wishlist items and track progress',
  'Join community discussions',
  'Download certificates and review your achievements',
]

export default function UserPage() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [passwordMode, setPasswordMode] = useState('change')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState({ type: '', message: '' })
  const [changeForm, setChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [resetForm, setResetForm] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [otpSent, setOtpSent] = useState(false)

  const updateChange = (key, value) => setChangeForm((prev) => ({ ...prev, [key]: value }))
  const updateReset = (key, value) => setResetForm((prev) => ({ ...prev, [key]: value }))

  function validateNewPassword(newPassword, confirmPassword) {
    if (!newPassword || newPassword.length < 8) return 'New password must be at least 8 characters.'
    if (newPassword !== confirmPassword) return 'Confirm password must match the new password.'
    return ''
  }

  async function submitPasswordChange(event) {
    event.preventDefault()
    const validation = validateNewPassword(changeForm.newPassword, changeForm.confirmPassword)
    if (!changeForm.currentPassword) {
      setPasswordNotice({ type: 'error', message: 'Current password is required.' })
      return
    }
    if (validation) {
      setPasswordNotice({ type: 'error', message: validation })
      return
    }

    try {
      setPasswordBusy(true)
      setPasswordNotice({ type: '', message: '' })
      const response = await changePassword(changeForm)
      setPasswordNotice({ type: 'success', message: response.data.message || 'Password changed successfully.' })
      setChangeForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not change password.' })
    } finally {
      setPasswordBusy(false)
    }
  }

  async function sendResetOtp() {
    if (!user?.email) {
      setPasswordNotice({ type: 'error', message: 'Your account email is required to send an OTP.' })
      return
    }
    try {
      setPasswordBusy(true)
      setPasswordNotice({ type: '', message: '' })
      const response = await forgotPassword(user.email)
      setOtpSent(true)
      setPasswordNotice({ type: 'success', message: response.data.message || '6 digit OTP sent.' })
    } catch (err) {
      setPasswordNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not send OTP.' })
    } finally {
      setPasswordBusy(false)
    }
  }

  async function submitOtpReset(event) {
    event.preventDefault()
    const validation = validateNewPassword(resetForm.newPassword, resetForm.confirmPassword)
    if (!/^\d{6}$/.test(resetForm.otp.trim())) {
      setPasswordNotice({ type: 'error', message: 'Enter the 6 digit OTP.' })
      return
    }
    if (validation) {
      setPasswordNotice({ type: 'error', message: validation })
      return
    }

    try {
      setPasswordBusy(true)
      setPasswordNotice({ type: '', message: '' })
      const response = await resetPassword({ email: user.email, otp: resetForm.otp, newPassword: resetForm.newPassword })
      setPasswordNotice({ type: 'success', message: response.data.message || 'Password reset successfully. Please log in again if prompted.' })
      setResetForm({ otp: '', newPassword: '', confirmPassword: '' })
      setOtpSent(false)
    } catch (err) {
      setPasswordNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not reset password.' })
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <motion.section className="space-y-8 pb-16" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <div className="upto-premium-panel rounded-xl p-5 shadow-glow sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300 sm:text-sm">Profile</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white sm:text-4xl">{user?.fullName || user?.name || 'Your learner hub'}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{user?.email || 'This page gives you a quick overview of your permissions, access, and available learner actions.'}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-700 dark:text-cyan-100">
            <UserRound size={17} />
            {user?.role || 'Learner'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card p-5 shadow-soft sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Learner permissions</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {userPermissions.map((item, index) => {
              const icons = [BookOpenCheck, ShieldCheck, MessageSquare, Award]
              const Icon = icons[index] || ShieldCheck
              return (
              <div key={item} className="theme-subcard theme-subcard-hover flex items-start gap-3 rounded-lg p-4 text-sm text-[var(--text-secondary)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-400/15 text-cyan-700 dark:text-cyan-200">
                  <Icon size={17} />
                </span>
                <span>{item}</span>
              </div>
              )
            })}
          </div>
        </div>

        <div className="glass-card p-5 shadow-glow sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Profile editor</p>
          <div className="mt-6 space-y-3">
            <input className="admin-input" defaultValue={user?.fullName || user?.name || ''} placeholder="Full name" />
            <input className="admin-input" defaultValue={user?.phone || ''} placeholder="Phone" />
            <input className="admin-input" placeholder="Profile picture URL" />
            <Button variant="secondary">Save Profile</Button>
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Quick actions</p>
          <div className="mt-6 grid gap-3">
            <Button onClick={() => navigate('/explore')}>Explore Courses</Button>
            <Button variant="secondary" onClick={() => navigate('/certificates')}>View Certificates</Button>
            <Button variant="secondary" onClick={() => navigate('/community')}>Open Community</Button>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300"><LockKeyhole size={16} /> Password security</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Update or recover your password</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Change your password with the current password, or send a 6 digit OTP to {user?.email || 'your account email'} if you forgot it.
            </p>
          </div>
          <div className="grid rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-1 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setPasswordMode('change'); setPasswordNotice({ type: '', message: '' }) }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${passwordMode === 'change' ? 'bg-cyan-500 text-white shadow-soft' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Change password
            </button>
            <button
              type="button"
              onClick={() => { setPasswordMode('forgot'); setPasswordNotice({ type: '', message: '' }) }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${passwordMode === 'forgot' ? 'bg-cyan-500 text-white shadow-soft' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Forgot password
            </button>
          </div>
        </div>

        {passwordNotice.message ? (
          <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${passwordNotice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'}`}>
            {passwordNotice.message}
          </p>
        ) : null}

        {passwordMode === 'change' ? (
          <form onSubmit={submitPasswordChange} className="mt-6 grid gap-4 lg:grid-cols-3">
            <PasswordInput label="Current password" value={changeForm.currentPassword} onChange={(value) => updateChange('currentPassword', value)} />
            <PasswordInput label="New password" value={changeForm.newPassword} onChange={(value) => updateChange('newPassword', value)} />
            <PasswordInput label="Confirm password" value={changeForm.confirmPassword} onChange={(value) => updateChange('confirmPassword', value)} />
            <div className="lg:col-span-3">
              <Button type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating...' : 'Update Password'}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitOtpReset} className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <Button type="button" variant="secondary" onClick={sendResetOtp} disabled={passwordBusy || !user?.email}>
                {otpSent ? 'Resend 6 Digit OTP' : 'Send 6 Digit OTP'}
              </Button>
            </div>
            <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
              6 digit OTP
              <input
                value={resetForm.otp}
                onChange={(event) => updateReset('otp', event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                className="admin-input tracking-[0.2em]"
                placeholder="000000"
              />
            </label>
            <PasswordInput label="New password" value={resetForm.newPassword} onChange={(value) => updateReset('newPassword', value)} />
            <PasswordInput label="Confirm password" value={resetForm.confirmPassword} onChange={(value) => updateReset('confirmPassword', value)} />
            <div className="lg:col-span-3">
              <Button type="submit" disabled={passwordBusy || !otpSent}>{passwordBusy ? 'Resetting...' : 'Reset Password'}</Button>
            </div>
          </form>
        )}
      </div>
    </motion.section>
  )
}

function PasswordInput({ label, value, onChange }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
      {label}
      <span className="relative block">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? 'text' : 'password'}
          className="admin-input pr-12"
          placeholder="Minimum 8 characters"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-400/70"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  )
}


