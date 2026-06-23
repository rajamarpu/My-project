import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Eye, MessageSquareWarning } from 'lucide-react'
import Button from '../../components/common/Button/Button.jsx'
import Modal from '../../components/common/Modal/Modal.jsx'
import { AdminMetricCard, AdminPageHeader } from '../../components/admin/AdminUI.jsx'
import { fetchAdminCourses } from '../../api/api.js'

export default function AdminReviewPage() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const response = await fetchAdminCourses()
        if (!active) return
        setCourses(response.data?.courses || [])
      } catch {
        if (!active) return
        setCourses([])
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const pendingCourses = useMemo(
    () => courses.filter((course) => !course.isPublished || String(course.reviewStatus || course.status || '').toUpperCase().includes('PENDING') || String(course.reviewStatus || course.status || '').toUpperCase().includes('CHANGE')),
    [courses],
  )
  const readyChecks = useMemo(
    () => pendingCourses.filter((course) => course.title && (course.createdBy?.name || course.instructor?.name || course.instructor || course.teacher) && course.category && course.level).length,
    [pendingCourses],
  )
  const changeRequests = useMemo(
    () => pendingCourses.filter((course) => String(course.reviewStatus || course.status || '').toLowerCase().includes('change')).length,
    [pendingCourses],
  )

  function openCourse(course) {
    setSelected(course)
    setOpen(true)
  }

  return (
    <section className="space-y-8 pb-16">
      <AdminPageHeader eyebrow="Admin review" title="Review pending courses" description="Approve, request changes, or publish courses with confidence." />

      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Pending reviews" value={loading ? '...' : pendingCourses.length} detail="courses awaiting action" icon={Eye} tone="blue" loading={loading} href="/admin/courses" />
        <AdminMetricCard label="Ready checks" value={loading ? '...' : readyChecks} detail="complete course records" icon={CheckCircle2} tone="teal" loading={loading} href="/admin/courses" />
        <AdminMetricCard label="Change requests" value={loading ? '...' : changeRequests} detail="open feedback loops" icon={MessageSquareWarning} tone="rose" loading={loading} href="/admin/courses" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {pendingCourses.map((course) => (
          <div
            key={course.id}
            className="admin-panel admin-panel-hover p-5 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                  {course.category || 'Uncategorized'} | {course.level || 'Unspecified'}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                  {course.title}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Instructor: {course.createdBy?.name || course.instructor?.name || course.instructor || course.teacher || 'Not assigned'}
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
                {course.reviewStatus || course.status || (course.isPublished ? 'Published' : 'Pending')}
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
            <p className="text-[var(--text-secondary)]">
              Instructor: <span className="font-semibold">{selected.createdBy?.name || selected.instructor?.name || selected.instructor || selected.teacher || 'Not assigned'}</span>
            </p>
            <p className="text-[var(--text-secondary)]">
              Category: <span className="font-semibold">{selected.category || 'Uncategorized'}</span>
            </p>
            <p className="text-[var(--text-secondary)]">
              Level: <span className="font-semibold">{selected.level || 'Unspecified'}</span>
            </p>
            <div className="pt-2">
              <p className="text-sm text-[var(--text-secondary)]">
                Use this space to show course syllabus, media checks, and publishing readiness.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

