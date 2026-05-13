import Button from '../../components/ui/Button.jsx'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const adminPermissions = [
  'Manage users and roles',
  'Approve and publish courses',
  'Review platform analytics',
  'Configure global settings',
  'Access instructor and learner dashboards',
]

export default function AdminDashboard() {
  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Admin control center</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Platform health at a glance</h1>
        <p className="mt-4 text-slate-300">Monitor users, revenues, course approvals, and live session activity in one premium dashboard.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          { label: 'Total Users', value: '18.4k' },
          { label: 'Active Learners', value: '7.3k' },
          { label: 'Revenue', value: '$1.2M' },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-3xl p-6 text-white shadow-soft">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
            <p className="mt-4 text-3xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="glass-card p-8 shadow-glow">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300">Monthly revenue</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Growth chart</h2>
            </div>
            <Button variant="secondary">View all</Button>
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ month: 'Jan', value: 80 }, { month: 'Feb', value: 95 }, { month: 'Mar', value: 110 }, { month: 'Apr', value: 128 }]}> 
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
              <div key={item} className="rounded-3xl bg-slate-900/80 p-4 text-sm">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4">
            <Button onClick={() => window.location.assign('/admin/review')}>Review pending courses</Button>
            <Button variant="secondary">Manage users</Button>
            <Button variant="secondary">Platform settings</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
