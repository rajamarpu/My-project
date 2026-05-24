import Button from '../../components/ui/Button.jsx'
import { useNavigate } from 'react-router-dom'

const metrics = [
  { name: 'Courses', value: 14 },
  { name: 'Revenue', value: 82 },
  { name: 'Students', value: 6200 },
]

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

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Instructor</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-100">
          Your creator console
        </h1>
         <p className="mt-4 text-slate-300">
           Manage upskilling-focused lessons, review engagement analytics, and publish high-production courses.
         </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.name}
              className="rounded-3xl bg-slate-900/80 p-6 text-slate-100 shadow-soft"
            >
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
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
              <p className="text-sm uppercase tracking-[0.24em] text-violet-300">
                Instructor permissions
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-100">
                Your allowed actions
              </h2>
            </div>
            <Button variant="secondary" onClick={() => navigate('/instructor/courses')}>Manage courses</Button>
          </div>

          <div className="mt-8 grid gap-3 text-slate-300">
            {instructorPermissions.map((item) => (
              <div
                key={item}
                className="rounded-3xl bg-slate-900/80 p-4 text-sm border border-white/5"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl bg-slate-900/80 p-5 text-slate-300">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
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
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Build</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">
            Create your next upskilling course
          </h2>
          <p className="mt-4 text-slate-400">
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
