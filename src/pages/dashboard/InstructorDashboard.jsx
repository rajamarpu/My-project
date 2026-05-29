import Button from '../../components/common/Button/Button.jsx'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchCourses, fetchPlatformSummary } from '../../api/api.js'

const instructorPermissions = [
  'Create upskilling and technical courses',
  'View engagement analytics and student feedback',
  'Publish lessons, quizzes, and resources',
  'Manage course curriculum and learning paths',
]

const restrictedPermissions = [
  'User management',
  'Platform settings',
  'Global course approvals',
]

export default function InstructorDashboard() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState([
    { name: 'Courses', value: 0 },
    { name: 'Revenue', value: 0 },
    { name: 'Students', value: 0 },
  ])

  useEffect(() => {
    let isMounted = true
    async function loadMetrics() {
      try {
        const [coursesRes, summaryRes] = await Promise.all([
          fetchCourses().catch(() => ({ data: { courses: [] } })),
          fetchPlatformSummary().catch(() => ({ data: {} })),
        ])
        if (!isMounted) return
        const liveSummary = summaryRes.data?.summary || summaryRes.data || {}
        setMetrics([
          { name: 'Courses', value: (coursesRes.data?.courses || coursesRes.data || []).length },
          { name: 'Revenue', value: 0 },
          { name: 'Students', value: liveSummary.totalLearners ?? 0 },
        ])
      } catch (error) {
        console.error('Failed to load instructor metrics:', error)
      }
    }
    void loadMetrics()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Instructor</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">
          Your creator console
        </h1>
         <p className="mt-4 text-[var(--text-secondary)]">
           Manage upskilling-focused lessons, review engagement analytics, and publish high-production courses.
         </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className="theme-subcard rounded-3xl p-6 shadow-soft"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {metric.name}
              </p>
              <p className="mt-4 text-3xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-card p-8 shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="theme-eyebrow text-sm uppercase tracking-[0.24em]">
                Instructor permissions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                Your allowed actions
              </h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/instructor/courses')}>Manage courses</Button>
          </div>

          <div className="mt-8 grid gap-3 text-[var(--text-secondary)]">
            {instructorPermissions.map((item) => (
              <div
                key={item}
                className="theme-subcard rounded-3xl p-4 text-sm"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="theme-subcard mt-8 rounded-3xl p-5 text-[var(--text-secondary)]">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Admin-only features
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
              {restrictedPermissions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="glass-card p-8 shadow-soft">
          <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Build</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            Create your next upskilling course
          </h2>
          <p className="mt-4 text-[var(--text-secondary)]">
            Publish with AI-guided curricula, course thumbnails, and lesson ordering tools.
          </p>

          <div className="mt-8 grid gap-4">
            <Button onClick={() => navigate('/instructor/create')}>Create Course</Button>
            <Button variant="secondary" onClick={() => navigate('/instructor/feedback')}>Review student feedback</Button>
          </div>
        </div>
      </div>
    </section>
  )
}


