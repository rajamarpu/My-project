import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarCheck,
  Clock3,
  Compass,
  Flame,
  GraduationCap,
  LifeBuoy,
  Mail,
  RefreshCw,
  Target,
  TrendingUp,
} from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import KpiCard from '../../components/ui/Dashboard/KpiCard.jsx'
import { fetchCourses, fetchLearnerDashboard, fetchMyAssessmentSubmissions, fetchUserAnalytics } from '../../api/api.js'
import { getCourseAssignments } from '../../utils/courseContent.js'

const emptyAnalytics = {
  completion: 0,
  hoursStudied: 0,
  quiz: 0,
  streak: 0,
  certificates: 0,
  weekly: [],
  recent: [],
}

function number(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function progressFor(enrollment) {
  return Math.max(0, Math.min(100, Math.round(number(enrollment?.completionPct ?? enrollment?.progress))))
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [courses, setCourses] = useState([])
  const [catalog, setCatalog] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const [analyticsResponse, dashboardResponse, catalogResponse, assessmentResponse] = await Promise.all([
        fetchUserAnalytics().catch(() => ({ data: { analytics: emptyAnalytics } })),
        fetchLearnerDashboard().catch(() => ({ data: { dashboard: { enrollments: [] } } })),
        fetchCourses().catch(() => ({ data: { courses: [] } })),
        fetchMyAssessmentSubmissions().catch(() => ({ data: { submissions: [] } })),
      ])
      const enrollments = dashboardResponse.data?.dashboard?.enrollments || []
      const nextCourses = enrollments
        .map((enrollment) => ({
          ...enrollment.course,
          enrollment,
          progress: progressFor(enrollment),
          isEnrolled: true,
        }))
        .filter((course) => course?.id)
      setCourses(nextCourses)
      setAnalytics({ ...emptyAnalytics, ...(analyticsResponse.data?.analytics || {}) })
      setCatalog(catalogResponse.data?.courses || catalogResponse.data || [])
      setSubmissions(assessmentResponse.data?.submissions || [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Could not load your learner dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadDashboard)
  }, [])

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => new Date(b.enrollment?.enrolledAt || 0) - new Date(a.enrollment?.enrolledAt || 0)),
    [courses],
  )
  const activeCourse = sortedCourses.find((course) => course.progress < 100) || sortedCourses[0]
  const averageProgress = courses.length
    ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)
    : number(analytics.completion)
  const completedCourses = courses.filter((course) => course.progress >= 100).length
  const inProgressCourses = courses.filter((course) => course.progress > 0 && course.progress < 100).length
  const assignments = useMemo(
    () => courses.flatMap((course) => getCourseAssignments(course).map((assignment) => ({ ...assignment, course }))),
    [courses],
  )
  const enrolledIds = useMemo(() => new Set(courses.map((course) => course.id)), [courses])
  const recommended = useMemo(() => catalog.filter((course) => !enrolledIds.has(course.id)).slice(0, 4), [catalog, enrolledIds])
  const weekly = Array.isArray(analytics.weekly) && analytics.weekly.length
    ? analytics.weekly
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, hours: 0 }))
  const maxWeeklyHours = Math.max(1, ...weekly.map((day) => number(day.hours)))
  const latestSubmission = submissions[0] || null
  const latestSubmissionCourseId = latestSubmission?.course?.id || latestSubmission?.courseId || activeCourse?.id || ''
  const activeCoursePlayerHref = activeCourse ? `/player/${activeCourse.id}` : '/courses'
  const activeCourseAssessmentsHref = latestSubmissionCourseId ? `/course/${latestSubmissionCourseId}/assessments` : '/questions'
  const certificatesEarned = number(analytics.certificates) || completedCourses

  const kpis = [
    {
      title: 'Active Courses',
      value: courses.length,
      detail: `${inProgressCourses} in progress`,
      icon: BookOpenCheck,
      tone: 'blue',
      href: activeCourse ? `/player/${activeCourse.id}` : '/courses',
    },
    {
      title: 'Completed Courses',
      value: completedCourses,
      detail: 'finished learning paths',
      icon: Award,
      tone: 'emerald',
      href: '/certificates',
    },
    {
      title: 'In Progress',
      value: inProgressCourses,
      detail: 'currently underway',
      icon: TrendingUp,
      tone: 'cyan',
      href: '/courses',
    },
    {
      title: 'Assignments Available',
      value: assignments.length,
      detail: 'course work items',
      icon: CalendarCheck,
      tone: 'cyan',
      href: activeCourseAssessmentsHref,
    },
    {
      title: 'Certificates Earned',
      value: certificatesEarned,
      detail: 'verified achievements',
      icon: Award,
      tone: 'amber',
      href: '/certificates',
    },
    {
      title: 'Quiz Score',
      value: `${number(analytics.quiz)}%`,
      detail: 'average assessment performance',
      icon: Target,
      tone: 'violet',
      href: activeCourseAssessmentsHref,
    },
    {
      title: 'Study Streak',
      value: `${number(analytics.streak)}d`,
      detail: 'current learning rhythm',
      icon: Flame,
      tone: 'orange',
      href: activeCoursePlayerHref,
    },
    {
      title: 'Hours Learned',
      value: `${number(analytics.hoursStudied)}h`,
      detail: 'tracked learning time',
      icon: Clock3,
      tone: 'teal',
      href: activeCoursePlayerHref,
    },
  ]

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-6 pb-16">
      <header className="admin-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.2em]">Learner dashboard</p>
            <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Welcome back, {user?.name || user?.fullName || 'learner'}.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              Continue your courses, review progress, complete assignments, and turn learning into verified achievement.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(activeCoursePlayerHref)}>
              {activeCourse ? 'Continue learning' : 'Find a course'} <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/courses')}>
              <Compass size={16} /> Explore courses
            </Button>
            <Button variant="secondary" onClick={() => navigate('/support')}>
              <LifeBuoy size={16} /> Support
            </Button>
            <Button variant="secondary" onClick={() => navigate('/contact')}>
              <Mail size={16} /> Contact Us
            </Button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p>
          <Button variant="secondary" onClick={loadDashboard}>
            <RefreshCw size={16} /> Retry
          </Button>
        </div>
      ) : null}

      <DashboardSection eyebrow="Overview" title="Your learning metrics">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((metric) => (
            <KpiCard key={metric.title} loading={loading} {...metric} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Continue Learning" title="Your active courses" action={<Button variant="secondary" onClick={() => navigate('/courses')}>Browse courses</Button>}>
        <div className="grid gap-3">
          {loading
            ? (
              <>
                <CourseSkeleton />
                <CourseSkeleton />
              </>
              )
            : sortedCourses.length
              ? sortedCourses.slice(0, 5).map((course) => (
                <LearningCourseRow
                  key={course.id}
                  course={course}
                  onContinue={() => navigate(`/player/${course.id}`)}
                  onDetails={() => navigate(`/course/${course.id}`)}
                />
              ))
              : (
                <EmptyState
                  icon={GraduationCap}
                  title="No active courses"
                  text="Enroll in a course and your learning queue will appear here."
                  action="Explore courses"
                  onAction={() => navigate('/courses')}
                />
                )}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Learning Progress" title="Progress and study activity">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <KpiCard
              title="Average progress"
              value={`${averageProgress}%`}
              detail={`${courses.length} enrolled course${courses.length === 1 ? '' : 's'}`}
              icon={TrendingUp}
              tone="blue"
              loading={loading}
              onClick={() => navigate(activeCoursePlayerHref)}
            />
            <KpiCard
              title="Study time"
              value={`${number(analytics.hoursStudied)}h`}
              detail="tracked learning time"
              icon={Clock3}
              tone="teal"
              loading={loading}
              onClick={() => navigate(activeCoursePlayerHref)}
            />
            <KpiCard
              title="Average assessment"
              value={`${number(analytics.quiz)}%`}
              detail="quiz performance"
              icon={Target}
              tone="amber"
              loading={loading}
              onClick={() => navigate(activeCourseAssessmentsHref)}
            />
          </div>
          <div className="theme-subcard flex min-h-[32rem] flex-col rounded-xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">This week</p>
              <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">
                {number(analytics.hoursStudied).toFixed(1)}h total
              </span>
            </div>
            <div className="mt-5 flex flex-1 flex-col justify-between gap-4">
              {weekly.map((day) => {
                const hours = number(day.hours)
                const width = hours ? Math.max(18, (hours / maxWeeklyHours) * 100) : 0
                return (
                  <div key={day.day} className="grid flex-1 grid-cols-[2.8rem_minmax(0,1fr)_3.5rem] items-center gap-4">
                    <span className="text-sm font-bold text-[var(--text-secondary)] dark:text-slate-300">{day.day}</span>
                    <span className="relative h-3 overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] dark:bg-slate-800/90 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]">
                      <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent_35%,transparent_65%,rgba(255,255,255,0.12))] opacity-80" aria-hidden="true" />
                      <span
                        className="relative block h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#3b82f6_35%,#22d3ee_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_0_18px_rgba(59,130,246,0.35)]"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                    <span className="text-right text-xs font-semibold text-[var(--text-muted)] dark:text-slate-400">{hours}h</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Learning Streak" title="Build a consistent learning rhythm">
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="flex items-center gap-4 rounded-xl bg-[var(--color-warning-soft)] p-5">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-elevated)] text-[var(--color-warning)]">
              <Flame size={28} />
            </span>
            <span>
              <strong className="block text-3xl text-[var(--text-primary)]">{number(analytics.streak)} days</strong>
              <span className="text-sm text-[var(--text-secondary)]">current streak</span>
            </span>
          </div>
          <div className="theme-subcard rounded-xl p-5">
            <p className="font-semibold text-[var(--text-primary)]">{number(analytics.streak) ? 'Keep your momentum going' : 'Start your streak today'}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Complete one lesson or practice activity today. Short, consistent sessions make course completion easier.
            </p>
            <Button className="mt-4" onClick={() => navigate(activeCoursePlayerHref)}>Learn now</Button>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Recommended Courses" title="Your next learning opportunities" action={<Button variant="secondary" onClick={() => navigate('/courses')}>View catalog</Button>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <span key={index} className="skeleton h-48 rounded-xl" />)
            : recommended.length
              ? recommended.map((course) => (
                <RecommendedCourse
                  key={course.id}
                  course={course}
                  onOpen={() => navigate(`/course/${course.id}`)}
                />
              ))
              : (
                <div className="sm:col-span-2 xl:col-span-4">
                  <EmptyState
                    icon={BookOpenCheck}
                    title="No recommendations yet"
                    text="New published courses will appear here automatically."
                  />
                </div>
                )}
        </div>
      </DashboardSection>
    </section>
  )
}

function DashboardSection({ eyebrow, title, action, children, compact = false }) {
  return (
    <section className={`admin-panel h-full ${compact ? 'p-5' : 'p-5 sm:p-6'}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function LearningCourseRow({ course, onContinue, onDetails }) {
  return (
    <article className="theme-subcard grid gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-soft dark:bg-slate-950/80 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent-primary)] dark:bg-cyan-500/15 dark:text-cyan-300">
            {course.level || 'Beginner'}
          </span>
          <span className="text-xs font-semibold text-[var(--text-muted)]">{course.category || 'Course'}</span>
        </div>
        <h3 className="mt-2 truncate font-bold text-[var(--text-primary)] dark:text-slate-100">{course.title}</h3>
        <div className="mt-3 flex items-center gap-3">
          <span className="relative h-3 flex-1 overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] dark:bg-slate-800/90 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]">
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent_35%,transparent_65%,rgba(255,255,255,0.1))] opacity-80" aria-hidden="true" />
            <span className="relative block h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#3b82f6_35%,#22d3ee_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_0_18px_rgba(59,130,246,0.35)]" style={{ width: `${course.progress}%` }} />
          </span>
          <span className="w-12 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-right text-xs font-bold text-[var(--accent-primary)] dark:bg-cyan-500/15 dark:text-cyan-300">{course.progress}%</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onContinue}>Continue</Button>
        <Button variant="secondary" onClick={onDetails}>Details</Button>
      </div>
    </article>
  )
}

function RecommendedCourse({ course, onOpen }) {
  const assignments = getCourseAssignments(course).length
  return (
    <button
      type="button"
      onClick={onOpen}
      className="theme-subcard theme-subcard-hover flex min-h-48 flex-col rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-5 text-left shadow-soft dark:bg-slate-950/80"
    >
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-primary)] dark:text-cyan-300">
        {course.category || 'Learning path'}
      </span>
      <h3 className="mt-3 line-clamp-2 font-bold text-[var(--text-primary)] dark:text-slate-100">{course.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)] dark:text-slate-300">
        {course.description || 'Build practical skills with guided lessons and assessments.'}
      </p>
      <span className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs font-semibold text-[var(--text-muted)] dark:text-slate-400">
        <span>{course.level || 'Beginner'}</span>
        <span>{assignments} assignments</span>
      </span>
    </button>
  )
}

function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-7 text-center">
      <Icon className="mx-auto text-[var(--text-muted)]" size={30} />
      <p className="mt-3 font-bold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{text}</p>
      {action ? <Button className="mt-5" onClick={onAction}>{action}</Button> : null}
    </div>
  )
}

function CourseSkeleton() {
  return (
    <div className="theme-subcard grid gap-3 rounded-xl p-4">
      <span className="skeleton h-5 w-2/3 rounded" />
      <span className="skeleton h-2 w-full rounded-full" />
      <span className="skeleton h-10 w-32 rounded-lg" />
    </div>
  )
}
