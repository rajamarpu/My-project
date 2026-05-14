import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import Button from '../../components/ui/Button.jsx'
import { dashboardAPI } from '../../services/api.js'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    dashboardAPI.getDashboard().then((response) => setData(response.data))
  }, [])

  if (!data) return <div className="h-[70vh] animate-pulse rounded-[2rem] bg-white/10" />

  const weekly = [
    { day: 'Mon', hours: data.stats.completedLessons ? 1 : 0 },
    { day: 'Tue', hours: data.stats.completedLessons ? 2 : 0 },
    { day: 'Wed', hours: data.stats.completedLessons ? 1.5 : 0 },
    { day: 'Thu', hours: data.stats.completedLessons ? 2.5 : 0 },
    { day: 'Fri', hours: 1 },
    { day: 'Sat', hours: 0.5 },
    { day: 'Sun', hours: 1.25 },
  ]

  return (
    <section className="space-y-8 pb-16">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Learner dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Your learning command center</h1>
        <p className="mt-4 text-slate-300">Continue courses, track progress, view certificates, read notifications, and discover AI-style recommendations.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <Metric label="My Courses" value={data.stats.enrolledCourses} />
        <Metric label="Completed Lessons" value={data.stats.completedLessons} />
        <Metric label="Certificates" value={data.stats.certificates} />
        <Metric label="Streak" value={`${data.stats.streakDays} days`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Continue learning</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Active courses</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => navigate('/dashboard/courses')}>My Courses</Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard/progress')}>Progress</Button>
              <Button variant="secondary" onClick={() => navigate('/explore')}>Explore</Button>
            </div>
          </div>
          <div className="mt-8 grid gap-5">
            {data.enrollments.length === 0 && (
              <div className="rounded-3xl bg-white/5 p-6 text-slate-300">No enrollments yet. Explore courses and enroll to start tracking progress.</div>
            )}
            {data.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{enrollment.course.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{enrollment.course.instructor}</p>
                  </div>
                  <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-sm text-cyan-200">{enrollment.progressPercent}% complete</span>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${enrollment.progressPercent}%` }} />
                </div>
                <Button className="mt-5" onClick={() => navigate(`/player/${enrollment.courseId}`)}>Open Player</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Notifications</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard/notifications')}>Open Notifications</Button>
          <div className="mt-5 space-y-3">
            {data.notifications.map((notice) => (
              <div key={notice.id} className="rounded-3xl bg-slate-900/80 p-4">
                <p className="font-semibold text-white">{notice.title}</p>
                <p className="mt-1 text-sm text-slate-400">{notice.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-white">Progress Tracking</h2>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#0f172a', border: 'none', color: '#f8fafc' }} />
                <Line type="monotone" dataKey="hours" stroke="#38bdf8" strokeWidth={4} dot={{ r: 4, fill: '#67e8f9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-soft">
          <h2 className="text-2xl font-semibold text-white">AI Recommendations</h2>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/dashboard/recommendations')}>Open Recommendations</Button>
          <div className="mt-5 grid gap-3">
            {data.recommendations.map((course) => (
              <button key={course.id} onClick={() => navigate(`/course/${course.id}`)} className="rounded-3xl bg-slate-900/80 p-4 text-left text-sm text-slate-300 hover:bg-white/10">
                <span className="font-semibold text-white">{course.title}</span>
                <span className="mt-1 block text-slate-500">{course.category} / {course.level}</span>
              </button>
            ))}
          </div>
          <div className="mt-8 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[{ subject: 'Craft', A: 82 }, { subject: 'Practice', A: 76 }, { subject: 'Projects', A: 70 }, { subject: 'Community', A: 64 }, { subject: 'Consistency', A: 88 }]}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#cbd5e1" />
                <PolarRadiusAxis tick={false} />
                <Radar dataKey="A" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-5 shadow-soft">
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}
