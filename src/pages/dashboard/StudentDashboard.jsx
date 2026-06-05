import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import Button from '../../components/common/Button/Button.jsx'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../utils/animationVariants.js'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AlertCircle, Award, BookOpenCheck, Clock3, Compass, Flame, GraduationCap, LineChart as LineChartIcon, PlayCircle, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { fetchLearnerDashboard, fetchUserAnalytics } from '../../api/api'
import { resolveCourseThumbnail } from '../../utils/courseThumbnail'

const learnerPermissions = [
  'Browse upskilling and technical courses',
  'Enroll in learning paths and save favorites',
  'Access community discussions and certificates',
  'Track weekly progress and daily streaks',
]

const emptyAnalytics = {
  totalCourses: 0,
  avgProgress: 0,
  streak: 0,
  hoursStudied: 0,
  completions: 0,
  quiz: 0,
  certificates: 0,
  weekly: [
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ],
  recent: [],
}

function normalizeAnalytics(payload, courseCount) {
  const data = payload?.analytics || payload || {}
  return {
    totalCourses: data.totalCourses ?? courseCount,
    avgProgress: data.avgProgress ?? data.completion ?? emptyAnalytics.avgProgress,
    streak: data.streak ?? emptyAnalytics.streak,
    hoursStudied: Math.round(data.hoursStudied ?? emptyAnalytics.hoursStudied),
    completions: data.completions ?? data.certificates ?? emptyAnalytics.completions,
    quiz: data.quiz ?? emptyAnalytics.quiz,
    certificates: data.certificates ?? emptyAnalytics.certificates,
    weekly: data.weekly ?? emptyAnalytics.weekly,
    recent: data.recent ?? emptyAnalytics.recent,
  }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [analytics, setAnalytics] = useState(normalizeAnalytics(emptyAnalytics, 0))
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function goTo(path, fallbackMessage = '') {
    if (!path) {
      if (fallbackMessage) setNotice(fallbackMessage)
      return
    }
    setNotice('')
    navigate(path)
  }

  function resumeLearning() {
    const activeCourses = [...courses].sort((a, b) => {
      const dateA = new Date(a.enrollment?.enrolledAt || a.updatedAt || a.createdAt || 0).getTime()
      const dateB = new Date(b.enrollment?.enrolledAt || b.updatedAt || b.createdAt || 0).getTime()
      return dateB - dateA
    })
    const nextCourse = activeCourses[0]
    if (!nextCourse?.id) {
      goTo('/explore', 'No active enrolled course found. Pick a course to start learning.')
      return
    }
    goTo(`/player/${nextCourse.id}`)
  }

  function viewEnrolledCourses() {
    setNotice('')
    const enrolledCoursesSection = document.getElementById('enrolled-courses')
    if (enrolledCoursesSection) {
      enrolledCoursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError('')
      const [analyticsRes, coursesRes] = await Promise.all([
        fetchUserAnalytics().catch(() => ({ data: { analytics: {} } })),
        fetchLearnerDashboard().catch(() => ({ data: { dashboard: { enrollments: [] } } })),
      ])
      const enrollments = coursesRes.data?.dashboard?.enrollments || []
        const courseList = enrollments.map((enrollment) => ({
        ...enrollment.course,
        enrollmentId: enrollment.id,
        enrollment,
        isEnrolled: true,
        progress: enrollment.completionPct || 0,
      })).filter((course) => course?.id)
      setCourses(courseList)
      setAnalytics(normalizeAnalytics(analyticsRes.data, courseList.length))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error?.response?.data?.message || error.message || 'Could not load learner dashboard.')
      setCourses([])
      setAnalytics(normalizeAnalytics(emptyAnalytics, 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadDashboardData)
  }, [])

  const metricActions = [
    {
      icon: BookOpenCheck,
      label: 'Enrolled',
      value: analytics.totalCourses,
      detail: 'active learning paths',
      onClick: viewEnrolledCourses,
      actionLabel: 'View enrolled courses',
    },
    {
      icon: LineChartIcon,
      label: 'Avg Progress',
      value: `${analytics.avgProgress}%`,
      detail: 'across tracked courses',
    },
    {
      icon: Flame,
      label: 'Streak',
      value: `${analytics.streak} days`,
      detail: 'learning consistency',
    },
    {
      icon: Clock3,
      label: 'Hours',
      value: analytics.hoursStudied,
      detail: 'studied so far',
    },
    {
      icon: Award,
      label: 'Certificates',
      value: analytics.certificates,
      detail: 'earned credentials',
      onClick: () => goTo('/certificates'),
      actionLabel: 'Open certificates',
    },
  ]

  return (
    <section className="space-y-8 pb-16">
      <div className="upto-premium-panel overflow-hidden rounded-xl p-5 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.3em] sm:text-sm">Learner dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">Welcome back, {auth.user?.name || auth.user?.fullName || 'learner'}.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              Continue your upskilling journey, unlock achievements, and track daily goals with an AI-powered roadmap.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Today', `${analytics.hoursStudied}h`],
                ['Streak', `${analytics.streak}d`],
                ['Progress', `${analytics.avgProgress}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-center shadow-soft">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{loading ? <span className="skeleton mx-auto inline-block h-6 w-10 rounded" /> : value}</p>
                  <p className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-start gap-3 xl:justify-end">
              <Button onClick={() => goTo('/explore')}>Explore Courses</Button>
              <Button variant="secondary" onClick={() => goTo('/certificates')}>Certificates</Button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-5 text-red-700 dark:text-red-100">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-semibold">Unable to load learner dashboard</p>
                <p className="mt-1 text-sm opacity-85">{error}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={loadDashboardData}><RefreshCw size={16} /> Retry</Button>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-700 dark:text-cyan-100">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricActions.map((metric) => (
          <LearnerMetric key={metric.label} {...metric} loading={loading} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Learner permissions</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">What you can do</h2>
            </div>
            <Button variant="secondary" onClick={() => goTo('/user')}>
              View profile
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {learnerPermissions.map((permission) => (
              <div
                key={permission}
                className="theme-subcard flex items-start gap-3 rounded-lg p-4 text-sm text-[var(--text-secondary)]"
              >
                <ShieldCheck className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" size={17} />
                <span>{permission}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="glass-card p-5 shadow-soft sm:p-6">
          <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Quick actions</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Next best steps</h2>
          <div className="mt-6 grid gap-3">
            <LearnerAction icon={Compass} title="Find a course" text="Browse current catalog and pick your next skill." onClick={() => goTo('/explore')} />
            <LearnerAction icon={PlayCircle} title="Resume learning" text="Open your most recent course player." onClick={resumeLearning} />
            <LearnerAction icon={Sparkles} title="Join community" text="Ask questions and learn with peers." onClick={() => goTo('/community')} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Learning progress</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Time spent this week</h2>
            </div>
            <Button variant="secondary" onClick={() => goTo('/reports')}>View report</Button>
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.weekly}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#38bdf8"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#67e8f9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Skill growth</h2>
          <p className="mt-3 text-[var(--text-muted)]">
            Radar view of your current competency across premium learning pillars.
          </p>
          <div className="mt-8 flex justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={[
                  { subject: 'Creativity', A: analytics.avgProgress },
                  { subject: 'Coding', A: analytics.avgProgress },
                  { subject: 'Projects', A: analytics.completions ? Math.min(100, analytics.completions * 20) : 0 },
                  { subject: 'Quiz', A: analytics.quiz },
                  { subject: 'Consistency', A: Math.min(100, analytics.streak * 10) },
                  { subject: 'Practice', A: Math.min(100, analytics.hoursStudied * 5) },
                ]}
              >
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="You" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div id="enrolled-courses" className="glass-card scroll-mt-24 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Continue learning</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Your active courses</h2>
          </div>
          <Button variant="secondary" onClick={() => goTo('/explore')}>Explore New Courses</Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {loading ? (
            <>
              <CourseSkeleton />
              <CourseSkeleton />
            </>
          ) : courses.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center">
              <GraduationCap className="mx-auto text-[var(--text-muted)]" size={32} />
              <p className="mt-3 font-semibold text-[var(--text-primary)]">No active courses yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Explore courses to begin your learning path.</p>
              <Button className="mt-5" onClick={() => goTo('/explore')}>Explore Courses</Button>
            </div>
          ) : (
            courses.slice(0, 4).map((course) => (
              <div
                key={course.id}
                className="theme-subcard theme-subcard-hover overflow-hidden rounded-lg shadow-soft"
              >
                <div className="aspect-[16/7] bg-slate-950">
                  <img src={resolveCourseThumbnail(course)} alt={course.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-base font-semibold text-[var(--text-primary)]">{course.title}</p>
                      <p className="mt-2 truncate text-sm text-[var(--text-muted)]">{course.createdBy?.name || course.instructor?.full_name || course.instructor?.name || course.instructor || 'Instructor'}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-200">
                      {course.progress || 0}%
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-teal-500" style={{ width: `${course.progress || 0}%` }} />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{course.progress || 0}% complete</span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => goTo(`/course/${course.id}`)}>View Course</Button>
                    <Button onClick={() => goTo(`/player/${course.id}`)}>Open Player</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

function LearnerMetric({ icon: Icon, label, value, detail, loading, onClick, actionLabel }) {
  const canNavigate = typeof onClick === 'function'
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
        <span className="theme-icon-badge grid h-10 w-10 place-items-center rounded-lg">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{loading ? <span className="skeleton inline-block h-8 w-16" /> : value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{detail}</p>
    </>
  )

  if (canNavigate) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel || `Open ${label}`}
        title={actionLabel || `Open ${label}`}
        className="theme-card theme-subcard-hover w-full rounded-lg p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]/60"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="theme-card rounded-lg p-5">
      {content}
    </div>
  )
}

function LearnerAction({ icon: Icon, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="theme-subcard theme-subcard-hover flex items-center gap-3 rounded-lg p-4 text-left">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-400/15 text-cyan-700 dark:text-cyan-200">
        <Icon size={18} />
      </span>
      <span>
        <span className="block font-semibold text-[var(--text-primary)]">{title}</span>
        <span className="mt-0.5 block text-sm text-[var(--text-muted)]">{text}</span>
      </span>
    </button>
  )
}

function CourseSkeleton() {
  return (
    <div className="theme-subcard overflow-hidden rounded-lg shadow-soft">
      <div className="skeleton aspect-[16/7]" />
      <div className="space-y-4 p-5">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="flex gap-3">
          <div className="skeleton h-11 w-28 rounded-xl" />
          <div className="skeleton h-11 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}



