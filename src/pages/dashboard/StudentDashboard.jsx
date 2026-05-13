import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { dashboardStats, celebrityCourses } from '../../data/dummyData.js'
import Button from '../../components/ui/Button.jsx'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../animations/variants.js'

const learnerPermissions = [
  'Browse celebrity and technical courses',
  'Enroll in learning paths and save favorites',
  'Access community discussions and certificates',
  'Track weekly progress and daily streaks',
]

export default function StudentDashboard() {
  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Learner dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Welcome back, learner.</h1>
        <p className="mt-4 text-slate-300">Continue your celebrity courses, unlock achievements, and track daily goals with an AI-powered roadmap.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-card p-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-slate-900/80 p-5 text-white shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">XP points</p>
              <p className="mt-3 text-3xl font-semibold">{dashboardStats.xp}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-white shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Daily goal</p>
              <p className="mt-3 text-3xl font-semibold">{dashboardStats.streakDays} days</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-white shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Leaderboard</p>
              <p className="mt-3 text-3xl font-semibold">#{dashboardStats.leaderboard}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-white shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Upcoming live</p>
              <p className="mt-3 text-base font-medium">{dashboardStats.upcoming[0].title}</p>
              <p className="mt-1 text-slate-400">{dashboardStats.upcoming[0].date}</p>
            </div>
          </div>
        </div>

        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Learner permissions</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">What you can do</h2>
            </div>
            <Button variant="secondary" onClick={() => window.location.assign('/user')}>View profile</Button>
          </div>
          <div className="mt-8 grid gap-3 text-slate-300">
            {learnerPermissions.map((permission) => (
              <div key={permission} className="rounded-3xl bg-slate-900/80 p-4 text-sm">
                {permission}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Learning progress</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Time spent this week</h2>
            </div>
            <Button variant="secondary">View report</Button>
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardStats.progress} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="hours" stroke="#38bdf8" strokeWidth={4} dot={{ r: 4, fill: '#67e8f9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-white">Skill growth</h2>
          <p className="mt-3 text-slate-400">Radar view of your current competency across premium learning pillars.</p>
          <div className="mt-8 flex justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={[
                  { subject: 'Creativity', A: 82 },
                  { subject: 'Performance', A: 75 },
                  { subject: 'Leadership', A: 88 },
                  { subject: 'Storytelling', A: 79 },
                  { subject: 'Strategy', A: 84 },
                ]}
              >
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#cbd5e1" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="You" dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Continue learning</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Your active courses</h2>
          </div>
          <Button variant="secondary">Explore New Courses</Button>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {celebrityCourses.slice(0, 2).map((course) => (
            <div key={course.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-white">{course.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{course.instructor}</p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">{course.badge}</span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-violet-500" />
                </div>
                <span className="text-sm text-slate-300">67% complete</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="secondary">Resume Course</Button>
                <Button>Open Player</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
