import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  GraduationCap,
  Layers3,
  LineChart as LineChartIcon,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button/Button.jsx'
import { fadeInUp } from '../../utils/animationVariants.js'
import { fetchLearnerDashboard, fetchUserAnalytics } from '../../api/api'
import { resolveCourseThumbnail } from '../../utils/courseThumbnail'

const emptyWeekly = [
  { day: 'Mon', hours: 0 },
  { day: 'Tue', hours: 0 },
  { day: 'Wed', hours: 0 },
  { day: 'Thu', hours: 0 },
  { day: 'Fri', hours: 0 },
  { day: 'Sat', hours: 0 },
  { day: 'Sun', hours: 0 },
]

const emptyAnalytics = {
  totalCourses: 0,
  avgProgress: 0,
  streak: 0,
  hoursStudied: 0,
  completions: 0,
  quiz: 0,
  certificates: 0,
  weekly: emptyWeekly,
  recent: [],
}

const learnerCapabilities = [
  ['Discover', 'Explore curated course tracks by category, skill level, and mentor.'],
  ['Practice', 'Attempt questions and assignments connected to your enrolled courses.'],
  ['Progress', 'Track completion, weekly hours, certificates, and streak momentum.'],
  ['Community', 'Join discussions, ask doubts, and learn with peers.'],
]

function normalizeNumber(value, fallback = 0) {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallback
}

function normalizeAnalytics(payload, courseCount) {
  const data = payload?.analytics || payload || {}
  return {
    totalCourses: normalizeNumber(data.totalCourses, courseCount),
    avgProgress: Math.round(normalizeNumber(data.avgProgress ?? data.completion)),
    streak: normalizeNumber(data.streak),
    hoursStudied: Math.round(normalizeNumber(data.hoursStudied)),
    completions: normalizeNumber(data.completions ?? data.certificates),
    quiz: normalizeNumber(data.quiz),
    certificates: normalizeNumber(data.certificates),
    weekly: Array.isArray(data.weekly) && data.weekly.length ? data.weekly : emptyWeekly,
    recent: Array.isArray(data.recent) ? data.recent : [],
  }
}

function getInstructor(course) {
  return course?.createdBy?.name || course?.instructor?.full_name || course?.instructor?.name || course?.instructor || 'Instructor'
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [analytics, setAnalytics] = useState(normalizeAnalytics(emptyAnalytics, 0))
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError('')
      const [analyticsRes, coursesRes] = await Promise.all([
        fetchUserAnalytics().catch(() => ({ data: { analytics: {} } })),
        fetchLearnerDashboard().catch(() => ({ data: { dashboard: { enrollments: [] } } })),
      ])
      const enrollments = coursesRes.data?.dashboard?.enrollments || []
      const courseList = enrollments
        .map((enrollment) => ({
          ...enrollment.course,
          enrollmentId: enrollment.id,
          enrollment,
          isEnrolled: true,
          progress: Math.round(normalizeNumber(enrollment.completionPct)),
        }))
        .filter((course) => course?.id)

      setCourses(courseList)
      setAnalytics(normalizeAnalytics(analyticsRes.data, courseList.length))
    } catch (dashboardError) {
      console.error('Failed to load dashboard data:', dashboardError)
      setError(dashboardError?.response?.data?.message || dashboardError.message || 'Could not load learner dashboard.')
      setCourses([])
      setAnalytics(normalizeAnalytics(emptyAnalytics, 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadDashboardData)
  }, [])

  const activeCourse = useMemo(() => {
    return [...courses].sort((a, b) => {
      const dateA = new Date(a.enrollment?.enrolledAt || a.updatedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.enrollment?.enrolledAt || b.updatedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })[0]
  }, [courses])

  const averageProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + normalizeNumber(course.progress), 0) / courses.length)
    : analytics.avgProgress
  const weeklyGoalHours = Math.max(5, Math.min(12, courses.length * 3 || 5))
  const weeklyCompletedHours = analytics.weekly.reduce((sum, item) => sum + normalizeNumber(item.hours), 0)
  const weeklyGoalPct = Math.min(100, Math.round((weeklyCompletedHours / weeklyGoalHours) * 100))
  const atRiskCourses = courses.filter((course) => normalizeNumber(course.progress) < 25)

  const roadmapItems = [
    { label: 'Pick a course', done: courses.length > 0 },
    { label: 'Complete first lesson', done: averageProgress > 0 },
    { label: 'Pass a practice set', done: analytics.quiz > 0 },
    { label: 'Earn certificate', done: analytics.certificates > 0 },
  ]

  function goTo(path, fallbackMessage = '') {
    if (!path) {
      if (fallbackMessage) setNotice(fallbackMessage)
      return
    }
    setNotice('')
    navigate(path)
  }

  function resumeLearning() {
    if (!activeCourse?.id) {
      goTo('/explore', 'No active course found. Choose a course to start learning.')
      return
    }
    goTo(`/player/${activeCourse.id}`)
  }

  return (
    <section className="learner-dashboard-v2 mx-auto w-full max-w-[1440px] space-y-6 pb-14">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="learner-hero-v2 enterprise-mesh-panel rounded-xl border border-[var(--border-color)] p-5 shadow-soft sm:p-6 lg:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_36rem] lg:items-center lg:justify-start xl:grid-cols-[minmax(0,42rem)_40rem]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary)]">
              <Sparkles size={14} /> Learner workspace
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Welcome back, {auth.user?.name || auth.user?.fullName || 'learner'}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              Your courses, progress, practice, and certificates are organized into one focused learning cockpit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={resumeLearning}>
                <PlayCircle size={17} /> Resume learning
              </Button>
              <Button variant="secondary" onClick={() => goTo('/explore')}>
                <Compass size={17} /> Explore courses
              </Button>
              <Button variant="secondary" onClick={() => goTo('/questions')}>
                <Target size={17} /> Practice
              </Button>
            </div>
          </div>

          <div className="learner-hero-snapshot w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Next focus</p>
                <p className="mt-2 text-lg font-bold text-[var(--text-primary)]">
                  {loading ? 'Loading your workspace...' : activeCourse?.title || 'Choose your first course'}
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {activeCourse ? `Instructor: ${getInstructor(activeCourse)}` : 'Start with a guided course, then practice questions to build momentum.'}
                </p>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                <GraduationCap size={24} />
              </span>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, normalizeNumber(activeCourse?.progress))}%`, background: 'var(--brand-gradient)' }} />
            </div>
            <div className="mt-5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Recommended action</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                    {activeCourse ? 'Continue the latest enrolled course' : 'Explore courses and enroll in a learning track'}
                  </p>
                </div>
                <span className="text-xl font-black text-[var(--accent-primary)]">{loading ? '-' : `${Math.min(100, normalizeNumber(activeCourse?.progress))}%`}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button onClick={resumeLearning}>
                <PlayCircle size={17} /> {activeCourse ? 'Continue course' : 'Start learning'}
              </Button>
              <Button variant="secondary" onClick={() => goTo(activeCourse?.id ? `/course/${activeCourse.id}` : '/explore')}>
                <ArrowRight size={17} /> {activeCourse ? 'View details' : 'Browse catalog'}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {error ? (
        <StatusMessage tone="danger" icon={AlertCircle} title="Unable to load learner dashboard" text={error}>
          <Button variant="secondary" onClick={loadDashboardData}><RefreshCw size={16} /> Retry</Button>
        </StatusMessage>
      ) : null}

      {notice ? (
        <StatusMessage tone="info" icon={Sparkles} title="Learning note" text={notice} />
      ) : null}

      <div className="learner-metrics-v2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={BookOpenCheck} label="Active courses" value={analytics.totalCourses} detail="enrolled paths" loading={loading} />
        <MetricCard icon={LineChartIcon} label="Avg progress" value={`${averageProgress}%`} detail="across courses" loading={loading} />
        <MetricCard icon={Clock3} label="Study hours" value={analytics.hoursStudied} detail="tracked total" loading={loading} />
        <MetricCard icon={Award} label="Certificates" value={analytics.certificates} detail="earned credentials" loading={loading} onClick={() => goTo('/certificates')} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <LearningGoalCard label="Weekly goal" value={`${weeklyCompletedHours}/${weeklyGoalHours}h`} progress={weeklyGoalPct} detail="Stay consistent with short daily sessions." icon={Target} />
        <LearningGoalCard label="Learning streak" value={`${analytics.streak} days`} progress={Math.min(100, analytics.streak * 14)} detail={analytics.streak ? 'Keep the streak alive with one lesson today.' : 'Open a lesson today to start a streak.'} icon={Sparkles} />
        <LearningGoalCard label="Attention needed" value={atRiskCourses.length} progress={courses.length ? Math.round(((courses.length - atRiskCourses.length) / courses.length) * 100) : 0} detail={atRiskCourses.length ? 'Resume low-progress courses before they stall.' : 'No low-progress courses right now.'} icon={AlertCircle} />
      </section>

      <div className="learner-insights-v2 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(25rem,0.9fr)] xl:items-start">
        <section className="learner-activity-card glass-card self-start rounded-xl p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Learning activity</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">This week overview</h2>
            </div>
            <Button variant="secondary" onClick={() => goTo('/reports')}>View report</Button>
          </div>

          <div className="learner-activity-body mt-6 grid gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
            <div className="theme-subcard rounded-lg p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Total study time</p>
              <p className="mt-3 text-4xl font-black text-[var(--text-primary)]">{analytics.hoursStudied}h</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {analytics.hoursStudied > 0 ? 'Recorded across your enrolled courses.' : 'No tracked study time yet. Open a lesson to start logging progress.'}
              </p>
              <Button className="mt-5 w-full" onClick={resumeLearning}>
                <PlayCircle size={17} /> Continue now
              </Button>
            </div>

            <div className="grid gap-3">
              {analytics.weekly.map((item) => {
                const maxHours = Math.max(1, ...analytics.weekly.map((entry) => normalizeNumber(entry.hours)))
                const hours = normalizeNumber(item.hours)
                return (
                  <div key={item.day} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                    <span className="font-bold text-[var(--text-secondary)]">{item.day}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <span className="block h-full rounded-full" style={{ width: `${Math.max(4, (hours / maxHours) * 100)}%`, background: hours ? 'var(--brand-gradient)' : 'var(--border-color)' }} />
                    </span>
                    <span className="text-right text-xs font-bold text-[var(--text-muted)]">{hours}h</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="learner-health-card glass-card self-start rounded-xl p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Learning health</p>
              <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Progress snapshot</h2>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Trophy size={20} />
            </span>
          </div>
          <div className="learner-health-grid mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <ProgressSnapshot label="Course progress" value={averageProgress} detail={`${courses.length} enrolled course${courses.length === 1 ? '' : 's'}`} />
            <ProgressSnapshot label="Practice readiness" value={Math.min(100, analytics.quiz)} detail={`${analytics.quiz} assessment signal${analytics.quiz === 1 ? '' : 's'}`} />
            <ProgressSnapshot label="Certificate path" value={Math.min(100, analytics.certificates * 25)} detail={`${analytics.certificates} certificate${analytics.certificates === 1 ? '' : 's'} earned`} />
            <MiniHealthStat label="Streak" value={`${analytics.streak} days`} />
            <MiniHealthStat label="Completion" value={`${analytics.completions}`} />
          </div>
        </section>
      </div>

      <section id="enrolled-courses" className="learner-active-courses-v2 glass-card scroll-mt-24 rounded-xl p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Continue learning</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Active courses</h2>
          </div>
          <Button variant="secondary" onClick={() => goTo('/explore')}>Find more</Button>
        </div>

        <div className={`mt-6 grid gap-4 ${courses.length > 4 ? 'max-h-[36rem] overflow-y-auto pr-1' : ''}`}>
          {loading ? (
            <>
              <CourseRowSkeleton />
              <CourseRowSkeleton />
            </>
          ) : courses.length ? (
            courses.slice(0, 5).map((course) => (
              <CourseRow key={course.id} course={course} onOpen={() => goTo(`/player/${course.id}`)} onDetails={() => goTo(`/course/${course.id}`)} />
            ))
          ) : (
            <EmptyState onExplore={() => goTo('/explore')} />
          )}
        </div>
      </section>

      <aside className="learner-support-grid-v2 grid gap-6 lg:grid-cols-2">
          <section className="glass-card rounded-xl p-5 shadow-soft sm:p-6">
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Roadmap</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Next milestones</h2>
            <div className="mt-5 grid gap-3">
              {roadmapItems.map((item, index) => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.done ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-200' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                    {item.done ? <CheckCircle2 size={17} /> : index + 1}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-xl p-5 shadow-soft sm:p-6">
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Quick actions</p>
            <div className="mt-5 grid gap-3">
              <QuickAction icon={Compass} title="Explore catalog" text="Find your next skill path." onClick={() => goTo('/explore')} />
              <QuickAction icon={CalendarDays} title="Live sessions" text="Join upcoming learner events." onClick={() => goTo('/live-sessions')} />
              <QuickAction icon={ShieldCheck} title="Profile" text="Manage account and settings." onClick={() => goTo('/profile')} />
            </div>
          </section>
      </aside>

      <section className="learner-capabilities-v2 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {learnerCapabilities.map(([title, text]) => (
          <div key={title} className="theme-card rounded-lg p-5">
            <span className="theme-icon-badge grid h-10 w-10 place-items-center rounded-lg">
              <Layers3 size={18} />
            </span>
            <p className="mt-4 font-bold text-[var(--text-primary)]">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
          </div>
        ))}
      </section>
    </section>
  )
}

function StatusMessage({ tone, icon: Icon, title, text, children }) {
  const toneClass = tone === 'danger'
    ? 'border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-100'
    : 'border-cyan-400/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-100'

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-bold">{title}</p>
            <p className="mt-1 text-sm opacity-85">{text}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, detail, loading, onClick }) {
  const className = 'theme-card theme-subcard-hover w-full rounded-lg p-5 text-left'
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
        <span className="theme-icon-badge grid h-10 w-10 place-items-center rounded-lg"><Icon size={18} /></span>
      </div>
      <p className="mt-5 text-2xl font-bold text-[var(--text-primary)]">{loading ? <span className="skeleton inline-block h-8 w-16" /> : value}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{detail}</p>
    </>
  )

  return onClick ? <button type="button" onClick={onClick} className={className}>{content}</button> : <div className="theme-card rounded-lg p-5">{content}</div>
}

function LearningGoalCard({ icon: Icon, label, value, progress, detail }) {
  const safeProgress = Math.max(0, Math.min(100, normalizeNumber(progress)))
  return (
    <div className="theme-card rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[var(--text-primary)]">{value}</p>
        </div>
        <span className="theme-icon-badge grid h-11 w-11 place-items-center rounded-lg"><Icon size={19} /></span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
        <span className="block h-full rounded-full" style={{ width: `${safeProgress}%`, background: 'var(--brand-gradient)' }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
    </div>
  )
}

function ProgressSnapshot({ label, value, detail }) {
  const safeValue = Math.max(0, Math.min(100, normalizeNumber(value)))

  return (
    <div className="theme-subcard rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{detail}</p>
        </div>
        <span className="text-lg font-black text-[var(--accent-primary)]">{safeValue}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-card)]">
        <div className="h-full rounded-full" style={{ width: `${safeValue}%`, background: 'var(--brand-gradient)' }} />
      </div>
    </div>
  )
}

function MiniHealthStat({ label, value }) {
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function CourseRow({ course, onOpen, onDetails }) {
  const progress = Math.min(100, normalizeNumber(course.progress))
  const [imageFailed, setImageFailed] = useState(false)
  const thumbnail = resolveCourseThumbnail(course)

  return (
    <article className="theme-subcard theme-subcard-hover grid gap-4 rounded-lg p-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
      <div className="aspect-[16/10] overflow-hidden rounded-lg border border-[var(--border-color)] bg-gradient-to-br from-cyan-400/15 via-white to-orange-400/15 dark:via-white/5">
        {!imageFailed && thumbnail ? (
          <img
            src={thumbnail}
            alt={course.title}
            className="h-full w-full object-cover"
            onLoad={(event) => { event.currentTarget.style.display = 'block' }}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center p-3 text-center">
            <div>
              <BookOpenCheck className="mx-auto text-[var(--accent-primary)]" size={24} />
              <p className="mt-2 line-clamp-2 text-xs font-bold text-[var(--text-primary)]">{course.title || 'Course'}</p>
            </div>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[var(--accent-primary)]">
            {course.level || 'Beginner'}
          </span>
          <span className="text-xs font-semibold text-[var(--text-muted)]">{getInstructor(course)}</span>
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-bold text-[var(--text-primary)]">{course.title}</h3>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-card)]">
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--brand-gradient)' }} />
          </div>
          <span className="w-12 text-right text-xs font-bold text-[var(--text-secondary)]">{progress}%</span>
        </div>
      </div>
      <div className="flex gap-2 sm:flex-col">
        <Button onClick={onOpen}>Open</Button>
        <Button variant="secondary" onClick={onDetails}>Details</Button>
      </div>
    </article>
  )
}

function QuickAction({ icon: Icon, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="theme-subcard theme-subcard-hover flex items-center gap-3 rounded-lg p-4 text-left">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block font-bold text-[var(--text-primary)]">{title}</span>
        <span className="mt-0.5 block text-sm text-[var(--text-secondary)]">{text}</span>
      </span>
      <ArrowRight className="ml-auto shrink-0 text-[var(--text-muted)]" size={16} />
    </button>
  )
}

function EmptyState({ onExplore }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center">
      <GraduationCap className="mx-auto text-[var(--text-muted)]" size={34} />
      <p className="mt-3 font-bold text-[var(--text-primary)]">No active courses yet</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Choose a course and your learning plan will appear here.</p>
      <Button className="mt-5" onClick={onExplore}>Explore courses</Button>
    </div>
  )
}

function CourseRowSkeleton() {
  return (
    <div className="theme-subcard grid gap-4 rounded-lg p-3 sm:grid-cols-[9rem_minmax(0,1fr)_8rem] sm:items-center">
      <div className="skeleton aspect-[16/10] rounded-lg" />
      <div className="space-y-3">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-2 w-full rounded-full" />
      </div>
      <div className="skeleton h-11 rounded-lg" />
    </div>
  )
}
