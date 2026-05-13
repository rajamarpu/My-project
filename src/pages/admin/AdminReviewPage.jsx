import Button from '../../components/ui/Button.jsx'

const pendingCourses = [
  { title: 'Celebrity Fitness Blueprint', instructor: 'Nina Shore', status: 'Pending' },
  { title: 'Mastering Your Personal Brand', instructor: 'Ezra Cole', status: 'Pending' },
]

export default function AdminReviewPage() {
  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Course management</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Review pending celebrity courses</h1>
        <p className="mt-4 text-slate-300">Approve, reject, feature, or assign categories to content before it goes live on the academy.</p>
      </div>

      <div className="mt-10 grid gap-6">
        {pendingCourses.map((course) => (
          <div key={course.title} className="glass-card rounded-[2rem] border border-white/10 p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-white">{course.title}</p>
                <p className="mt-2 text-sm text-slate-400">Instructor: {course.instructor}</p>
              </div>
              <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-200">{course.status}</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Button>Preview video</Button>
              <Button variant="secondary">Reject</Button>
              <Button>Approve</Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
