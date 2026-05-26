import { useMemo, useState } from 'react'
import Button from '../../components/common/Button/Button.jsx'
import Modal from '../../components/common/Modal/Modal.jsx'

const pendingCoursesSeed = [
  {
    id: 'c1',
    title: 'Screen Presence & Modern Acting',
    instructor: 'Alia Bhatt',
    category: 'Acting',
    level: 'Advanced',
    status: 'Pending',
  },
  {
    id: 'c2',
    title: 'Startup Mindset for Market Champions',
    instructor: 'Ranveer Singh',
    category: 'Entrepreneurship',
    level: 'Intermediate',
    status: 'Pending',
  },
]

export default function AdminReviewPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)

  const pendingCourses = useMemo(() => pendingCoursesSeed, [])

  function openCourse(course) {
    setSelected(course)
    setOpen(true)
  }

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">Admin review</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-100">
          Review pending courses
        </h1>
        <p className="mt-4 text-slate-300">
          Approve, request changes, or publish courses with confidence.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {pendingCourses.map((course) => (
          <div
            key={course.id}
            className="glass-card rounded-[2rem] p-7 border border-white/10 bg-slate-950/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-amber-300">
                  {course.category} • {course.level}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-100">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm text-slate-300">
                  Instructor: {course.instructor}
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-200">
                {course.status}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => openCourse(course)}>
                View details
              </Button>
              <Button onClick={() => setOpen(false)}>Request changes</Button>
              <Button onClick={() => setOpen(false)}>Approve</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={selected ? selected.title : 'Course details'}
      >
        {selected && (
          <div className="space-y-3">
            <p className="text-slate-200">
              Instructor: <span className="font-semibold">{selected.instructor}</span>
            </p>
            <p className="text-slate-200">
              Category: <span className="font-semibold">{selected.category}</span>
            </p>
            <p className="text-slate-200">
              Level: <span className="font-semibold">{selected.level}</span>
            </p>
            <div className="pt-2">
              <p className="text-sm text-slate-300">
                Use this space to show course syllabus, media checks, and publishing readiness.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

