import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import Button from '../../components/common/Button/Button.jsx'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../utils/animationVariants.js'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Award, BookOpenCheck, Clock3, Compass, Flame, GraduationCap, LineChart as LineChartIcon, PlayCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { fetchLearnerDashboard, fetchUserAnalytics } from '../../api/api'

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

  async function loadDashboardData() {
    try {
      setLoading(true)
      const [analyticsRes, coursesRes] = await Promise.all([
        fetchUserAnalytics().catch(() => ({ data: { analytics: {} } })),
        fetchLearnerDashboard().catch(() => ({ data: { dashboard: { enrollments: [] } } })),
      ])
      const enrollments = coursesRes.data?.dashboard?.enrollments || []
      const courseList = enrollments.map((enrollment) => ({
        ...enrollment.course,
        enrollmentId: enrollment.id,
        enrollment,
        isEnrolled: true,
        progress: enrollment.completionPct || 0,
      })).filter((course) => course?.id)
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
    <section className="space-y-8 pb-16">
      <div className="upto-premium-panel overflow-hidden rounded-xl p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.3em] sm:text-sm">Learner dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">Welcome back, {auth.user?.name || auth.user?.fullName || 'learner'}.</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              Continue your upskilling journey, unlock achievements, and track daily goals with an AI-powered roadmap.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/explore')}>Explore Courses</Button>
            <Button variant="secondary" onClick={() => navigate('/certificates')}>Certificates</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <LearnerMetric icon={BookOpenCheck} label="Enrolled" value={analytics.totalCourses} detail="active learning paths" loading={loading} />
        <LearnerMetric icon={LineChartIcon} label="Avg Progress" value={`${analytics.avgProgress}%`} detail="across tracked courses" loading={loading} />
        <LearnerMetric icon={Flame} label="Streak" value={`${analytics.streak} days`} detail="learning consistency" loading={loading} />
        <LearnerMetric icon={Clock3} label="Hours" value={analytics.hoursStudied} detail="studied so far" loading={loading} />
        <LearnerMetric icon={Award} label="Certificates" value={analytics.certificates} detail="earned credentials" loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-5 shadow-soft sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Learner permissions</p>
              <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">What you can do</h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/user')}>
              View profile
            </Button>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {learnerPermissions.map((permission) => (
              <div
                key={permission}
                className="theme-subcard flex items-start gap-3 rounded-lg p-4 text-sm text-[var(--text-secondary)]"
              >
                <ShieldCheck className="mt-0.5 shrink-0 text-cyan-600 dark:text-cyan-300" size={17} />
                <span>{permission}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="glass-card p-5 shadow-soft sm:p-6">
          <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Quick actions</p>
          <h2 className="mt-3 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Next best steps</h2>
          <div className="mt-6 grid gap-3">
            <LearnerAction icon={Compass} title="Find a course" text="Browse current catalog and pick your next skill." onClick={() => navigate('/explore')} />
            <LearnerAction icon={PlayCircle} title="Resume learning" text="Open your most recent course player." onClick={() => courses[0] ? navigate(`/player/${courses[0].id}`) : navigate('/explore')} />
            <LearnerAction icon={Sparkles} title="Join community" text="Ask questions and learn with peers." onClick={() => navigate('/community')} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Learning progress</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Time spent this week</h2>
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

        <div className="glass-card p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Skill growth</h2>
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

      <div className="glass-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">Continue learning</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">Your active courses</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/explore')}>Explore New Courses</Button>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-2 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] py-10 text-center text-[var(--text-muted)]">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center">
              <GraduationCap className="mx-auto text-[var(--text-muted)]" size={32} />
              <p className="mt-3 font-semibold text-[var(--text-primary)]">No active courses yet</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Explore courses to begin your learning path.</p>
              <Button className="mt-5" onClick={() => navigate('/explore')}>Explore Courses</Button>
            </div>
          ) : (
            courses.slice(0, 2).map((course) => (
              <div
                key={course.id}
                className="theme-subcard theme-subcard-hover rounded-lg p-5 shadow-soft"
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

function LearnerMetric({ icon: Icon, label, value, detail, loading }) {
  return (
    <div className="theme-card theme-subcard-hover rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
        <span className="theme-icon-badge grid h-10 w-10 place-items-center rounded-lg">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">{loading ? <span className="skeleton inline-block h-8 w-16" /> : value}</p>
      <p className="mt-1 text-sm text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

function LearnerAction({ icon: Icon, title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="theme-subcard theme-subcard-hover flex items-center gap-3 rounded-lg p-4 text-left">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-400/15 text-cyan-700 dark:text-cyan-200">
        <Icon size={18} />
      </span>
      <span>
        <span className="block font-semibold text-[var(--text-primary)]">{title}</span>
        <span className="mt-0.5 block text-sm text-[var(--text-muted)]">{text}</span>
      </span>
    </button>
  )
}



