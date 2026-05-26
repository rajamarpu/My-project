import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Activity, Award, BadgeIndianRupee, Bell, BookOpenCheck, Clock3, FolderTree, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import { fetchAdminOverview } from '../../api/api.js'

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
  pendingApprovals: 0,
  revenueCents: 0,
  growth: [],
  popularCourses: [],
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
    ['Total Users', metrics.totalUsers, Users, '/admin/users'],
    ['Learners', metrics.totalLearners, GraduationCap, '/admin/learners'],
    ['Admins', metrics.totalAdmins, ShieldCheck, '/admin/users?role=admin'],
    ['Instructors', metrics.totalInstructors, Users, '/admin/instructors'],
    ['Courses', metrics.totalCourses, BookOpenCheck, '/admin/courses'],
    ['Enrollments', metrics.totalEnrollments, Activity, '/admin/enrollments'],
    ['Certificates', metrics.totalCertificates, Award, '/admin/certificates'],
    ['Revenue', money(metrics.revenueCents), BadgeIndianRupee, '/admin/revenue'],
    ['Categories', metrics.totalCategories, FolderTree, '/admin/categories'],
    ['Active Users', metrics.activeUsers, Activity, '/admin/activity-logs'],
    ['Completed', metrics.completedCourses, BookOpenCheck, '/admin/reports'],
    ['Pending', metrics.pendingApprovals, Clock3, '/admin/courses?status=pending'],
    ['Notifications', metrics.totalNotifications, Bell, '/admin/notifications'],
  ], [metrics])

  return (
    <section className="space-y-8 pb-16">
      <div className="rounded-lg border border-white/10 bg-slate-950/80 p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Admin dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Live PostgreSQL platform metrics</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Every count below is fetched from Express APIs backed by Prisma and PostgreSQL. Empty tables show zero.
            </p>
          </div>
          <Button variant="secondary" onClick={loadAdminData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        {error ? <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map(([label, value, Icon, href]) => (
          <button
            type="button"
            key={label}
            onClick={() => navigate(href)}
            className="rounded-lg border border-white/10 bg-slate-950/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-300/10 text-cyan-100">
                <Icon size={18} />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold text-white">{loading ? '...' : value}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">30 day activity</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Registrations and enrollments</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/admin/analytics')}>Analytics</Button>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.growth}>
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="registrations" stroke="#22d3ee" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="enrollments" stroke="#f59e0b" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Quick actions</p>
          <div className="mt-5 grid gap-3">
            <Button onClick={() => navigate('/admin/upload-course')}>Upload Course</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/add-learner')}>Add Learner</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/courses')}>Manage Courses</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/certificates')}>Certificates</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Course demand</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Top courses by real enrollments</h2>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.popularCourses}>
                <XAxis dataKey="title" hide />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc' }} />
                <Bar dataKey="_count.enrollments" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Recent users</p>
          <div className="mt-5 grid gap-3">
            {metrics.recentUsers.length ? metrics.recentUsers.map((user) => (
              <button key={user.id} type="button" onClick={() => navigate('/admin/users')} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-slate-900/70 p-4 text-left">
                <span>
                  <span className="block font-semibold text-white">{user.name || user.fullName || user.email}</span>
                  <span className="mt-1 block text-sm text-slate-400">{user.email}</span>
                </span>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">{user.role}</span>
              </button>
            )) : <p className="rounded-lg border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-400">No users found.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
