import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button.jsx'
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { fetchAdminOverview } from '../../services/api'
import { celebCourses } from '../../data/dummyData.js'
import { aiPersonalities } from '../../data/aiPersonalities.js'

const adminPermissions = [
  'Manage users and roles',
  'Approve and publish courses',
  'Review platform analytics',
  'Configure global settings',
  'Access instructor and learner dashboards',
]

const fallbackMetrics = {
  totalUsers: 128,
  activeUsers: 94,
  courses: celebCourses.length,
  enrollments: 312,
  messages: 1460,
  certificates: 58,
  growth: [
    { month: 'Jan', users: 32 },
    { month: 'Feb', users: 48 },
    { month: 'Mar', users: 76 },
    { month: 'Apr', users: 103 },
    { month: 'May', users: 128 },
  ],
  popularCourses: celebCourses.slice(0, 5).map((course, index) => ({
    id: course.id,
    title: course.title,
    category: course.category,
    _count: { enrollments: [42, 38, 35, 31, 27][index] },
  })),
  personalities: aiPersonalities.slice(0, 5).map((personality, index) => ({
    id: personality.id,
    name: personality.name,
    avatarUrl: personality.avatar,
    _count: { enrollments: [64, 59, 51, 46, 39][index] },
  })),
  recentUsers: [
    { id: 'u1', name: 'Aarav Mehta', email: 'aarav@example.com', role: 'learner' },
    { id: 'u2', name: 'Mira Shah', email: 'mira@example.com', role: 'learner' },
    { id: 'u3', name: 'Dev Iyer', email: 'dev@example.com', role: 'instructor' },
  ],
}

function normalizeOverview(payload) {
  const data = payload?.analytics || payload?.data || payload || {}
  const userTotal = data.totalUsers ?? data.users?.total ?? fallbackMetrics.totalUsers
  const courseTotal = data.courses?.total ?? data.courses ?? fallbackMetrics.courses
  const enrollments = data.enrollments ?? data.engagement?.totalEnrollments ?? fallbackMetrics.enrollments
  const completed = data.engagement?.completedCourses ?? Math.round(enrollments * 0.42)

  return {
    totalUsers: userTotal,
    activeUsers: data.activeUsers ?? Math.round(userTotal * 0.72),
    courses: courseTotal,
    publishedCourses: data.courses?.published ?? courseTotal,
    enrollments,
    completionRate: data.engagement?.completionRate ?? (enrollments ? Math.round((completed / enrollments) * 100) : 0),
    messages: data.messages ?? fallbackMetrics.messages,
    certificates: data.certificates ?? fallbackMetrics.certificates,
    growth: data.growth ?? fallbackMetrics.growth,
    popularCourses: data.popularCourses ?? fallbackMetrics.popularCourses,
    personalities: data.personalities ?? fallbackMetrics.personalities,
    recentUsers: data.recentUsers ?? fallbackMetrics.recentUsers,
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState(normalizeOverview(fallbackMetrics))
  const [loading, setLoading] = useState(true)

  async function loadAdminData() {
    try {
      setLoading(true)
      const response = await fetchAdminOverview()
      setMetrics(normalizeOverview(response.data))
    } catch (error) {
      console.error('Failed to load admin data:', error)
      setMetrics(normalizeOverview(fallbackMetrics))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadAdminData)
  }, [])

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Admin control center</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-100">
          Platform health at a glance
        </h1>
        <p className="mt-4 text-slate-300">
          Monitor users, revenues, course approvals, and live session activity in one premium dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Total Users
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : metrics.totalUsers}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Course Enrollments
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : metrics.enrollments}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Courses
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : metrics.courses}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Completion Rate
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : `${metrics.completionRate}%`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="glass-card p-8 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Monthly growth</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-100">
                User signups chart
              </h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/admin/reports')}>View all</Button>
          </div>

          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.growth}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Admin permissions</p>

          <div className="mt-6 grid gap-3 text-slate-300">
            {adminPermissions.map((item) => (
              <div
                key={item}
                className="rounded-3xl bg-slate-900/80 p-4 text-sm border border-white/5"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4">
            <Button onClick={() => navigate('/admin/create-course')}>Add new course</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/add-learner')}>Add new learner</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/manage-courses')}>Manage courses</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/manage-learners')}>Manage learners</Button>
            <Button variant="secondary" onClick={() => navigate('/admin/generate-certificate')}>Generate certificate</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-card p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Platform activity</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">Live operations</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['Active users', metrics.activeUsers],
              ['Certificates', metrics.certificates],
              ['Messages', metrics.messages],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-100">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.popularCourses}>
                <XAxis dataKey="title" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', color: '#f8fafc' }} />
                <Bar dataKey="_count.enrollments" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Recent users</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">Registered learners and staff</h2>
          <div className="mt-6 grid gap-3">
            {metrics.recentUsers.map((user) => (
              <div key={user.id || user.email} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div>
                  <p className="font-semibold text-slate-100">{user.name || user.fullName || user.email}</p>
                  <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                </div>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                  {user.role || 'learner'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
