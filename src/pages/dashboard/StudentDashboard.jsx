import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import Button from '../../components/common/Button/Button.jsx'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../utils/animationVariants.js'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { fetchCourses, fetchUserAnalytics } from '../../api/api'

const learnerPermissions = [
  'Browse upskilling and technical courses',
  'Enroll in learning paths and save favorites',
  'Access community discussions and certificates',
  'Track weekly progress and daily streaks',
]

const emptyAnalytics = {
  totalCourses: 0,
  avgProgress: 0,
  streak: 0,
  hoursStudied: 0,
  completions: 0,
  quiz: 0,
  certificates: 0,
  weekly: [
    { day: 'Mon', hours: 0 },
    { day: 'Tue', hours: 0 },
    { day: 'Wed', hours: 0 },
    { day: 'Thu', hours: 0 },
    { day: 'Fri', hours: 0 },
    { day: 'Sat', hours: 0 },
    { day: 'Sun', hours: 0 },
  ],
  recent: [],
}

function normalizeAnalytics(payload, courseCount) {
  const data = payload?.analytics || payload || {}
  return {
    totalCourses: data.totalCourses ?? courseCount,
    avgProgress: data.avgProgress ?? data.completion ?? emptyAnalytics.avgProgress,
    streak: data.streak ?? emptyAnalytics.streak,
    hoursStudied: Math.round(data.hoursStudied ?? emptyAnalytics.hoursStudied),
    completions: data.completions ?? data.certificates ?? emptyAnalytics.completions,
    quiz: data.quiz ?? emptyAnalytics.quiz,
    certificates: data.certificates ?? emptyAnalytics.certificates,
    weekly: data.weekly ?? emptyAnalytics.weekly,
    recent: data.recent ?? emptyAnalytics.recent,
  }
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [analytics, setAnalytics] = useState(normalizeAnalytics(emptyAnalytics, 0))
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const lastOnline = window.localStorage.getItem('lms-last-online') || 'Online now'

  async function loadDashboardData() {
    try {
      setLoading(true)
      const [analyticsRes, coursesRes] = await Promise.all([
        fetchUserAnalytics().catch(() => ({ data: { analytics: {} } })),
        fetchCourses().catch(() => ({ data: [] })),
      ])
      const courseList = coursesRes.data?.courses || coursesRes.data || []
      setCourses(courseList)
      setAnalytics(normalizeAnalytics(analyticsRes.data, courseList.length))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setCourses([])
      setAnalytics(normalizeAnalytics(emptyAnalytics, 0))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadDashboardData)
  }, [])

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Learner dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-100">Welcome back, {auth.user?.name || auth.user?.fullName || 'learner'}.</h1>
        <p className="mt-4 text-slate-300">
           Continue your upskilling journey, unlock achievements, and track daily goals with an AI-powered roadmap.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-card p-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Enrolled</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.totalCourses}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Avg Progress</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.avgProgress}%</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Learning Streak</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.streak} days</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Last Online</p>
              <p className="mt-3 text-lg font-semibold">{lastOnline}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5 text-slate-100 shadow-soft sm:col-span-2 xl:col-span-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Hours Studied</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.hoursStudied}</p>
            </div>
          </div>
        </div>

        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Learner permissions</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-100">What you can do</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/user')}>
              View profile
            </Button>
          </div>
          <div className="mt-8 grid gap-3 text-slate-300">
            {learnerPermissions.map((permission) => (
              <div
                key={permission}
                className="rounded-3xl bg-slate-900/80 p-4 text-sm border border-white/5"
              >
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
              <h2 className="mt-2 text-2xl font-semibold text-slate-100">Time spent this week</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/reports')}>View report</Button>
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.weekly}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: 'none',
                    color: '#f8fafc',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#38bdf8"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#67e8f9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-semibold text-slate-100">Skill growth</h2>
          <p className="mt-3 text-slate-400">
            Radar view of your current competency across premium learning pillars.
          </p>
          <div className="mt-8 flex justify-center">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart
                data={[
                  { subject: 'Creativity', A: analytics.avgProgress },
                  { subject: 'Coding', A: analytics.avgProgress },
                  { subject: 'Projects', A: analytics.completions ? Math.min(100, analytics.completions * 20) : 0 },
                  { subject: 'Quiz', A: analytics.quiz },
                  { subject: 'Consistency', A: Math.min(100, analytics.streak * 10) },
                  { subject: 'Practice', A: Math.min(100, analytics.hoursStudied * 5) },
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
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">Your active courses</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/explore')}>Explore New Courses</Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-2 text-center text-slate-400 py-8">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="col-span-2 text-center text-slate-400 py-8">No courses enrolled. Explore to add some!</div>
          ) : (
            courses.slice(0, 2).map((course) => (
              <div
                key={course.id}
                className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-100">{course.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{course.createdBy?.name || course.instructor?.full_name || course.instructor?.name || course.instructor || 'Instructor'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">
                    {analytics.avgProgress}%
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-teal-500" style={{ width: `${analytics.avgProgress}%` }} />
                  </div>
                  <span className="text-sm text-slate-300">{analytics.avgProgress}% complete</span>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="secondary" onClick={() => navigate(`/course/${course.id}`)}>View Course</Button>
                  <Button onClick={() => navigate(`/player/${course.id}`)}>Open Player</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}



