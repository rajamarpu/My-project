import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight, Award, BookOpenCheck, CalendarCheck, Clock3,
  Compass, FileQuestion, Flame, GraduationCap, RefreshCw, Target, TrendingUp,
} from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchCourses, fetchLearnerDashboard, fetchMyAssessmentSubmissions, fetchUserAnalytics } from '../../api/api.js'
import { getCourseAssignments } from '../../utils/courseContent.js'

const emptyAnalytics = { completion: 0, hoursStudied: 0, quiz: 0, streak: 0, certificates: 0, weekly: [], recent: [] }

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
      setCourses(enrollments.map((enrollment) => ({ ...enrollment.course, enrollment, progress: progressFor(enrollment), isEnrolled: true })).filter((course) => course.id))
      setAnalytics({ ...emptyAnalytics, ...(analyticsResponse.data?.analytics || {}) })
      setCatalog(catalogResponse.data?.courses || catalogResponse.data || [])
      setSubmissions(assessmentResponse.data?.submissions || [])
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || 'Could not load your learner dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void Promise.resolve().then(loadDashboard) }, [])

  const sortedCourses = useMemo(() => [...courses].sort((a, b) => new Date(b.enrollment?.enrolledAt || 0) - new Date(a.enrollment?.enrolledAt || 0)), [courses])
  const activeCourse = sortedCourses.find((course) => course.progress < 100) || sortedCourses[0]
  const averageProgress = courses.length ? Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length) : number(analytics.completion)
  const assignments = useMemo(() => courses.flatMap((course) => getCourseAssignments(course).map((assignment) => ({ ...assignment, course }))), [courses])
  const enrolledIds = useMemo(() => new Set(courses.map((course) => course.id)), [courses])
  const recommended = useMemo(() => catalog.filter((course) => !enrolledIds.has(course.id)).slice(0, 4), [catalog, enrolledIds])
  const weekly = Array.isArray(analytics.weekly) && analytics.weekly.length ? analytics.weekly : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, hours: 0 }))
  const maxWeeklyHours = Math.max(1, ...weekly.map((day) => number(day.hours)))

  return (
    <section className="mx-auto w-full max-w-[1440px] space-y-6 pb-16">
      <header className="admin-panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.2em]">Learner dashboard</p>
            <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Welcome back, {user?.name || user?.fullName || 'learner'}.</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base">Continue your courses, review progress, complete assignments, and turn learning into verified achievement.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate(activeCourse ? `/player/${activeCourse.id}` : '/courses')}>{activeCourse ? 'Continue learning' : 'Find a course'} <ArrowRight size={16} /></Button>
            <Button variant="secondary" onClick={() => navigate('/courses')}><Compass size={16} /> Explore courses</Button>
          </div>
        </div>
      </header>

      {error ? <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p><Button variant="secondary" onClick={loadDashboard}><RefreshCw size={16} /> Retry</Button></div> : null}

      <DashboardSection eyebrow="Continue Learning" title="Your active courses" action={<Button variant="secondary" onClick={() => navigate('/courses')}>Browse courses</Button>}>
        <div className="grid gap-3">
          {loading ? <><CourseSkeleton /><CourseSkeleton /></> : sortedCourses.length ? sortedCourses.slice(0, 5).map((course) => <LearningCourseRow key={course.id} course={course} onContinue={() => navigate(`/player/${course.id}`)} onDetails={() => navigate(`/course/${course.id}`)} />) : <EmptyState icon={GraduationCap} title="No active courses" text="Enroll in a course and your learning queue will appear here." action="Explore courses" onAction={() => navigate('/courses')} />}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Learning Progress" title="Progress and study activity">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard icon={TrendingUp} label="Average progress" value={`${averageProgress}%`} detail={`${courses.length} enrolled course${courses.length === 1 ? '' : 's'}`} />
            <StatCard icon={Clock3} label="Study time" value={`${number(analytics.hoursStudied)}h`} detail="tracked learning time" />
            <StatCard icon={Target} label="Average assessment" value={`${number(analytics.quiz)}%`} detail="quiz performance" />
          </div>
          <div className="theme-subcard rounded-xl p-5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">This week</p>
            <div className="mt-5 grid gap-4">
              {weekly.map((day) => {
                const hours = number(day.hours)
                return <div key={day.day} className="grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] items-center gap-3"><span className="text-sm font-bold text-[var(--text-secondary)]">{day.day}</span><span className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]"><span className="block h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${hours ? Math.max(8, (hours / maxWeeklyHours) * 100) : 0}%` }} /></span><span className="text-right text-xs font-semibold text-[var(--text-muted)]">{hours}h</span></div>
              })}
            </div>
          </div>
        </div>
      </DashboardSection>

      <div className="grid items-stretch gap-6 xl:grid-cols-3">
        <DashboardSection eyebrow="Certificates" title="Verified achievements" compact>
          <FeatureMetric icon={Award} value={number(analytics.certificates)} text="earned certificates" action="View certificates" onAction={() => navigate('/certificates')} />
        </DashboardSection>
        <DashboardSection eyebrow="Assignments" title="Course work" compact>
          <FeatureMetric icon={CalendarCheck} value={assignments.length} text="available assignments" action="Review courses" onAction={() => navigate(activeCourse ? `/course/${activeCourse.id}/assessments` : '/courses')} />
        </DashboardSection>
        <DashboardSection eyebrow="Assessments" title="Submitted work" compact>
          <FeatureMetric icon={FileQuestion} value={submissions.length} text={`${submissions.filter((item) => String(item.status).toUpperCase() === 'PENDING').length} awaiting review`} action="Open assessments" onAction={() => navigate(activeCourse ? `/course/${activeCourse.id}/assessments` : '/questions')} />
        </DashboardSection>
      </div>

      <DashboardSection eyebrow="Learning Streak" title="Build a consistent learning rhythm">
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <div className="flex items-center gap-4 rounded-xl bg-[var(--color-warning-soft)] p-5"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--bg-elevated)] text-[var(--color-warning)]"><Flame size={28} /></span><span><strong className="block text-3xl text-[var(--text-primary)]">{number(analytics.streak)} days</strong><span className="text-sm text-[var(--text-secondary)]">current streak</span></span></div>
          <div className="theme-subcard rounded-xl p-5"><p className="font-semibold text-[var(--text-primary)]">{number(analytics.streak) ? 'Keep your momentum going' : 'Start your streak today'}</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Complete one lesson or practice activity today. Short, consistent sessions make course completion easier.</p><Button className="mt-4" onClick={() => navigate(activeCourse ? `/player/${activeCourse.id}` : '/courses')}>Learn now</Button></div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Recommended Courses" title="Your next learning opportunities" action={<Button variant="secondary" onClick={() => navigate('/courses')}>View catalog</Button>}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? Array.from({ length: 4 }).map((_, index) => <span key={index} className="skeleton h-48 rounded-xl" />) : recommended.length ? recommended.map((course) => <RecommendedCourse key={course.id} course={course} onOpen={() => navigate(`/course/${course.id}`)} />) : <div className="sm:col-span-2 xl:col-span-4"><EmptyState icon={BookOpenCheck} title="No recommendations yet" text="New published courses will appear here automatically." /></div>}
        </div>
      </DashboardSection>
    </section>
  )
}

function DashboardSection({ eyebrow, title, action, children, compact = false }) {
  return <section className={`admin-panel h-full ${compact ? 'p-5' : 'p-5 sm:p-6'}`}><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">{eyebrow}</p><h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{title}</h2></div>{action}</div>{children}</section>
}

function LearningCourseRow({ course, onContinue, onDetails }) {
  return <article className="theme-subcard grid gap-4 rounded-xl p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent-primary)]">{course.level || 'Beginner'}</span><span className="text-xs font-semibold text-[var(--text-muted)]">{course.category || 'Course'}</span></div><h3 className="mt-2 truncate font-bold text-[var(--text-primary)]">{course.title}</h3><div className="mt-3 flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-card)]"><span className="block h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${course.progress}%` }} /></span><span className="w-12 text-right text-xs font-bold text-[var(--text-secondary)]">{course.progress}%</span></div></div><div className="flex gap-2"><Button onClick={onContinue}>Continue</Button><Button variant="secondary" onClick={onDetails}>Details</Button></div></article>
}

function StatCard({ icon: Icon, label, value, detail }) {
  return <div className="theme-subcard flex items-center gap-4 rounded-xl p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={19} /></span><span><span className="block text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</span><strong className="mt-1 block text-2xl text-[var(--text-primary)]">{value}</strong><span className="text-xs text-[var(--text-secondary)]">{detail}</span></span></div>
}

function FeatureMetric({ icon: Icon, value, text, action, onAction }) {
  return <div><span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={21} /></span><p className="mt-5 text-3xl font-bold text-[var(--text-primary)]">{value}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{text}</p><Button variant="secondary" className="mt-5 w-full" onClick={onAction}>{action}</Button></div>
}

function RecommendedCourse({ course, onOpen }) {
  const assignments = getCourseAssignments(course).length
  return <button type="button" onClick={onOpen} className="theme-subcard theme-subcard-hover flex min-h-48 flex-col rounded-xl p-5 text-left"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-primary)]">{course.category || 'Learning path'}</span><h3 className="mt-3 line-clamp-2 font-bold text-[var(--text-primary)]">{course.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{course.description || 'Build practical skills with guided lessons and assessments.'}</p><span className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs font-semibold text-[var(--text-muted)]"><span>{course.level || 'Beginner'}</span><span>{assignments} assignments</span></span></button>
}

function EmptyState({ icon: Icon, title, text, action, onAction }) {
  return <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-7 text-center"><Icon className="mx-auto text-[var(--text-muted)]" size={30} /><p className="mt-3 font-bold text-[var(--text-primary)]">{title}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">{text}</p>{action ? <Button className="mt-5" onClick={onAction}>{action}</Button> : null}</div>
}

function CourseSkeleton() {
  return <div className="theme-subcard grid gap-3 rounded-xl p-4"><span className="skeleton h-5 w-2/3 rounded" /><span className="skeleton h-2 w-full rounded-full" /><span className="skeleton h-10 w-32 rounded-lg" /></div>
}
