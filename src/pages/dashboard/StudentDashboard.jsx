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
        <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Learner dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">Welcome back, {auth.user?.name || auth.user?.fullName || 'learner'}.</h1>
        <p className="mt-4 text-[var(--text-secondary)]">
           Continue your upskilling journey, unlock achievements, and track daily goals with an AI-powered roadmap.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-card p-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="theme-subcard rounded-3xl p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Enrolled</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.totalCourses}</p>
            </div>
            <div className="theme-subcard rounded-3xl p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Avg Progress</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.avgProgress}%</p>
            </div>
            <div className="theme-subcard rounded-3xl p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Learning Streak</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.streak} days</p>
            </div>
            <div className="theme-subcard rounded-3xl p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Last Online</p>
              <p className="mt-3 text-lg font-semibold">{lastOnline}</p>
            </div>
            <div className="theme-subcard rounded-3xl p-5 shadow-soft sm:col-span-2 xl:col-span-4">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Hours Studied</p>
              <p className="mt-3 text-3xl font-semibold">{analytics.hoursStudied}</p>
            </div>
          </div>
        </div>

        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Learner permissions</p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">What you can do</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/user')}>
              View profile
            </Button>
          </div>
          <div className="mt-8 grid gap-3 text-[var(--text-secondary)]">
            {learnerPermissions.map((permission) => (
              <div
                key={permission}
                className="theme-subcard rounded-3xl p-4 text-sm"
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
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Learning progress</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Time spent this week</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/reports')}>View report</Button>
          </div>
          <div className="mt-8 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.weekly}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="day" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
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
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Skill growth</h2>
          <p className="mt-3 text-[var(--text-muted)]">
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
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--text-secondary)" />
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
            <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Continue learning</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Your active courses</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/explore')}>Explore New Courses</Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-2 py-8 text-center text-[var(--text-muted)]">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-[var(--text-muted)]">No courses enrolled. Explore to add some!</div>
          ) : (
            courses.slice(0, 2).map((course) => (
              <div
                key={course.id}
                className="theme-subcard rounded-3xl p-6 shadow-soft"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-[var(--text-primary)]">{course.title}</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{course.createdBy?.name || course.instructor?.full_name || course.instructor?.name || course.instructor || 'Instructor'}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-200">
                    {analytics.avgProgress}%
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between gap-4">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-teal-500" style={{ width: `${analytics.avgProgress}%` }} />
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{analytics.avgProgress}% complete</span>
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



