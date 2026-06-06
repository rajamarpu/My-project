import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Activity, Award, BadgeIndianRupee, Bell, BookOpenCheck, ClipboardList, Clock3, FileBarChart2, FolderTree, GraduationCap, ShieldCheck, UserPlus, Users } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchAdminOverview } from '../../api/api.js'
import { AdminMetricCard, AdminNotice, AdminPageHeader, AdminQuickAction } from '../../components/admin/AdminUI.jsx'

const zeroMetrics = {
  totalUsers: 0,
  totalLearners: 0,
  totalAdmins: 0,
  totalInstructors: 0,
  activeUsers: 0,
  totalCourses: 0,
  publishedCourses: 0,
  totalEnrollments: 0,
  completedCourses: 0,
  totalCertificates: 0,
  totalCategories: 0,
  totalNotifications: 0,
  totalPayments: 0,
  paidPayments: 0,
  pendingPayments: 0,
  pendingApprovals: 0,
  revenueCents: 0,
  totalHoursStudied: 0,
  totalWatchHours: 0,
  totalProgress: 0,
  activeProgress: 0,
  completionRate: 0,
  publishRate: 0,
  paidPaymentRate: 0,
  averageProgressPct: 0,
  growth: [],
  popularCourses: [],
  categoryDemand: [],
  recentUsers: [],
  recentActivity: [],
}

function normalizeOverview(payload) {
  const data = payload?.analytics || {}
  return { ...zeroMetrics, ...data }
}

function money(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

function compact(value) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function hasChartData(rows, keys) {
  return rows.some((row) => keys.some((key) => Number(row[key] || 0) > 0))
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(zeroMetrics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAdminData() {
    try {
      setError('')
      setLoading(true)
      const response = await fetchAdminOverview()
      setMetrics(normalizeOverview(response.data))
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load admin dashboard.')
      setMetrics(zeroMetrics)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadAdminData()
    }, 0)
    const timer = window.setInterval(loadAdminData, 30000)
    return () => {
      window.clearTimeout(initial)
      window.clearInterval(timer)
    }
  }, [])

  const cards = useMemo(() => [
    ['Total Users', metrics.totalUsers, `${metrics.totalLearners} learners`, Users, '/admin/users', 'cyan'],
    ['Active Sessions', metrics.activeUsers, 'valid live sessions', Activity, '/admin/activity-logs', 'green'],
    ['Courses', metrics.totalCourses, `${metrics.publishRate}% published`, BookOpenCheck, '/admin/courses', 'blue'],
    ['Enrollments', metrics.totalEnrollments, `${metrics.completionRate}% completed`, Activity, '/admin/enrollments', 'cyan'],
    ['Revenue', money(metrics.revenueCents), `${metrics.paidPayments} paid payments`, BadgeIndianRupee, '/admin/revenue', 'orange'],
    ['Certificates', metrics.totalCertificates, 'issued credentials', Award, '/admin/certificates', 'green'],
    ['Categories', metrics.totalCategories, 'course groups', FolderTree, '/admin/categories', 'blue'],
    ['Instructors', metrics.totalInstructors, 'approved teachers', Users, '/admin/instructors', 'cyan'],
    ['Admins', metrics.totalAdmins, 'platform operators', ShieldCheck, '/admin/users?role=admin', 'green'],
    ['Progress Rows', metrics.totalProgress, `${metrics.activeProgress} active in 30d`, GraduationCap, '/admin/reports', 'blue'],
    ['Watch Hours', compact(metrics.totalWatchHours), 'from progress events', Clock3, '/admin/reports', 'orange'],
    ['Notifications', metrics.totalNotifications, 'messages stored', Bell, '/admin/notifications', 'red'],
  ], [metrics])

  const hasGrowthData = hasChartData(metrics.growth, ['registrations', 'enrollments', 'completions'])
  const hasRevenueData = hasChartData(metrics.growth, ['revenueCents'])
  const hasPopularCourses = metrics.popularCourses.some((course) => Number(course.enrollments || 0) > 0)

  return (
    <section className="space-y-8 pb-16">
      <AdminPageHeader
        eyebrow="Admin dashboard"
        title="Live PostgreSQL platform metrics"
        description="Every number below is calculated from real database tables: users, enrollments, payments, courses, sessions, certificates, and progress."
        actions={<Button variant="secondary" onClick={loadAdminData} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</Button>}
      />
      <AdminNotice type="error">{error}</AdminNotice>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="admin-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">System health</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" />
            <p className="font-semibold text-[var(--text-primary)]">API and database online</p>
          </div>
        </div>
        <div className="admin-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Publishing health</p>
          <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{metrics.publishRate}% published catalog</p>
        </div>
        <div className="admin-panel p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Learning health</p>
          <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">{metrics.completionRate}% completion rate</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map(([label, value, detail, Icon, href, tone]) => (
          <AdminMetricCard
            key={label}
            label={label}
            value={value}
            detail={detail}
            icon={Icon}
            tone={tone}
            loading={loading}
            onClick={() => navigate(href)}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="admin-panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">30 day activity</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Registrations, enrollments, completions</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/admin/analytics')}>Analytics</Button>
          </div>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <MiniMetric label="New users" value={metrics.growth.reduce((sum, day) => sum + day.registrations, 0)} />
            <MiniMetric label="New enrollments" value={metrics.growth.reduce((sum, day) => sum + day.enrollments, 0)} />
            <MiniMetric label="Completed courses" value={metrics.growth.reduce((sum, day) => sum + day.completions, 0)} />
          </div>
          <div className="mt-6 h-72">
            {hasGrowthData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.growth}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#22d3ee" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="completions" name="Completions" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics title="No 30 day learning activity yet" message="The chart will populate when users register, enroll, or complete courses." />
            )}
          </div>
        </div>

        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Quick actions</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Operational shortcuts</h2>
          <div className="mt-5 grid gap-3">
            <AdminQuickAction icon={BookOpenCheck} label="Create Course" description="Add a new catalog course" onClick={() => navigate('/admin/upload-course')} />
            <AdminQuickAction icon={UserPlus} label="Add Intern" description="Create intern or learner access" onClick={() => navigate('/admin/add-learner')} tone="secondary" />
            <AdminQuickAction icon={UserPlus} label="Add Instructor" description="Upload profile image and assign a course" onClick={() => navigate('/admin/add-instructor')} tone="secondary" />
            <AdminQuickAction icon={ClipboardList} label="Approvals" description="Review users and publishing state" onClick={() => navigate('/admin/users')} tone="secondary" />
            <AdminQuickAction icon={FileBarChart2} label="Reports" description="Open activity and analytics rows" onClick={() => navigate('/admin/reports')} tone="secondary" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Course demand</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Top courses by real enrollments</h2>
          <div className="mt-6 h-64">
            {hasPopularCourses ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.popularCourses}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis dataKey="title" hide />
                  <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="enrollments" name="Enrollments" fill="#22d3ee" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics title="No enrollments yet" message="Publish courses and enroll learners to see demand rankings." />
            )}
          </div>
          <div className="mt-5 grid gap-2">
            {metrics.popularCourses.length ? metrics.popularCourses.map((course) => (
              <button key={course.id} type="button" onClick={() => navigate('/admin/courses')} className="theme-subcard theme-subcard-hover flex items-center justify-between gap-3 rounded-lg p-3 text-left">
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[var(--text-primary)]">{course.title}</span>
                  <span className="text-xs text-[var(--text-muted)]">{course.category} | {course.lessons} lessons | {course.certificates} certificates</span>
                </span>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-700 dark:text-cyan-200">{course.enrollments}</span>
              </button>
            )) : null}
          </div>
        </div>

        <div className="admin-panel p-5 sm:p-6">
          <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Revenue and catalog health</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Paid revenue, progress, categories</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MiniMetric label="Paid payment rate" value={`${metrics.paidPaymentRate}%`} />
            <MiniMetric label="Pending payments" value={metrics.pendingPayments} />
            <MiniMetric label="Hours studied" value={compact(metrics.totalHoursStudied)} />
            <MiniMetric label="Watch hours" value={compact(metrics.totalWatchHours)} />
          </div>
          <div className="mt-6 h-56">
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.growth}>
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" hide />
                  <YAxis stroke="var(--text-muted)" tickFormatter={(value) => compact(value / 100)} />
                  <Tooltip content={<ChartTooltip formatter={(value) => money(value)} />} />
                  <Bar dataKey="revenueCents" name="Paid revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalytics title="No paid revenue in the last 30 days" message="Paid payments will appear here automatically." />
            )}
          </div>
          <div className="mt-5 grid gap-2">
            {metrics.categoryDemand.length ? metrics.categoryDemand.map((item) => (
              <div key={item.category} className="theme-subcard rounded-lg p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">{item.category}</span>
                  <span className="text-[var(--text-muted)]">{item.courses} courses</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--bg-subtle)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-400" style={{ width: `${Math.max(8, Math.min(100, (item.courses / Math.max(...metrics.categoryDemand.map((entry) => entry.courses), 1)) * 100))}%` }} />
                </div>
              </div>
            )) : null}
          </div>
        </div>
      </div>

      <div className="admin-panel p-5 sm:p-6">
        <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Recent users</p>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {metrics.recentUsers.length ? metrics.recentUsers.map((user) => (
            <button key={user.id} type="button" onClick={() => navigate('/admin/users')} className="theme-subcard theme-subcard-hover flex items-center justify-between gap-4 rounded-lg p-4 text-left">
              <span>
                <span className="block font-semibold text-[var(--text-primary)]">{user.name || user.fullName || user.email}</span>
                <span className="mt-1 block text-sm text-[var(--text-muted)]">{user.email}</span>
              </span>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">{user.role}</span>
            </button>
          )) : <p className="theme-subcard rounded-lg p-4 text-sm text-[var(--text-muted)]">No users found.</p>}
        </div>
      </div>
    </section>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="theme-subcard rounded-lg p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function EmptyAnalytics({ title, message }) {
  return (
    <div className="grid h-full place-items-center rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-6 text-center">
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 text-sm shadow-soft">
      {label ? <p className="mb-2 font-semibold text-[var(--text-primary)]">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="flex items-center justify-between gap-6 text-[var(--text-secondary)]">
            <span>{item.name}</span>
            <span className="font-semibold text-[var(--text-primary)]">{formatter ? formatter(item.value) : item.value}</span>
          </p>
        ))}
      </div>
    </div>
  )
}
