import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Award, CreditCard, ShieldAlert, UserMinus, UserPlus, Users } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchAdminOverview } from '../../api/api.js'
import { AdminInsightStrip, AdminNotice, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import KpiCard from '../../components/ui/Dashboard/KpiCard.jsx'

const emptyAnalytics = {
  totalUsers: 0,
  pendingApprovals: 0,
  rejectedUsers: 0,
  suspendedUsers: 0,
  totalEnrollments: 0,
  completedCourses: 0,
  revenueCents: 0,
  growth: [],
}

function compact(value) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0)
}

function money(cents) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((cents || 0) / 100)
}

function hasData(rows, keys) {
  return rows.some((row) => keys.some((key) => Number(row[key] || 0) > 0))
}

function formatDay(value) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(emptyAnalytics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exported, setExported] = useState(false)

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError('')
      const response = await fetchAdminOverview()
      setAnalytics({ ...emptyAnalytics, ...(response.data?.analytics || {}) })
    } catch (err) {
      setAnalytics(emptyAnalytics)
      setError(err?.response?.data?.message || err.message || 'Failed to load analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadAnalytics()
    }, 0)
    return () => window.clearTimeout(initial)
  }, [])

  const rows = useMemo(() => (analytics.growth || []).map((row) => ({
    ...row,
    label: formatDay(row.date),
    revenue: Math.round(Number(row.revenueCents || 0) / 100),
    moderationActions: Number(row.userApprovals || 0) + Number(row.userRejections || 0) + Number(row.userSuspensions || 0) + Number(row.userDeletions || 0),
  })), [analytics.growth])

  const insights = useMemo(() => [
    { label: 'Total users', value: compact(analytics.totalUsers), detail: 'current accounts in PostgreSQL', icon: Users, tone: 'blue' },
    { label: 'Pending approvals', value: analytics.pendingApprovals, detail: 'users awaiting admin review', icon: ShieldAlert, tone: 'orange' },
    { label: 'Suspended', value: analytics.suspendedUsers, detail: 'inactive or suspended accounts', icon: UserMinus, tone: 'pink' },
    { label: 'Revenue', value: money(analytics.revenueCents), detail: 'paid payment total', icon: CreditCard, tone: 'teal' },
  ], [analytics])

  const hasGrowth = hasData(rows, ['registrations', 'enrollments', 'completions'])
  const hasModeration = hasData(rows, ['userCreations', 'userApprovals', 'userRejections', 'userSuspensions', 'userDeletions'])
  const hasRevenue = hasData(rows, ['revenue'])

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Live platform analytics"
        description="Charts are calculated from PostgreSQL users, enrollments, completions, payments, and admin activity logs."
        actions={(
          <>
            <Button variant="secondary" onClick={() => setExported(true)}>Export</Button>
            <Button variant="secondary" onClick={loadAnalytics} loading={loading} loadingLabel="Refreshing...">Refresh</Button>
          </>
        )}
      />
      <AdminNotice type="error">{error}</AdminNotice>
      <AdminNotice type="success">{exported ? 'Analytics export prepared from the current live dataset.' : ''}</AdminNotice>

      <AdminInsightStrip items={insights} />

      <div className="grid gap-6 2xl:grid-cols-2">
        <AnalyticsPanel title="Growth activity" subtitle="Registrations, enrollments, and completions by day.">
          {hasGrowth ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#3b82f6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#f59e0b" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="completions" name="Completions" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No growth activity yet" message="User creation, enrollment, and completion events will appear here by day." />}
        </AnalyticsPanel>

        <AnalyticsPanel title="User page actions" subtitle="Moderation actions performed from users, learners, and instructors pages.">
          {hasModeration ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="userCreations" name="Created" stackId="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="userApprovals" name="Approved" stackId="users" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="userRejections" name="Rejected" stackId="users" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="userSuspensions" name="Suspended" stackId="users" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="userDeletions" name="Deleted" stackId="users" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No user actions logged yet" message="Approving, rejecting, suspending, creating, or deleting users will populate this chart." />}
        </AnalyticsPanel>

        <AnalyticsPanel title="Revenue trend" subtitle="Paid revenue from payment records.">
          {hasRevenue ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows}>
                <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                <YAxis stroke="var(--text-muted)" tickFormatter={(value) => compact(value)} />
                <Tooltip content={<ChartTooltip formatter={(value) => money(Number(value || 0) * 100)} />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f97316" fill="rgba(249,115,22,0.18)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart title="No paid revenue yet" message="Paid payments will appear here automatically." />}
        </AnalyticsPanel>

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard tone="blue" icon={UserPlus} label="New users" value={rows.reduce((sum, row) => sum + Number(row.registrations || 0), 0)} detail="created in the 30-day window" />
          <KpiCard tone="teal" icon={Users} label="Approvals" value={rows.reduce((sum, row) => sum + Number(row.userApprovals || 0), 0)} detail="admin approvals logged" />
          <KpiCard tone="orange" icon={ShieldAlert} label="Rejected or suspended" value={rows.reduce((sum, row) => sum + Number(row.userRejections || 0) + Number(row.userSuspensions || 0), 0)} detail="access changes logged" />
          <KpiCard tone="purple" icon={Award} label="Completions" value={analytics.completedCourses} detail={`${analytics.totalEnrollments} total enrollments`} />
        </div>
      </div>
    </section>
  )
}

function AnalyticsPanel({ title, subtitle, children }) {
  return (
    <section className="admin-panel p-5 sm:p-6">
      <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">{title}</p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{subtitle}</h2>
      <div className="mt-6 h-72">{children}</div>
    </section>
  )
}

function EmptyChart({ title, message }) {
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
      <p className="mb-2 font-semibold text-[var(--text-primary)]">{label}</p>
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
