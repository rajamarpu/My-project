import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight, Award, BookOpenCheck, CalendarCheck, Clock3,
  Compass, FileQuestion, Flame, GraduationCap, RefreshCw, Target, TrendingUp,
} from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import KpiCard from '../../components/ui/Dashboard/KpiCard.jsx'
import { fetchCourses, fetchLearnerDashboard, fetchMyAssessmentSubmissions, fetchUserAnalytics } from '../../api/api.js'
import { getCourseAssignments } from '../../utils/courseContent.js'
import { compactNumber, formatTrend, trendFromItems } from '../../utils/dashboardMetrics.js'

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
  const [certificates, setCertificates] = useState([])
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
      const issuedCertificates = dashboardResponse.data?.dashboard?.certificates || []
      setCourses(enrollments.map((enrollment) => ({ ...enrollment.course, enrollment, progress: progressFor(enrollment), isEnrolled: true })).filter((course) => course.id))
      setAnalytics({ ...emptyAnalytics, ...(analyticsResponse.data?.analytics || {}) })
      setCatalog(catalogResponse.data?.courses || catalogResponse.data || [])
      setSubmissions(assessmentResponse.data?.submissions || [])
      setCertificates(issuedCertificates)
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
  const completedCourses = courses.filter((course) => progressFor(course.enrollment) >= 100).length
  const inProgressCourses = Math.max(0, courses.length - completedCourses)
  const enrollmentItems = courses.map((course) => course.enrollment).filter(Boolean)
  const completedEnrollmentItems = enrollmentItems.filter((item) => Number(item?.completionPct || 0) >= 100)
  const activeEnrollmentItems = enrollmentItems.filter((item) => Number(item?.completionPct || 0) > 0 && Number(item?.completionPct || 0) < 100)
  const quizItems = Array.isArray(analytics.recent) ? analytics.recent.filter((item) => item.quizScore !== undefined && item.quizScore !== null) : []
  const activeCoursesTrend = formatTrend(trendFromItems(enrollmentItems, 'enrolledAt'))
  const completedCoursesTrend = formatTrend(trendFromItems(completedEnrollmentItems, 'completedAt'))
  const inProgressTrend = formatTrend(trendFromItems(activeEnrollmentItems, 'enrolledAt'))
  const certificatesTrend = formatTrend(trendFromItems(certificates, 'issuedAt'))
  const quizTrend = formatTrend(trendFromItems(quizItems, 'lastAccessedAt', 7, (item) => Number(item.quizScore || 0)))
  const streakTrend = formatTrend(number(analytics.streak) ? Math.min(45, Math.max(8, Math.round(number(analytics.streak) * 2.5))) : 0)
  const assignmentsTrend = formatTrend(trendFromItems(submissions, 'submittedAt'))
  const hoursTrend = formatTrend(trendFromItems(Array.isArray(analytics.recent) ? analytics.recent : [], 'lastAccessedAt', 7, (item) => Number(item.watchedSeconds || 0) / 3600))
  const latestSubmissionCourseId = useMemo(() => {
    const latestSubmission = submissions[0]
    return latestSubmission?.course?.id || latestSubmission?.courseId || ''
  }, [submissions])
  const latestSubmissionCourseAssessmentsHref = latestSubmissionCourseId ? `/course/${latestSubmissionCourseId}/assessments` : '/questions'
  const activeCoursePlayerHref = activeCourse ? `/player/${activeCourse.id}` : '/courses'
  const activeCourseAssessmentsHref = activeCourse ? `/course/${activeCourse.id}/assessments` : latestSubmissionCourseAssessmentsHref

  const kpis = useMemo(() => [
    { label: 'Active Courses', value: compactNumber(courses.length), detail: 'courses in your study queue', trend: activeCoursesTrend, icon: BookOpenCheck, tone: 'blue', href: '/courses' },
    { label: 'Completed Courses', value: compactNumber(completedCourses), detail: 'finished with verified progress', trend: completedCoursesTrend, icon: GraduationCap, tone: 'teal', href: '/certificates' },
    { label: 'In Progress', value: compactNumber(inProgressCourses), detail: 'currently being worked on', trend: inProgressTrend, icon: Target, tone: 'orange', href: activeCoursePlayerHref },
    { label: 'Certificates Earned', value: compactNumber(certificates.length), detail: 'downloadable achievements', trend: certificatesTrend, icon: Award, tone: 'purple', href: '/certificates' },
    { label: 'Quiz Score', value: `${number(analytics.quiz)}%`, detail: 'average assessment accuracy', trend: quizTrend, icon: FileQuestion, tone: 'pink', href: activeCourseAssessmentsHref },
    { label: 'Study Streak', value: `${number(analytics.streak)}d`, detail: 'days of continuous learning', trend: streakTrend, icon: Flame, tone: 'sky', href: activeCoursePlayerHref },
    { label: 'Assignments Submitted', value: compactNumber(submissions.length), detail: 'assessment submissions sent', trend: assignmentsTrend, icon: CalendarCheck, tone: 'amber', href: latestSubmissionCourseAssessmentsHref },
    { label: 'Hours Learned', value: `${number(analytics.hoursStudied).toFixed(1)}h`, detail: 'tracked learning time', trend: hoursTrend, icon: Clock3, tone: 'green', href: '/courses' },
  ], [activeCourseAssessmentsHref, activeCoursePlayerHref, activeCoursesTrend, assignmentsTrend, certificatesTrend, completedCourses, completedCoursesTrend, courses.length, hoursTrend, inProgressCourses, latestSubmissionCourseAssessmentsHref, quizTrend, streakTrend, submissions.length, inProgressTrend])

  return (
    <section className="learner-dashboard-v2 mx-auto w-full max-w-[1440px] space-y-6 pb-16">
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

      <section className="admin-panel p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">KPI section</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">Learning performance snapshot</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Eight learner metrics with color-rich cards that stay visible in both themes.</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Updated from live learner analytics</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => <KpiCard key={item.label} {...item} loading={loading} onClick={() => navigate(item.href)} />)}
        </div>
      </section>

      {error ? <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-[var(--color-danger)]">{error}</p><Button variant="secondary" onClick={loadDashboard}><RefreshCw size={16} /> Retry</Button></div> : null}

      <DashboardSection eyebrow="Continue Learning" title="Your active courses" action={<Button variant="secondary" onClick={() => navigate('/courses')}>Browse courses</Button>}>
        <div className="grid gap-3">
          {loading ? <><CourseSkeleton /><CourseSkeleton /></> : sortedCourses.length ? sortedCourses.slice(0, 5).map((course) => <LearningCourseRow key={course.id} course={course} onContinue={() => navigate(`/player/${course.id}`)} onDetails={() => navigate(`/course/${course.id}`)} />) : <EmptyState icon={GraduationCap} title="No active courses" text="Enroll in a course and your learning queue will appear here." action="Explore courses" onAction={() => navigate('/courses')} />}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Learning Progress" title="Progress and study activity">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <KpiCard tone="blue" icon={TrendingUp} label="Average progress" value={`${averageProgress}%`} detail={`${courses.length} enrolled course${courses.length === 1 ? '' : 's'}`} onClick={() => navigate('/reports')} />
            <KpiCard tone="teal" icon={Clock3} label="Study time" value={`${number(analytics.hoursStudied)}h`} detail="tracked learning time" onClick={() => navigate('/reports')} />
            <KpiCard tone="orange" icon={Target} label="Average assessment" value={`${number(analytics.quiz)}%`} detail="quiz performance" onClick={() => navigate(activeCourseAssessmentsHref)} />
          </div>
          <div className="grid gap-4">
            <div className="theme-subcard rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">This week</p>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">
                  {number(analytics.hoursStudied).toFixed(1)}h total
                </span>
              </div>
              <div className="mt-5 grid gap-9">
                {weekly.map((day) => {
                  const hours = number(day.hours)
                  const fillWidth = hours ? `${Math.max(10, (hours / maxWeeklyHours) * 100)}%` : '18px'
                  return <div key={day.day} className="grid min-h-11 grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] items-center gap-5 py-2"><span className="text-sm font-bold text-[var(--text-secondary)]">{day.day}</span><span className="h-3 overflow-hidden rounded-full bg-slate-200/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:bg-slate-700/80"><span className="block h-full rounded-full shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_6px_16px_rgba(59,130,246,0.22)]" style={{ width: fillWidth, backgroundImage: 'var(--brand-gradient)' }} /></span><span className="text-right text-xs font-semibold text-[var(--text-muted)]">{hours}h</span></div>
                })}
              </div>
            </div>
          </div>
        </div>
      </DashboardSection>

      <div className="grid items-stretch gap-6 xl:grid-cols-3">
        <DashboardSection eyebrow="Certificates" title="Verified achievements" compact>
          <KpiCard tone="purple" icon={Award} value={certificates.length} label="Certificates" detail="earned certificates" onClick={() => navigate('/certificates')} />
        </DashboardSection>
        <DashboardSection eyebrow="Assignments" title="Course work" compact>
          <KpiCard tone="amber" icon={CalendarCheck} value={assignments.length} label="Assignments" detail="available assignments" onClick={() => navigate(latestSubmissionCourseAssessmentsHref)} />
        </DashboardSection>
        <DashboardSection eyebrow="Assessments" title="Submitted work" compact>
          <KpiCard tone="pink" icon={FileQuestion} value={submissions.length} label="Assessments" detail={`${submissions.filter((item) => String(item.status).toUpperCase() === 'PENDING').length} awaiting review`} onClick={() => navigate(latestSubmissionCourseAssessmentsHref)} />
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
