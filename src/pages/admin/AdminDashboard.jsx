import { useState, useEffect } from 'react'
import Button from '../../components/ui/Button.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useNavigate } from 'react-router-dom'
import { fetchAdminOverview } from '../../services/api'

const adminPermissions = [
  'Manage users and roles',
  'Approve and publish courses',
  'Review platform analytics',
  'Configure global settings',
  'Access instructor and learner dashboards',
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState({ users: { total: 0, students: 0, instructors: 0 }, courses: { total: 0, published: 0 } })
  const [loading, setLoading] = useState(true)

  async function loadAdminData() {
    try {
      setLoading(true)
      const response = await fetchAdminOverview()
      if (response.data.success) {
        setMetrics(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadAdminData)
  }, [])

  const chartData = [
    { month: 'Jan', value: 80 },
    { month: 'Feb', value: 95 },
    { month: 'Mar', value: 110 },
    { month: 'Apr', value: 128 },
  ]

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

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Total Users
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : metrics.users.total}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Students
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : metrics.users.students}
          </p>
        </div>
        <div className="glass-card rounded-3xl p-6 shadow-soft border border-white/10 bg-slate-950/30">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Courses
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-100">
            {loading ? '...' : metrics.courses.total}
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
              <LineChart data={chartData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={4} dot={false} />
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
    </section>
  )
}
