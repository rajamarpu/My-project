import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CalendarCheck,
  Compass,
  GraduationCap,
  LifeBuoy,
  Mail,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import KpiCard from '../../components/ui/Dashboard/KpiCard.jsx'
import { fetchCertificates, fetchCourses, fetchLearnerDashboard, fetchMyAssessmentSubmissions, fetchUserAnalytics, invalidateApiCachePrefix, readApiCache } from '../../api/api.js'
import { getCourseAssignments } from '../../utils/courseContent.js'
import { DASHBOARD_REFRESH_EVENT } from '../../utils/dashboardRefresh.js'
import { getCourseTitle } from '../../utils/courseTitle.js'

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

function getCourseRouteId(course) {
  return course?.id || course?.courseId || course?.enrollment?.courseId || course?.enrollment?.course?.id || ''
}

function normalizeAnalytics(payload = {}) {
  const hasEnrolledCourseCount = payload.enrolledCourseCount !== undefined && payload.enrolledCourseCount !== null
  return {
    ...emptyAnalytics,
    completion: number(payload.completion),
    hoursStudied: number(payload.hoursStudied),
    quiz: number(payload.quiz),
    streak: number(payload.streak),
    certificates: number(payload.certificates),
    enrolledCourseCount: hasEnrolledCourseCount ? number(payload.enrolledCourseCount) : null,
    weekly: Array.isArray(payload.weekly)
      ? payload.weekly.map((item) => ({
          ...item,
          day: item?.day || '',
          hours: number(item?.hours),
        }))
      : [],
    recent: Array.isArray(payload.recent) ? payload.recent : [],
  }
}

function normalizeEnrollment(enrollment) {
  const course = enrollment?.course || null
  const courseId = course?.id || enrollment?.courseId || ''
  const title = getCourseTitle({ ...course, enrollment })
  return {
    ...enrollment,
    enrollmentId: enrollment?.id || '',
    id: courseId || enrollment?.id || '',
    courseId,
    course: course
      ? {
          ...course,
          id: course.id || courseId,
          title,
        }
      : {
          id: courseId,
          title,
          category: enrollment?.category || 'Course',
          level: enrollment?.level || 'Beginner',
          description: enrollment?.description || '',
        },
    progress: progressFor(enrollment),
    isEnrolled: true,
  }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const [analytics, setAnalytics] = useState(() => normalizeAnalytics({
    ...(readApiCache('user-analytics') || {}),
    enrolledCourseCount: readApiCache('learner-dashboard')?.dashboard?.enrollments?.length || readApiCache('user-analytics')?.enrolledCourseCount || null,
  }))
  const [courses, setCourses] = useState(() => (readApiCache('learner-dashboard')?.dashboard?.enrollments || []).map(normalizeEnrollment).filter((course) => course?.id))
  const [catalog, setCatalog] = useState(() => readApiCache('courses')?.courses || readApiCache('courses') || [])
  const [submissions, setSubmissions] = useState([])
  const [certificates, setCertificates] = useState(() => readApiCache('certificates')?.certificates || readApiCache('certificates') || [])
  const [retakeGrants, setRetakeGrants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadDashboard() {
    try {
      setLoading(true)
      setError('')
      const [analyticsResponse, dashboardResponse, catalogResponse, assessmentResponse, certificatesResponse] = await Promise.all([
        fetchUserAnalytics().catch(() => ({ data: { analytics: emptyAnalytics } })),
        fetchLearnerDashboard().catch(() => ({ data: { dashboard: { enrollments: [] } } })),
        fetchCourses().catch(() => ({ data: { courses: [] } })),
        fetchMyAssessmentSubmissions().catch(() => ({ data: { submissions: [] } })),
        fetchCertificates().catch(() => ({ data: { certificates: [] } })),
      ])
      const enrollments = dashboardResponse.data?.dashboard?.enrollments || []
      const nextCourses = enrollments
        .map(normalizeEnrollment)
        .filter((course) => course?.id)
      setCourses(nextCourses)
      const nextCatalog = catalogResponse.data?.courses || catalogResponse.data || []
      setCatalog(nextCatalog)
      const catalogEnrolledCount = Array.isArray(nextCatalog)
        ? nextCatalog.filter((course) => course?.isEnrolled || course?.enrollment?.id || course?.enrollment).length
        : 0
      setAnalytics(normalizeAnalytics({
        ...(analyticsResponse.data?.analytics || {}),
        enrolledCourseCount: enrollments.length || catalogEnrolledCount || analyticsResponse.data?.analytics?.enrolledCourseCount || null,
      }))
      setSubmissions(assessmentResponse.data?.submissions || [])
      setCertificates(certificatesResponse.data?.certificates || [])
      setRetakeGrants(assessmentResponse.data?.retakeGrants || [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Could not load your learner dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadDashboard)
  }, [])

  useEffect(() => {
    const handleRefresh = () => {
      invalidateApiCachePrefix('learner-dashboard')
      invalidateApiCachePrefix('courses')
      invalidateApiCachePrefix('assessment-submissions')
      invalidateApiCachePrefix('certificates')
      invalidateApiCachePrefix('user-analytics')
      void loadDashboard()
    }
    window.addEventListener('uptoskills:dashboard-refresh', handleRefresh)
    return () => {
      window.removeEventListener('uptoskills:dashboard-refresh', handleRefresh)
    }
  }, [])

  useEffect(() => {
    if (location.hash !== '#active-courses') return
    const element = document.getElementById('active-courses')
    if (!element) return
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => new Date(b.enrollment?.enrolledAt || 0) - new Date(a.enrollment?.enrolledAt || 0)),
    [courses],
  )
  const activeCourse = sortedCourses.find((course) => course.progress < 100) || sortedCourses[0]
  const inProgressCourses = courses.filter((course) => course.progress > 0 && course.progress < 100).length
  const assignments = useMemo(
    () => courses.flatMap((course) => getCourseAssignments(course).map((assignment) => ({ ...assignment, course }))),
    [courses],
  )
  const retakeGrantsByAssignment = useMemo(
    () => new Map(retakeGrants.map((grant) => [grant.assignmentId, grant])),
    [retakeGrants],
  )
  const availableAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const history = submissions.filter((submission) => submission.assignmentId === assignment.id)
        const attemptsUsed = history.length
        const retakeGrant = retakeGrantsByAssignment.get(assignment.id)
        const maxAttempts = 1 + Math.max(0, Number(retakeGrant?.extraAttempts || 0))
        return attemptsUsed < maxAttempts
      }),
    [assignments, retakeGrantsByAssignment, submissions],
  )
  const enrolledIds = useMemo(() => new Set(courses.map((course) => course.id)), [courses])
  const recommended = useMemo(() => catalog.filter((course) => !enrolledIds.has(course.id)).slice(0, 4), [catalog, enrolledIds])
  const activeCourseId = getCourseRouteId(activeCourse)
  const activeCoursePlayerHref = activeCourseId ? `/player/${activeCourseId}` : '/courses'
  const activeCourseAssessmentsHref = '/assignments'
  const certificatesEarned = number(analytics.certificates) || certificates.length
  const enrolledCourseCount = courses.length || catalog.filter((course) => course?.isEnrolled || course?.enrollment?.id || course?.enrollment).length || analytics.enrolledCourseCount || 0

  const kpis = [
    {
      title: 'Active Courses',
      value: enrolledCourseCount,
      detail: enrolledCourseCount === 1 ? '1 enrolled course' : `${enrolledCourseCount} enrolled courses`,
      icon: BookOpenCheck,
      tone: 'blue',
      href: '/dashboard#active-courses',
    },
    {
      title: 'Assignments Available',
      value: availableAssignments.length,
      detail: availableAssignments.length ? 'open or reopened assignments' : 'no open assignments right now',
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
  ]

  return (
    <section className="learner-dashboard-v2 mx-auto w-full max-w-[1440px] space-y-6 pb-16">
      <header className="admin-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.2em]">Learner dashboard</p>
            <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Welcome back, {user?.name || user?.fullName || 'learner'}.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              Continue your courses, review progress, complete assignments, and turn learning into verified achievement.
            </p>
          </div>
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
            <Button onClick={() => navigate(activeCoursePlayerHref)} className="shrink-0 whitespace-nowrap">
              {activeCourse ? 'Continue learning' : 'Find a course'} <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/courses')} className="shrink-0 whitespace-nowrap">
              <Compass size={16} /> Explore courses
            </Button>
            <Button variant="secondary" onClick={() => navigate('/support')} className="shrink-0 whitespace-nowrap">
              <LifeBuoy size={16} /> Support
            </Button>
            <Button variant="secondary" onClick={() => navigate('/contact')} className="shrink-0 whitespace-nowrap">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kpis.map((metric) => (
            <KpiCard key={metric.title} loading={loading} {...metric} />
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        id="active-courses"
        eyebrow="Continue Learning"
        title="Your active courses"
        action={<Button variant="secondary" onClick={() => navigate('/courses')}>Browse courses</Button>}
      >
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
                  onContinue={() => {
                    const courseRouteId = getCourseRouteId(course)
                    if (courseRouteId) navigate(`/player/${courseRouteId}`)
                  }}
                  onDetails={() => {
                    const courseRouteId = getCourseRouteId(course)
                    if (courseRouteId) navigate(`/course/${courseRouteId}`)
                  }}
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

function DashboardSection({ id, eyebrow, title, action, children, compact = false }) {
  return (
    <section id={id} className={`admin-panel h-full ${compact ? 'p-5' : 'p-5 sm:p-6'}`}>
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
  const courseId = getCourseRouteId(course)
  const title = getCourseTitle(course)
  return (
    <article className="theme-subcard grid gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-4 shadow-soft dark:bg-slate-950/80 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent-primary)] dark:bg-cyan-500/15 dark:text-cyan-300">
            {course.level || 'Beginner'}
          </span>
          <span className="text-xs font-semibold text-[var(--text-muted)]">{course.category || 'Course'}</span>
        </div>
        <h3 className="mt-2 truncate font-bold text-[var(--text-primary)] dark:text-slate-100">{title}</h3>
        <div className="mt-3 flex items-center gap-3">
          <span className="relative h-3 flex-1 overflow-hidden rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] dark:bg-slate-800/90 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]">
            <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),transparent_35%,transparent_65%,rgba(255,255,255,0.1))] opacity-80" aria-hidden="true" />
            <span className="relative block h-full rounded-full bg-[linear-gradient(90deg,#2563eb_0%,#3b82f6_35%,#22d3ee_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.16),0_0_18px_rgba(59,130,246,0.35)]" style={{ width: `${number(course.progress)}%` }} />
          </span>
          <span className="w-12 rounded-full bg-[var(--accent-soft)] px-2 py-1 text-right text-xs font-bold text-[var(--accent-primary)] dark:bg-cyan-500/15 dark:text-cyan-300">{number(course.progress)}%</span>
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
      <h3 className="mt-3 line-clamp-2 font-bold text-[var(--text-primary)] dark:text-slate-100">
        {course.title || course.courseTitle || course.name || 'Course unavailable'}
      </h3>
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
