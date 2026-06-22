import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import {
  Activity, Award, BadgeIndianRupee, BookOpenCheck, ClipboardCheck,
  CreditCard, FileBarChart2, GraduationCap, Search, UserPlus, Users,
} from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchAdminAssessmentSubmissions, fetchAdminOverview } from '../../api/api.js'
import {
  AdminEmptyState, AdminLoadingState, AdminMetricCard, AdminNotice,
  AdminPageHeader, AdminQuickAction,
} from '../../components/admin/AdminUI.jsx'
import { compactNumber, formatTrend, money, trendFromItems, trendFromSeries } from '../../utils/dashboardMetrics.js'

const zeroMetrics = {
  totalUsers: 0, totalLearners: 0, totalInstructors: 0, totalCourses: 0,
  publishedCourses: 0, totalCertificates: 0, totalEnrollments: 0,
  completedCourses: 0, pendingApprovals: 0, pendingPayments: 0,
  revenueCents: 0, activeProgress: 0, completionRate: 0, publishRate: 0,
  growth: [], popularCourses: [], categoryDemand: [], recentUsers: [], recentActivity: [],
}

const managementActions = [
  { label: 'Upload Course', description: 'Create and publish learning content', icon: BookOpenCheck, href: '/admin/upload-course', keywords: 'create course catalog publish' },
  { label: 'Add Learner', description: 'Create learner or intern access', icon: UserPlus, href: '/admin/add-learner', keywords: 'student intern user' },
  { label: 'Add Instructor', description: 'Onboard and assign an instructor', icon: GraduationCap, href: '/admin/add-instructor', keywords: 'teacher creator' },
  { label: 'Manage Users', description: 'Review accounts and approvals', icon: Users, href: '/admin/users', keywords: 'approvals learners instructors' },
  { label: 'Manage Courses', description: 'Edit catalog and publishing status', icon: BookOpenCheck, href: '/admin/courses', keywords: 'draft curriculum category' },
  { label: 'Evaluate Assessments', description: 'Review learner submissions', icon: ClipboardCheck, href: '/admin/evaluations', keywords: 'assignments submissions review' },
  { label: 'Payments', description: 'Review revenue and payment status', icon: CreditCard, href: '/admin/payments', keywords: 'pending paid finance' },
  { label: 'Certificates', description: 'Manage issued credentials', icon: Award, href: '/admin/certificates', keywords: 'generate credentials' },
  { label: 'Reports', description: 'Open detailed platform reporting', icon: FileBarChart2, href: '/admin/reports', keywords: 'analytics activity progress' },
]

const managementTones = ['blue', 'teal', 'orange', 'purple', 'pink', 'sky', 'amber', 'green']

function normalizeOverview(payload) {
  return { ...zeroMetrics, ...(payload?.analytics || {}) }
}

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date)
}

function activityCategory(item) {
  const action = String(item?.action || item?.entityType || '').toLowerCase()
  if (action.includes('user') || action.includes('instructor') || action.includes('learner')) return 'users'
  if (action.includes('course') || action.includes('category')) return 'courses'
  if (action.includes('payment') || action.includes('revenue')) return 'payments'
  return 'other'
}

function activityLabel(item) {
  return String(item?.action || item?.title || 'Platform activity')
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function hasData(rows, keys) {
  return rows.some((row) => keys.some((key) => Number(row?.[key] || 0) > 0))
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(zeroMetrics)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [range, setRange] = useState('30')
  const [chartMode, setChartMode] = useState('engagement')
  const [activityFilter, setActivityFilter] = useState('all')

  async function loadAdminData() {
    try {
      setError('')
      setLoading(true)
      const [overviewResponse, assessmentResponse] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminAssessmentSubmissions().catch(() => ({ data: { submissions: [] } })),
      ])
      setMetrics(normalizeOverview(overviewResponse.data))
      setSubmissions(assessmentResponse.data?.submissions || [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load admin dashboard.')
      setMetrics(zeroMetrics)
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(() => void loadAdminData(), 0)
    const timer = window.setInterval(loadAdminData, 30000)
    return () => { window.clearTimeout(initial); window.clearInterval(timer) }
  }, [])

  const assignmentCount = useMemo(() => new Set(submissions.map((item) => item.assignmentId).filter(Boolean)).size, [submissions])
  const usersTrend = useMemo(() => formatTrend(trendFromSeries(metrics.growth, 'registrations')), [metrics.growth])
  const studentsTrend = useMemo(() => formatTrend(trendFromSeries(metrics.growth, 'enrollments')), [metrics.growth])
  const instructorsTrend = useMemo(() => formatTrend(trendFromSeries(metrics.growth, 'userCreations')), [metrics.growth])
  const coursesTrend = useMemo(() => formatTrend(trendFromSeries(metrics.growth, 'completions')), [metrics.growth])
  const revenueTrend = useMemo(() => formatTrend(trendFromSeries(metrics.growth, 'revenueCents')), [metrics.growth])
  const certificatesTrend = useMemo(() => formatTrend(trendFromSeries(metrics.growth, 'completions')), [metrics.growth])
  const assignmentsTrend = useMemo(() => formatTrend(trendFromItems(submissions, 'submittedAt', 7, (item) => item.assignmentId ? 1 : 0)), [submissions])
  const assessmentsTrend = useMemo(() => formatTrend(trendFromItems(submissions, 'submittedAt', 7)), [submissions])

  const kpis = useMemo(() => [
    { label: 'Users', value: compactNumber(metrics.totalUsers), detail: 'all platform accounts', trend: usersTrend, icon: Users, href: '/admin/users', tone: 'blue' },
    { label: 'Students', value: compactNumber(metrics.totalLearners), detail: 'registered learners', trend: studentsTrend, icon: GraduationCap, href: '/admin/learners', tone: 'teal' },
    { label: 'Instructors', value: compactNumber(metrics.totalInstructors), detail: 'teaching accounts', trend: instructorsTrend, icon: Users, href: '/admin/instructors', tone: 'orange' },
    { label: 'Courses', value: compactNumber(metrics.totalCourses), detail: `${metrics.publishRate}% published`, trend: coursesTrend, icon: BookOpenCheck, href: '/admin/courses', tone: 'purple' },
    { label: 'Revenue', value: money(metrics.revenueCents), detail: 'confirmed payments', trend: revenueTrend, icon: BadgeIndianRupee, href: '/admin/revenue', tone: 'pink' },
    { label: 'Certificates', value: compactNumber(metrics.totalCertificates), detail: 'issued credentials', trend: certificatesTrend, icon: Award, href: '/admin/certificates', tone: 'sky' },
    { label: 'Assignments', value: compactNumber(assignmentCount), detail: 'unique assigned assessments', trend: assignmentsTrend, icon: ClipboardCheck, href: '/admin/evaluations', tone: 'amber' },
    { label: 'Assessments', value: compactNumber(submissions.length), detail: 'learner submissions', trend: assessmentsTrend, icon: FileBarChart2, href: '/admin/evaluations', tone: 'green' },
  ], [assignmentCount, assessmentsTrend, certificatesTrend, coursesTrend, instructorsTrend, metrics.publishRate, metrics.revenueCents, metrics.totalCertificates, metrics.totalCourses, metrics.totalInstructors, metrics.totalLearners, metrics.totalUsers, revenueTrend, studentsTrend, submissions.length, usersTrend, assignmentsTrend])

  const chartData = useMemo(() => metrics.growth.slice(-Number(range)), [metrics.growth, range])
  const courseResults = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return metrics.popularCourses.filter((course) => !needle || `${course.title} ${course.category}`.toLowerCase().includes(needle))
  }, [metrics.popularCourses, searchQuery])
  const actionResults = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    return managementActions.filter((item) => !needle || `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(needle))
  }, [searchQuery])
  const activityResults = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    const activity = metrics.recentActivity.length
      ? metrics.recentActivity
      : metrics.recentUsers.map((user) => ({ ...user, action: 'user registered', createdAt: user.createdAt, user }))
    return activity.filter((item) => {
      const categoryMatches = activityFilter === 'all' || activityCategory(item) === activityFilter
      const text = `${activityLabel(item)} ${item.user?.name || item.name || ''} ${item.user?.email || item.email || ''}`.toLowerCase()
      return categoryMatches && (!needle || text.includes(needle))
    })
  }, [activityFilter, metrics.recentActivity, metrics.recentUsers, searchQuery])

  const attention = [
    { label: 'Pending approvals', value: metrics.pendingApprovals, detail: 'Accounts waiting for a decision', href: '/admin/users' },
    { label: 'Pending payments', value: metrics.pendingPayments, detail: 'Transactions requiring review', href: '/admin/payments' },
    { label: 'Draft courses', value: Math.max(0, metrics.totalCourses - metrics.publishedCourses), detail: 'Courses not yet published', href: '/admin/courses' },
  ].filter((item) => item.value > 0)

  const chartHasData = chartMode === 'revenue'
    ? hasData(chartData, ['revenueCents'])
    : hasData(chartData, ['registrations', 'enrollments', 'completions'])

  return (
      <section className="admin-dashboard-v2 space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Admin workspace"
        title="Learning operations overview"
        description="Monitor platform performance and move directly into the management workflows that need attention. Data refreshes every 30 seconds."
        actions={(
          <>
            <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 text-sm font-semibold text-[var(--text-secondary)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" /> Live data
            </span>
            <Button variant="secondary" onClick={loadAdminData} loading={loading} loadingLabel="Refreshing...">Refresh</Button>
          </>
        )}
      />
      <AdminNotice type="error">{error}</AdminNotice>

      <div className="admin-panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] px-3 text-[var(--text-muted)] sm:max-w-xl">
          <Search size={17} aria-hidden="true" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--input-text)] outline-none" placeholder="Search activity, courses, or management tools" aria-label="Search dashboard" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
          Reporting range
          <select value={range} onChange={(event) => setRange(event.target.value)} className="admin-input min-h-11 w-32 py-2" aria-label="Reporting range">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
      </div>

      <DashboardSection eyebrow="KPI section" title="Platform performance" description="Eight core indicators for LMS operations.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => <AdminMetricCard key={item.label} {...item} loading={loading} onClick={() => navigate(item.href)} />)}
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Analytics section" title="Learning and revenue analytics" description="Compare engagement trends and identify high-demand courses.">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.75fr)]">
          <div className="theme-subcard rounded-xl p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">{chartMode === 'revenue' ? 'Paid revenue' : 'Learning engagement'}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Last {range} days</p>
              </div>
              <select value={chartMode} onChange={(event) => setChartMode(event.target.value)} className="admin-input min-h-11 w-full py-2 sm:w-48" aria-label="Analytics metric">
                <option value="engagement">Engagement</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>
            <div className="mt-5 h-72">
              {loading ? <AdminLoadingState label="Loading analytics..." /> : chartHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'revenue' ? (
                    <BarChart data={chartData}>
                      <ChartFrame />
                      <Tooltip content={<ChartTooltip formatter={(value) => money(value)} />} />
                      <Bar dataKey="revenueCents" name="Paid revenue" fill="var(--color-action)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData}>
                      <ChartFrame />
                      <Tooltip content={<ChartTooltip />} />
                      <Line type="monotone" dataKey="registrations" name="Registrations" stroke="var(--color-info)" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="var(--color-action)" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="completions" name="Completions" stroke="var(--color-success)" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : <AdminEmptyState title="No analytics for this period" message="Activity will appear as learners register, enroll, complete courses, or make payments." />}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Ratio label="Enrollments" value={compactNumber(metrics.totalEnrollments)} />
              <Ratio label="Completion rate" value={`${metrics.completionRate}%`} />
              <Ratio label="Published catalog" value={`${metrics.publishRate}%`} />
            </div>
          </div>

          <div className="theme-subcard rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><h3 className="font-semibold text-[var(--text-primary)]">Course demand</h3><p className="mt-1 text-sm text-[var(--text-muted)]">Ranked by enrollments</p></div>
              <button type="button" onClick={() => navigate('/admin/courses')} className="text-sm font-semibold text-[var(--accent-primary)]">View all</button>
            </div>
            <div className="mt-5 grid gap-2">
              {loading ? Array.from({ length: 5 }).map((_, index) => <span key={index} className="skeleton h-16 rounded-lg" />) : courseResults.length ? courseResults.slice(0, 5).map((course, index) => (
                <button key={course.id} type="button" onClick={() => navigate('/admin/courses')} className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] p-3 text-left transition hover:bg-[var(--bg-subtle)]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-primary)]">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{course.title}</span><span className="block truncate text-xs text-[var(--text-muted)]">{course.category || 'Uncategorized'}</span></span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{course.enrollments}</span>
                </button>
              )) : <AdminEmptyState title={searchQuery ? 'No matching courses' : 'No enrollment data'} message={searchQuery ? 'Try a different dashboard search.' : 'Course demand appears after learners enroll.'} />}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Activity section" title="Recent activity and attention" description="A focused operational feed with only actionable exceptions.">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
          <div className="theme-subcard rounded-xl p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold text-[var(--text-primary)]">Recent platform activity</h3>
              <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)} className="admin-input min-h-11 w-full py-2 sm:w-44" aria-label="Activity type">
                <option value="all">All activity</option><option value="users">Users</option><option value="courses">Courses</option><option value="payments">Payments</option>
              </select>
            </div>
            <div className="mt-4 grid gap-2">
              {loading ? Array.from({ length: 5 }).map((_, index) => <span key={index} className="skeleton h-16 rounded-lg" />) : activityResults.length ? activityResults.slice(0, 7).map((item, index) => (
                <ActivityRow key={item.id || `${item.action}-${index}`} item={item} />
              )) : <AdminEmptyState title="No matching activity" message="Try another filter or clear the dashboard search." />}
            </div>
          </div>
          <div className="theme-subcard rounded-xl p-4 sm:p-5">
            <h3 className="font-semibold text-[var(--text-primary)]">Needs attention</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Outstanding operational work</p>
            <div className="mt-4 grid gap-3">
              {loading ? Array.from({ length: 3 }).map((_, index) => <span key={index} className="skeleton h-24 rounded-lg" />) : attention.length ? attention.map((item) => (
                <button key={item.label} type="button" onClick={() => navigate(item.href)} className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] p-4 text-left transition hover:-translate-y-0.5">
                  <span className="flex items-start justify-between gap-4"><span><span className="block text-sm font-semibold text-[var(--text-primary)]">{item.label}</span><span className="mt-1 block text-xs text-[var(--text-secondary)]">{item.detail}</span></span><strong className="text-xl text-[var(--color-warning)]">{item.value}</strong></span>
                </button>
              )) : <AdminEmptyState title="Nothing needs attention" message="Approvals, payments, and publishing queues are clear." />}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection eyebrow="Management section" title="Administration tools" description="All management actions, organized in one searchable workspace.">
        {actionResults.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {actionResults.map((item, index) => (
              <AdminQuickAction
                key={item.href}
                icon={item.icon}
                label={item.label}
                description={item.description}
                tone={managementTones[index % managementTones.length]}
                onClick={() => navigate(item.href)}
              />
            ))}
          </div>
        ) : <AdminEmptyState title="No management tools found" message="Try a broader search term such as users, courses, or reports." actionLabel="Clear search" onAction={() => setSearchQuery('')} />}
      </DashboardSection>
    </section>
  )
}

function DashboardSection({ eyebrow, title, description, children }) {
  return (
    <section className="admin-panel p-4 sm:p-6" aria-labelledby={`section-${eyebrow.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="mb-5"><p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</p><h2 id={`section-${eyebrow.replace(/\s+/g, '-').toLowerCase()}`} className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{title}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p></div>
      {children}
    </section>
  )
}

function Ratio({ label, value }) {
  return <div className="rounded-lg bg-[var(--bg-subtle)] p-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p><p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{value}</p></div>
}

function ActivityRow({ item }) {
  const actor = item.user?.name || item.user?.fullName || item.user?.email || item.name || item.email || 'System'
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[var(--border-color)] p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Activity size={16} /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{activityLabel(item)}</span><span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{actor}</span></span>
      <span className="shrink-0 text-xs text-[var(--text-muted)]">{formatDate(item.createdAt)}</span>
    </div>
  )
}

function ChartFrame() {
  return <><CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" /><XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} minTickGap={24} /><YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} allowDecimals={false} /></>
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-3 text-sm shadow-[var(--shadow-lg)]">
      <p className="mb-2 font-semibold text-[var(--text-primary)]">{label}</p>
      {payload.map((item) => <p key={item.dataKey} className="flex items-center justify-between gap-6 text-[var(--text-secondary)]"><span>{item.name}</span><strong className="text-[var(--text-primary)]">{formatter ? formatter(item.value) : item.value}</strong></p>)}
    </div>
  )
}
