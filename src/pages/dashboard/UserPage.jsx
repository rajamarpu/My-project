import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  LockKeyhole,
  Mail,
  MonitorPlay,
  Phone,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  TrendingUp,
  UserRound,
  Zap,
} from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { pageTransition } from '../../utils/animationVariants.js'
import { changePassword, fetchCertificates, fetchUserAnalytics, forgotPassword, resetPassword, updateProfileRequest } from '../../api/api.js'
import { updateCurrentUser } from '../../store/slices/authSlice.js'

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say', 'Other']
const COUNTRY_OPTIONS = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Singapore',
  'Germany',
  'France',
  'Japan',
  'Other',
]
const CITY_OPTIONS = {
  India: ['New Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh', 'Other'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Seattle', 'Boston', 'Other'],
  'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Other'],
  Canada: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Other'],
  Australia: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Other'],
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Other'],
  Singapore: ['Singapore'],
  Germany: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Other'],
  France: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Other'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Other'],
}

/* ─────────────────────────────────────────────
   Main Page
   ───────────────────────────────────────────── */
export default function UserPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const enrolledCourses = useSelector((state) => state.auth.enrolledCourses || [])

  /* ── profile state ── */
  const [profileForm, setProfileForm] = useState({
    name: user?.fullName || user?.name || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || user?.profilePictureUrl || user?.profileImage || '',
  })
  const [avatarPreview, setAvatarPreview] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false)
  const [detailsForm, setDetailsForm] = useState(() => {
    const defaults = { dob: '', gender: '', country: '', city: '', linkedin: '', github: '', website: '' }
    try { return { ...defaults, ...JSON.parse(window.localStorage.getItem('uptoskills-profile-details') || '{}') } } catch { return defaults }
  })
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileNotice, setProfileNotice] = useState({ type: '', message: '' })
  const [learningData, setLearningData] = useState({ certificates: [], analytics: null })
  const [profileDataLoading, setProfileDataLoading] = useState(true)

  /* ── password state ── */
  const [passwordMode, setPasswordMode] = useState('change')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordNotice, setPasswordNotice] = useState({ type: '', message: '' })
  const [changeForm, setChangeForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [resetForm, setResetForm] = useState({ otp: '', newPassword: '', confirmPassword: '' })
  const [otpSent, setOtpSent] = useState(false)
  const activePassword = passwordMode === 'change' ? changeForm.newPassword : resetForm.newPassword
  const passwordStrength = useMemo(() => scorePassword(activePassword), [activePassword])

  /* ── derived data ── */
  const displayName = user?.fullName || user?.name || 'Learner'
  const profileImage = avatarPreview || profileForm.avatarUrl || user?.avatarUrl || user?.profilePictureUrl || user?.profileImage || ''
  const roleLabel = user?.role || 'Learner'
  const isAdminProfile = String(user?.role || '').toLowerCase() === 'admin'
  // Keep learner profiles focused on identity and account management. Course
  // summaries and shortcuts already belong to the learner dashboard.
  const showLearnerDashboardCards = false
  const memberSince = formatProfileDate(user?.createdAt || user?.joinedAt || user?.created_at)

  const accountReadiness = useMemo(
    () => [
      ['Name', Boolean(user?.fullName || user?.name)],
      ['Email', Boolean(user?.email)],
      ['Phone', Boolean(user?.phone)],
      ['Profile photo', Boolean(user?.avatarUrl || user?.profilePictureUrl || user?.profileImage)],
    ],
    [user],
  )
  const readinessCount = accountReadiness.filter((item) => item[1]).length
  const readinessPct = Math.round((readinessCount / accountReadiness.length) * 100)

  const activeCourseCount = Array.isArray(enrolledCourses) ? enrolledCourses.length : 0
  const completedCourseCount = Number(user?.completedCourses || user?.completedCourseCount || 0)
  const certificatesForProfile = learningData.certificates.filter((certificate) => !isAdminProfile || Number(certificate.user?.id || certificate.userId) === Number(user?.id))
  const certificateCount = Number(learningData.analytics?.certificates ?? certificatesForProfile.length ?? user?.certificates ?? user?.certificateCount ?? 0)
  const learningHours = Number(learningData.analytics?.hoursStudied ?? user?.learningHours ?? user?.hoursStudied ?? 0)
  const learningStreak = Number(learningData.analytics?.streak ?? user?.streak ?? user?.learningStreak ?? 0)
  const assessmentScore = Number(learningData.analytics?.quiz ?? user?.assessmentScore ?? user?.averageScore ?? 0)
  const xpPoints = Number(user?.xp || user?.xpPoints || 0)
  const level = Number(user?.level || 1)
  const profileStats = isAdminProfile
    ? [
      ['Access Role', roleLabel, 'platform privileges', ShieldCheck],
      ['Profile Ready', `${readinessPct}%`, 'identity completeness', UserRound],
      ['Security', passwordStrength.label, 'password status', KeyRound],
      ['Session', 'Active', 'current browser', MonitorPlay],
    ]
    : [
      ['Active Courses', activeCourseCount, 'enrolled paths', BookOpenCheck],
      ['Completed', completedCourseCount, 'finished courses', Award],
      ['Certificates', certificateCount, 'earned credentials', ShieldCheck],
      ['XP Points', xpPoints, 'total earned', Zap],
      ['Current Streak', `${learningStreak} days`, 'learning momentum', Flame],
      ['Avg. Score', `${assessmentScore}%`, 'performance', BarChart3],
    ]

  useEffect(() => {
    let active = true
    Promise.all([
      fetchCertificates().catch(() => ({ data: { certificates: [] } })),
      fetchUserAnalytics().catch(() => ({ data: { analytics: null } })),
    ]).then(([certificateResponse, analyticsResponse]) => {
      if (!active) return
      setLearningData({
        certificates: certificateResponse.data?.certificates || [],
        analytics: analyticsResponse.data?.analytics || null,
      })
    }).finally(() => { if (active) setProfileDataLoading(false) })
    return () => { active = false }
  }, [])

  /* ── handlers ── */
  const updateProfile = (key, value) => setProfileForm((prev) => ({ ...prev, [key]: value }))
  const updateDetails = (key, value) => setDetailsForm((prev) => ({ ...prev, [key]: value }))
  const updateChange = (key, value) => setChangeForm((prev) => ({ ...prev, [key]: value }))
  const updateReset = (key, value) => setResetForm((prev) => ({ ...prev, [key]: value }))

  function handleAvatarFile(file) {
    if (!file) return
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!acceptedTypes.includes(file.type)) {
      setProfileNotice({ type: 'error', message: 'Use a JPG, PNG, or WEBP profile image.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileNotice({ type: 'error', message: 'Profile image must be 5 MB or smaller.' })
      return
    }
    setUploadProgress(35)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setAvatarPreview(dataUrl)
      updateProfile('avatarUrl', dataUrl)
      setUploadProgress(100)
      setProfileNotice({ type: 'success', message: 'Photo ready. Save your profile to upload it.' })
    }
    reader.onerror = () => {
      setUploadProgress(0)
      setProfileNotice({ type: 'error', message: 'Could not read that image.' })
    }
    reader.readAsDataURL(file)
  }

  function removeAvatarPreview() {
    setAvatarPreview('')
    setUploadProgress(0)
    updateProfile('avatarUrl', '')
    setProfileNotice({ type: 'success', message: 'Profile photo removed.' })
  }

  async function shareProfile() {
    try {
      let copied = false
      if (navigator.clipboard?.writeText) {
        copied = await Promise.race([
          navigator.clipboard.writeText(window.location.href).then(() => true).catch(() => false),
          new Promise((resolve) => window.setTimeout(() => resolve(false), 600)),
        ])
      }
      if (!copied) {
        const temporaryInput = document.createElement('textarea')
        temporaryInput.value = window.location.href
        temporaryInput.setAttribute('readonly', '')
        temporaryInput.style.position = 'fixed'
        temporaryInput.style.opacity = '0'
        document.body.appendChild(temporaryInput)
        temporaryInput.select()
        copied = document.execCommand('copy')
        temporaryInput.remove()
        if (!copied) throw new Error('Copy command was unavailable')
      }
      setProfileNotice({ type: 'success', message: 'Profile link copied.' })
    } catch {
      setProfileNotice({ type: 'error', message: 'Could not share profile right now.' })
    }
  }

  async function submitProfile(event) {
    event.preventDefault()
    const avatarUrl = profileForm.avatarUrl.trim()
    if (avatarUrl && !isValidProfileImageUrl(avatarUrl)) {
      setProfileNotice({ type: 'error', message: 'Enter a valid image URL (http, /uploads, /celebrities, data:image, or blob).' })
      return
    }
    try {
      setProfileBusy(true)
      setProfileNotice({ type: '', message: '' })
      const response = await updateProfileRequest({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        avatarUrl,
      })
      dispatch(updateCurrentUser(response.data.user))
      window.localStorage.setItem('uptoskills-profile-details', JSON.stringify(detailsForm))
      setProfileForm({
        name: response.data.user?.fullName || response.data.user?.name || profileForm.name,
        phone: response.data.user?.phone || '',
        avatarUrl: response.data.user?.avatarUrl || '',
      })
      setProfileNotice({ type: 'success', message: 'Profile saved successfully.' })
    } catch (err) {
      setProfileNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not update profile.' })
    } finally {
      setProfileBusy(false)
    }
  }

  /* ── password helpers ── */
  function validateNewPassword(newPw, confirmPw) {
    if (!newPw || newPw.length < 8) return 'Password must be at least 8 characters.'
    if (newPw !== confirmPw) return 'Passwords do not match.'
    return ''
  }

  async function submitPasswordChange(event) {
    event.preventDefault()
    const validation = validateNewPassword(changeForm.newPassword, changeForm.confirmPassword)
    if (!changeForm.currentPassword) {
      setPasswordNotice({ type: 'error', message: 'Current password is required.' })
      return
    }
    if (validation) { setPasswordNotice({ type: 'error', message: validation }); return }
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
    if (!user?.email) { setPasswordNotice({ type: 'error', message: 'Account email is required.' }); return }
    try {
      setPasswordBusy(true)
      setPasswordNotice({ type: '', message: '' })
      const response = await forgotPassword(user.email)
      setOtpSent(true)
      setPasswordNotice({ type: 'success', message: response.data.message || '6-digit OTP sent.' })
    } catch (err) {
      setPasswordNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not send OTP.' })
    } finally {
      setPasswordBusy(false)
    }
  }

  async function submitOtpReset(event) {
    event.preventDefault()
    const validation = validateNewPassword(resetForm.newPassword, resetForm.confirmPassword)
    if (!/^\d{6}$/.test(resetForm.otp.trim())) { setPasswordNotice({ type: 'error', message: 'Enter the 6-digit OTP.' }); return }
    if (validation) { setPasswordNotice({ type: 'error', message: validation }); return }
    try {
      setPasswordBusy(true)
      setPasswordNotice({ type: '', message: '' })
      const response = await resetPassword({ email: user.email, otp: resetForm.otp, newPassword: resetForm.newPassword })
      setPasswordNotice({ type: 'success', message: response.data.message || 'Password reset successfully.' })
      setResetForm({ otp: '', newPassword: '', confirmPassword: '' })
      setOtpSent(false)
    } catch (err) {
      setPasswordNotice({ type: 'error', message: err?.response?.data?.message || err.message || 'Could not reset password.' })
    } finally {
      setPasswordBusy(false)
    }
  }

  /* ─────────────────────────────────────────────
     Render
     ───────────────────────────────────────────── */
  return (
    <motion.section className="space-y-8 pb-16" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <div className={isAdminProfile ? 'contents' : 'glass-card overflow-hidden rounded-2xl shadow-[0_28px_90px_rgba(37,99,235,0.12)]'}>

      {/* ─── HERO: Profile Card ─── */}
      <section className={`${isAdminProfile ? 'glass-card rounded-2xl shadow-[0_28px_90px_rgba(37,99,235,0.14)]' : 'border-b border-[var(--border-color)]'} relative overflow-hidden px-6 py-8 transition-colors sm:px-8 sm:py-10`}>
        {/* background mesh */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.12),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(20,184,166,0.10),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(45,212,191,0.12),transparent_28%)]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center xl:gap-12">
          {/* Avatar */}
          <label
            className={`group relative grid h-32 w-32 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed transition duration-200 sm:h-36 sm:w-36 ${isDraggingPhoto ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--accent-primary)] bg-[var(--bg-subtle)]'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingPhoto(true) }}
            onDragLeave={() => setIsDraggingPhoto(false)}
            onDrop={(e) => { e.preventDefault(); setIsDraggingPhoto(false); handleAvatarFile(e.dataTransfer.files?.[0]) }}
          >
            {profileImage ? (
              <img src={profileImage} alt={`${displayName} profile`} className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                onLoad={(e) => { e.currentTarget.style.display = 'block' }}
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <span className="grid h-full w-full place-items-center bg-gradient-to-br from-orange-100 via-white to-amber-100 text-[var(--accent-primary)] dark:from-[var(--accent-soft)] dark:via-white/5 dark:to-amber-500/10">
                <UserRound size={52} />
              </span>
            )}
            <span className="absolute inset-x-4 bottom-4 inline-flex items-center justify-center gap-2 rounded-full bg-slate-950/80 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-soft transition group-hover:opacity-100">
              <Camera size={14} /> Change
            </span>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
          </label>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">{displayName}</h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/25 bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)]">
                <UserRound size={17} />
                {roleLabel}
              </span>
              {!isAdminProfile && learningStreak > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-[var(--accent-orange)]">
                  <Flame size={17} /> {learningStreak} day streak
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3">
                <Mail size={15} className="text-[var(--accent-primary)]" />
                {user?.email || 'Email not added'}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3">
                <CalendarDays size={15} className="text-[var(--accent-primary)]" />
                Member since {memberSince}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3">
                <Phone size={15} className="text-[var(--accent-primary)]" />
                {user?.phone || 'Phone not added'}
              </span>
            </div>

            {/* Profile completion */}
            <div className="mt-5 max-w-xl">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[var(--text-primary)]">Profile completion</span>
                <span className="font-bold text-[var(--accent-primary)]">{readinessPct}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div className="h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${readinessPct}%` }} />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => document.getElementById('profile-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Edit Profile</Button>
              <Button variant="secondary" onClick={shareProfile}><Share2 size={16} /> Share</Button>
              {isAdminProfile ? (
                <Button onClick={() => navigate('/admin')}><ShieldCheck size={16} /> Admin Dashboard</Button>
              ) : (
                <Button onClick={() => navigate('/certificates')}><Download size={16} /> Certificates</Button>
              )}
              {profileImage ? <Button variant="secondary" onClick={removeAvatarPreview}><Trash2 size={16} /> Remove Photo</Button> : null}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Learning Stats ─── */}
      {isAdminProfile ? <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {profileStats.map(([label, value, detail, Icon]) => (
          <motion.div
            key={label}
            className="theme-subcard theme-subcard-hover rounded-2xl p-4 shadow-soft"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.18 }}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Icon size={18} />
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{detail}</p>
          </motion.div>
        ))}
      </section> : null}

      {/* ─── Two-column: Activity + Sidebar ─── */}
      <section className="grid gap-6">

        {/* ── Main Column ── */}
        <div className="space-y-6">

          {/* XP & Level Overview */}
          {showLearnerDashboardCards ? <div className="glass-card p-5 shadow-glow sm:p-6">
            <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Learning Progress</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Level {level} — {getXpLabel(xpPoints)}</h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                  {getProgressMessage(activeCourseCount, completedCourseCount, learningStreak)}
                </p>
              </div>
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-[var(--border-color)] bg-[var(--accent-soft)] shadow-[0_16px_38px_rgba(245,158,11,0.18)]">
                <Trophy className="h-10 w-10 text-[var(--accent-orange)]" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="theme-subcard flex items-center justify-between rounded-2xl p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <Zap className="text-[var(--accent-orange)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">XP Points</p>
                    <p className="text-xs text-[var(--text-muted)]">Keep learning to earn more</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[var(--accent-orange)]">{xpPoints}</span>
              </div>

              <div className="theme-subcard flex items-center justify-between rounded-2xl p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <Target className="text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Badges</p>
                    <p className="text-xs text-[var(--text-muted)]">Master topics to unlock</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-500">{certificateCount}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-[var(--accent-primary)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Study Time</p>
                    <p className="text-xs text-[var(--text-muted)]">Hours invested</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-[var(--accent-primary)]">{learningHours}h</span>
              </div>
            </div>

            {/* XP bar */}
            <div className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-[var(--text-primary)]">Level {level} progress</span>
                <span className="text-[var(--text-muted)]">{xpPoints % 1000} / 1,000 XP to next level</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div className="h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${Math.min((xpPoints % 1000) / 10, 100)}%` }} />
              </div>
            </div>
          </div> : null}

          {/* Quick tips */}
          {showLearnerDashboardCards ? <div className="glass-card p-5 shadow-soft sm:p-6">
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Quick Actions</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { icon: Play, label: 'Continue Learning', desc: 'Resume where you left off', action: () => navigate('/explore'), accent: true },
                { icon: BookOpen, label: 'Browse Courses', desc: 'Discover new skill paths', action: () => navigate('/explore') },
                { icon: Award, label: 'View Certificates', desc: 'Download earned credentials', action: () => navigate('/certificates') },
                { icon: Sparkles, label: 'Try AI Teachers', desc: 'Switch personality & style', action: () => navigate('/personalities') },
              ].map(({ icon: Icon, label, desc, action, accent }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 ${accent ? 'border-[var(--accent-primary)]/30 bg-[var(--accent-soft)] hover:border-[var(--accent-primary)]/60 hover:shadow-glow' : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-card-hover)]'}`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div> : null}

          {isAdminProfile ? (
            <div className="glass-card p-5 shadow-glow sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Admin Control Center</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Operational profile and access readiness</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                    This profile focuses on platform access, security, identity, and management shortcuts instead of learner XP, streaks, and certificates.
                  </p>
                </div>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                  <LockKeyhole size={22} />
                </span>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ['Identity', 'Keep name, phone, and profile image current for audit clarity.', UserRound, '/profile'],
                  ['Users', 'Review learner, instructor, and admin records from the management panel.', ShieldCheck, '/admin/users'],
                  ['Courses', 'Manage catalog, instructors, assignments, and publishing status.', BookOpen, '/admin/courses'],
                ].map(([title, text, Icon, path]) => (
                  <button key={title} type="button" onClick={() => navigate(path)} className="theme-subcard theme-subcard-hover rounded-xl p-4 text-left">
                    <span className="theme-icon-badge grid h-10 w-10 place-items-center rounded-lg"><Icon size={18} /></span>
                    <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Profile Editor */}
          <div id="profile-editor" className={isAdminProfile ? 'glass-card p-5 shadow-glow sm:p-6' : 'p-6 sm:p-8'}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Profile Editor</p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Personal Information</h2>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">{readinessCount}/{accountReadiness.length} essentials completed</span>
            </div>

            {profileNotice.message ? (
              <p className={`mt-5 rounded-xl border px-4 py-3 text-sm ${profileNotice.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100' : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-100'}`}>
                {profileNotice.message}
              </p>
            ) : null}

            <form onSubmit={submitProfile} className="mt-6">
              <div className="grid gap-6">
                <section>
                  <p className="border-b border-[var(--border-color)] pb-2 text-sm font-bold text-[var(--text-primary)]">Basic details</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <ProfileField label="Full name" value={profileForm.name} onChange={(e) => updateProfile('name', e.target.value)} placeholder="Enter your full name" />
                    <ProfileField label="Email address" value={user?.email || ''} readOnly placeholder="Email address" />
                    <ProfileField label="Phone number" type="tel" value={profileForm.phone} onChange={(e) => updateProfile('phone', e.target.value)} placeholder="Enter your phone number" />
                  </div>
                </section>

                <section>
                  <p className="border-b border-[var(--border-color)] pb-2 text-sm font-bold text-[var(--text-primary)]">Personal details and location</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <ProfileField label="Date of birth" type="date" value={detailsForm.dob} onChange={(e) => updateDetails('dob', e.target.value)} />
                    <ProfileField label="Gender" value={detailsForm.gender} onChange={(e) => updateDetails('gender', e.target.value)} placeholder="Select gender" options={GENDER_OPTIONS} />
                    <ProfileField label="Country" value={detailsForm.country} onChange={(e) => setDetailsForm((current) => ({ ...current, country: e.target.value, city: '' }))} placeholder="Select country" options={COUNTRY_OPTIONS} />
                    <ProfileField label="City" value={detailsForm.city} onChange={(e) => updateDetails('city', e.target.value)} placeholder={CITY_OPTIONS[detailsForm.country] ? 'Select city' : 'Enter city'} options={CITY_OPTIONS[detailsForm.country]} />
                  </div>
                </section>

                <section>
                  <p className="border-b border-[var(--border-color)] pb-2 text-sm font-bold text-[var(--text-primary)]">Links and profile image</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <ProfileField label="Personal website" type="url" value={detailsForm.website} onChange={(e) => updateDetails('website', e.target.value)} placeholder="https://yourwebsite.com" />
                    <ProfileField label="LinkedIn" type="url" value={detailsForm.linkedin} onChange={(e) => updateDetails('linkedin', e.target.value)} placeholder="LinkedIn profile URL" />
                    <ProfileField label="GitHub" type="url" value={detailsForm.github} onChange={(e) => updateDetails('github', e.target.value)} placeholder="GitHub profile URL" />
                    <ProfileField label="Profile picture URL" type="url" value={profileForm.avatarUrl} onChange={(e) => updateProfile('avatarUrl', e.target.value)} placeholder="Profile picture URL" />
                  </div>
                </section>
              </div>

              <div className={`mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between ${isAdminProfile ? 'rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)]' : 'border-t border-[var(--border-color)] px-0 pb-0'}`}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                    {profileImage ? (
                      <img src={profileImage} alt="Preview" className="h-full w-full object-cover"
                        onLoad={(e) => { e.currentTarget.style.display = 'block' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    ) : (
                      <UserRound size={22} className="text-[var(--text-muted)]" />
                    )}
                  </span>
                  <p className="text-xs leading-5 text-[var(--text-secondary)]">Upload progress: {uploadProgress}%</p>
                </div>
                <Button type="submit" variant="secondary" loading={profileBusy} loadingLabel="Saving...">Save Profile</Button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar ── */}
        {showLearnerDashboardCards ? <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">

          {/* Account Overview */}
          <div className="glass-card p-5 shadow-soft">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent-primary)]">Account Overview</p>
            <div className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Profile Completion</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{isAdminProfile ? 'Keep admin identity clear for platform records.' : 'Complete essentials for certificates.'}</p>
                </div>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-semibold text-[var(--accent-primary)]">{readinessPct}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div className="h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${readinessPct}%` }} />
              </div>
              <div className="mt-4 grid gap-2">
                {accountReadiness.map(([label, done]) => (
                  <span key={label} className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <CheckCircle2 size={16} className={done ? 'text-emerald-500' : 'text-[var(--text-muted)]'} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
              <span className="flex min-w-0 items-center gap-3"><Mail size={16} className="shrink-0 text-[var(--accent-primary)]" /><span className="truncate">{user?.email || 'Email not added'}</span></span>
              <span className="flex items-center gap-3"><Phone size={16} className="text-[var(--accent-primary)]" /><span>{user?.phone || 'Phone not added'}</span></span>
              <span className="flex items-center gap-3"><ShieldCheck size={16} className="text-emerald-500" /><span>{user?.role || 'Learner'} access verified</span></span>
            </div>
          </div>

          <>
            <div className="glass-card p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Learning Goals</p>
              <div className="mt-4 space-y-3">
                <GoalTracker label="Complete first course" current={completedCourseCount} target={Math.max(completedCourseCount, 1)} icon={BookOpenCheck} />
                <GoalTracker label="Earn 3 certificates" current={certificateCount} target={3} icon={Award} />
                <GoalTracker label="7-day learning streak" current={learningStreak} target={7} icon={Flame} />
                <GoalTracker label="Study 20 hours" current={learningHours} target={20} icon={Clock3} />
              </div>
            </div>

            <div className="glass-card p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Quick Links</p>
              <div className="mt-4 grid gap-3">
                <Button onClick={() => navigate('/explore')}>Explore Courses</Button>
                <Button variant="secondary" onClick={() => navigate('/certificates')}>View Certificates</Button>
                <Button variant="secondary" onClick={() => navigate('/personalities')}>AI Teachers</Button>
              </div>
            </div>
          </>
        </aside> : null}
      </section>
      </div>

      {isAdminProfile ? <section className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Certificates</p><h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Earned credentials</h2></div>
            <Button variant="secondary" onClick={() => navigate(isAdminProfile ? '/admin/certificates' : '/certificates')}>View all</Button>
          </div>
          <div className="mt-5 grid gap-3">
            {profileDataLoading ? Array.from({ length: 3 }).map((_, index) => <span key={index} className="skeleton h-20 rounded-xl" />) : certificatesForProfile.length ? certificatesForProfile.slice(0, 3).map((certificate) => (
              <div key={certificate.id || certificate.certificateNo} className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-success-soft)] text-[var(--color-success)]"><Award size={20} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{certificate.course?.title || 'Course Certificate'}</span><span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{certificate.certificateNo || 'Verified credential'} · {formatProfileDate(certificate.issuedAt)}</span></span>
                <CheckCircle2 size={18} className="shrink-0 text-[var(--color-success)]" />
              </div>
            )) : <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-6 text-center"><Award className="mx-auto text-[var(--text-muted)]" size={28} /><p className="mt-3 font-semibold text-[var(--text-primary)]">No certificates yet</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Completed course credentials will appear here.</p></div>}
          </div>
        </div>

        <div className="glass-card p-5 shadow-soft sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]">Activity Timeline</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Recent learning activity</h2>
          <div className="relative mt-5 grid gap-4 before:absolute before:bottom-3 before:left-[0.7rem] before:top-3 before:w-px before:bg-[var(--border-color)]">
            {profileDataLoading ? Array.from({ length: 4 }).map((_, index) => <span key={index} className="skeleton ml-8 h-16 rounded-xl" />) : learningData.analytics?.recent?.length ? learningData.analytics.recent.slice(0, 6).map((activity, index) => (
              <div key={activity.id || `${activity.courseId}-${activity.lessonId}-${index}`} className="relative flex gap-4">
                <span className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-4 border-[var(--bg-elevated)] bg-[var(--accent-primary)]" />
                <div className="min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3"><p className="truncate text-sm font-semibold text-[var(--text-primary)]">{activity.lesson?.title || activity.course?.title || 'Learning progress updated'}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{activity.percentComplete || 0}% complete · {formatProfileDate(activity.lastAccessedAt || activity.updatedAt)}</p></div>
              </div>
            )) : <div className="relative flex gap-4"><span className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-4 border-[var(--bg-elevated)] bg-[var(--accent-primary)]" /><div className="min-w-0 flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3"><p className="text-sm font-semibold text-[var(--text-primary)]">Profile created</p><p className="mt-1 text-xs text-[var(--text-muted)]">Member since {memberSince}</p></div></div>}
          </div>
        </div>
      </section> : null}

      {/* ─── Password Security ─── */}
      <div className="glass-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.24em] text-[var(--accent-primary)]"><LockKeyhole size={16} /> Password Security</p>
            <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Update or Recover Your Password</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Change your password with the current one, or send a 6-digit OTP to {user?.email || 'your account email'} if you forgot it.
            </p>
          </div>
          <div className="grid rounded-2xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-1 sm:grid-cols-2">
            <button type="button" onClick={() => { setPasswordMode('change'); setPasswordNotice({ type: '', message: '' }) }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${passwordMode === 'change' ? 'bg-[var(--accent-primary)] text-white shadow-soft' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              Change password
            </button>
            <button type="button" onClick={() => { setPasswordMode('forgot'); setPasswordNotice({ type: '', message: '' }) }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${passwordMode === 'forgot' ? 'bg-[var(--accent-primary)] text-white shadow-soft' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              Forgot password
            </button>
          </div>
        </div>

        {isAdminProfile ? <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <SecuritySignal icon={KeyRound} label="Password Strength" value={passwordStrength.label} detail="Use 8+ chars with letters, numbers, and symbols." />
          <SecuritySignal icon={Clock3} label="Last Activity" value="Current session" detail="JWT-backed session is active for this device." />
          <SecuritySignal icon={MonitorPlay} label="Device Access" value="1 browser" detail="Review devices regularly on shared machines." />
        </div> : null}

        {passwordNotice.message ? (
          <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${passwordNotice.type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'}`}>
            {passwordNotice.message}
          </p>
        ) : null}

        {passwordMode === 'change' ? (
          <form onSubmit={submitPasswordChange} className="mt-6 grid gap-4 lg:grid-cols-3">
            <PasswordInput label="Current password" value={changeForm.currentPassword} onChange={(v) => updateChange('currentPassword', v)} />
            <PasswordInput label="New password" value={changeForm.newPassword} onChange={(v) => updateChange('newPassword', v)} strength={passwordStrength} />
            <PasswordInput label="Confirm password" value={changeForm.confirmPassword} onChange={(v) => updateChange('confirmPassword', v)} />
            <div className="lg:col-span-3">
              <Button type="submit" loading={passwordBusy} loadingLabel="Updating...">Update Password</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={submitOtpReset} className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <Button type="button" variant="secondary" onClick={sendResetOtp} disabled={passwordBusy || !user?.email}>
                {otpSent ? 'Resend 6-digit OTP' : 'Send 6-digit OTP'}
              </Button>
            </div>
            <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
              6-digit OTP
              <input value={resetForm.otp} onChange={(e) => updateReset('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric" className="admin-input tracking-[0.2em]" placeholder="000000" />
            </label>
            <PasswordInput label="New password" value={resetForm.newPassword} onChange={(v) => updateReset('newPassword', v)} strength={passwordStrength} />
            <PasswordInput label="Confirm password" value={resetForm.confirmPassword} onChange={(v) => updateReset('confirmPassword', v)} />
            <div className="lg:col-span-3">
              <Button type="submit" disabled={!otpSent} loading={passwordBusy} loadingLabel="Resetting...">Reset Password</Button>
            </div>
          </form>
        )}
      </div>
    </motion.section>
  )
}

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

function ProfileField({ label, className = '', options, placeholder, ...inputProps }) {
  const normalizedOptions = options || []
  const hasExistingCustomValue = Boolean(inputProps.value && !normalizedOptions.includes(inputProps.value))
  return (
    <label className={`grid gap-2 text-sm font-semibold text-[var(--text-primary)] ${className}`}>
      {label}
      {options ? (
        <select className="admin-input font-normal" {...inputProps}>
          <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
          {hasExistingCustomValue ? <option value={inputProps.value}>{inputProps.value}</option> : null}
          {normalizedOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : <input className="admin-input font-normal" placeholder={placeholder} {...inputProps} />}
    </label>
  )
}

function GoalTracker({ label, current, target, icon: Icon }) {
  const pct = Math.min(Math.round((current / target) * 100), 100)
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Icon size={15} className="text-[var(--accent-primary)]" />
          {label}
        </span>
        <span className="text-xs font-bold text-[var(--accent-primary)]">{current}/{target}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <div className="h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function SecuritySignal({ icon: Icon, label, value, detail }) {
  return (
    <div className="theme-subcard rounded-xl p-4">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
        <Icon size={18} />
      </span>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
    </div>
  )
}

function PasswordInput({ label, value, onChange, strength }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="grid gap-2 text-sm text-[var(--text-secondary)]">
      {label}
      <span className="relative block">
        <input value={value} onChange={(e) => onChange(e.target.value)} type={visible ? 'text' : 'password'}
          className="admin-input pr-12" placeholder="Minimum 8 characters" />
        <button type="button" onClick={() => setVisible((c) => !c)}
          className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/70"
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {strength && value ? (
        <span className="block">
          <span className="mt-1 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">Strength</span>
            <span className="font-semibold text-[var(--accent-primary)]">{strength.label}</span>
          </span>
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
            <span className="block h-full rounded-full" style={{ width: `${strength.score}%`, background: 'var(--brand-gradient)' }} />
          </span>
        </span>
      ) : null}
    </label>
  )
}

/* ─────────────────────────────────────────────
   Utilities
   ───────────────────────────────────────────── */
function formatProfileDate(value) {
  if (!value) return 'Current account'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Current account'
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function scorePassword(value) {
  const text = String(value || '')
  const points = [
    text.length >= 8,
    /[A-Z]/.test(text),
    /[a-z]/.test(text),
    /\d/.test(text),
    /[^A-Za-z0-9]/.test(text),
  ].filter(Boolean).length
  if (!text) return { score: 0, label: 'Not set' }
  if (points >= 5) return { score: 100, label: 'Strong' }
  if (points >= 3) return { score: 66, label: 'Medium' }
  return { score: 33, label: 'Weak' }
}

function isValidProfileImageUrl(value) {
  const text = String(value || '').trim()
  if (!text) return true
  if (/^(data:image\/|blob:|\/uploads\/|\/celebrities\/|\/favicon\.svg)/i.test(text)) return true
  try {
    const parsed = new URL(text)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function getXpLabel(xp) {
  if (xp >= 5000) return 'Master Learner'
  if (xp >= 3000) return 'Advanced Scholar'
  if (xp >= 1500) return 'Dedicated Student'
  if (xp >= 500) return 'Rising Talent'
  return 'Getting Started'
}

function getProgressMessage(active, completed, streak) {
  if (completed === 0 && active === 0) return 'Welcome to UptoSkills! Start your first course to begin earning XP and building your learning streak.'
  if (streak >= 7) return `Amazing ${streak}-day streak! You are on fire. Keep going to unlock new achievement badges.`
  if (completed >= 3) return `You have completed ${completed} courses and earned certificates. Keep expanding your skill set!`
  return `You are making great progress. Continue your learning journey to earn more XP and level up.`
}
