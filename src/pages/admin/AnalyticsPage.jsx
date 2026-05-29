import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import Button from '../../components/common/Button/Button.jsx'
import { useState } from 'react'

const analytics = [
  { week: 'W1', revenue: 24, completion: 82 },
  { week: 'W2', revenue: 30, completion: 88 },
  { week: 'W3', revenue: 42, completion: 91 },
  { week: 'W4', revenue: 38, completion: 94 },
]

export default function AnalyticsPage() {
  const [exported, setExported] = useState(false)

  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Analytics</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">Course performance insights</h1>
        <p className="mt-4 text-[var(--text-secondary)]">Revenue, completion rates, and student engagement metrics for your upskilling lecture series.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-8 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Revenue analytics</h2>
            <Button variant="secondary" onClick={() => setExported(true)}>Export</Button>
          </div>
          {exported ? <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">Analytics export prepared for download.</p> : null}
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics}>
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Course completion</h2>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics}>
                <XAxis dataKey="week" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="completion" stroke="#22d3ee" fill="rgba(34, 211, 238, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}


