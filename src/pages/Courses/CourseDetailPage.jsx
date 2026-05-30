import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ClipboardList, Star, Heart, Users, Clock, BarChart3, FileText } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import { enrollCourseRequest, fetchCourseById, fetchCourseInstructors, unenrollCourseRequest } from '../../api/api.js'
import { toggleWishlist, enrollCourse, unenrollCourse } from '../../store/slices/authSlice.js'
import { resolveCourseThumbnail } from '../../utils/courseThumbnail.js'
import { formatRupeesFromPaise } from '../../utils/money.js'
import { getCourseAssignments, getCourseLessons } from '../../utils/courseContent.js'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const wishlist = useSelector((state) => state.auth.wishlist)
  const [course, setCourse] = useState(null)
  const [instructors, setInstructors] = useState([])
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [enrollmentBusy, setEnrollmentBusy] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchCourseById(courseId)
        const loadedCourse = response.data.course
        setCourse(loadedCourse)
        setSelectedInstructorId(String(loadedCourse.createdById || loadedCourse.createdBy?.id || ''))
        const instructorsResponse = await fetchCourseInstructors(loadedCourse.id).catch(() => ({ data: { instructors: [] } }))
        setInstructors(instructorsResponse.data.instructors || [])
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load course.')
        setCourse(null)
        setInstructors([])
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [auth.user, courseId])

  const isSaved = wishlist.includes(course?.id)
  const lessons = getCourseLessons(course)
  const assignments = getCourseAssignments(course)
  const durationText = useMemo(() => `${lessons.length} lessons`, [lessons.length])

  const enrollmentCount = course?.enrollmentCount ?? course?._count?.enrollments ?? course?.enrollments?.length ?? 0
  const isEnrolled = Boolean(course?.isEnrolled)
  const priceCents = Number(course?.priceCents || 0)
  const priceLabel = priceCents > 0 ? formatRupeesFromPaise(priceCents) : 'Free'

  const handleEnroll = async ({ openPlayer = false } = {}) => {
    if (!auth.user) {
      navigate('/login')
      return
    }
    try {
      setEnrollmentBusy(true)
      setError('')
      const response = await enrollCourseRequest(course.id, { instructorId: selectedInstructorId ? Number(selectedInstructorId) : undefined })
      dispatch(enrollCourse(response.data.enrollment.courseId))
      setCourse((current) => {
        const currentCount = Number(current?.enrollmentCount ?? current?._count?.enrollments ?? 0)
        const nextCount = response.data?.enrollmentCount ?? (current?.isEnrolled ? currentCount : currentCount + 1)
        return { ...current, isEnrolled: true, enrollmentCount: nextCount, _count: { ...(current?._count || {}), enrollments: nextCount } }
      })
      setNotice('You are enrolled in this course.')
      if (openPlayer) navigate(`/player/${course.id}`)
    } catch (err) {
      if (err?.response?.status === 402) {
        setError(err.response.data?.message || `Payment required. Cost to enroll is ${priceLabel}.`)
      } else {
        setError(err?.response?.data?.message || err.message || 'Enrollment failed.')
      }
    } finally {
      setEnrollmentBusy(false)
    }
  }

  const handleUnenroll = async () => {
    if (!auth.user) {
      navigate('/login')
      return
    }
    try {
      setEnrollmentBusy(true)
      setError('')
      setNotice('')
      const response = await unenrollCourseRequest(course.id)
      dispatch(unenrollCourse(course.id))
      const nextCount = response.data?.enrollmentCount ?? Math.max(0, Number(enrollmentCount) - 1)
      setCourse((current) => ({ ...current, isEnrolled: false, enrollmentCount: nextCount, _count: { ...(current?._count || {}), enrollments: nextCount } }))
      setNotice('You are unenrolled from this course.')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unenrollment failed.')
    } finally {
      setEnrollmentBusy(false)
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-slate-300">Loading course...</div>
  }

  if (error && !course) {
    return <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-red-100">{error}</div>
  }

  const instructor = course?.createdBy || {}
  const selectedInstructor = instructors.find((item) => String(item.id) === String(selectedInstructorId))
  const displayInstructor = selectedInstructor || instructor
  const cover = resolveCourseThumbnail(course)

  const toggleInstructorPanel = async () => {
    if (!auth.user) {
      navigate('/login')
      return
    }
    const nextOpen = !switchPanelOpen
    setSwitchPanelOpen(nextOpen)
    if (!nextOpen || !course || instructors.length) return
    try {
      const instructorsResponse = await fetchCourseInstructors(course.id)
      setInstructors(instructorsResponse.data.instructors || [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load instructors.')
    }
  }

  return (
    <section className="space-y-10 pb-16">
      <div className="upto-hero-panel overflow-hidden rounded-3xl p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 light:text-cyan-700">Course detail</p>
            <h1 className="text-4xl font-semibold text-slate-100 light:text-slate-900">{course.title}</h1>
            <p className="max-w-2xl text-slate-300 light:text-slate-600">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100 light:bg-black/5 light:text-slate-900">
                <Star size={16} className="text-amber-300" /> {course.rating ?? '0.0'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100 light:bg-black/5 light:text-slate-900">
                <Clock size={16} className="text-cyan-300 light:text-cyan-700" /> {durationText}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100 light:bg-black/5 light:text-slate-900">
                <BarChart3 size={16} className="text-teal-300 light:text-teal-700" /> {course.level}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100 light:bg-black/5 light:text-slate-900">
                <Users size={16} className="text-green-300 light:text-emerald-700" /> {enrollmentCount} learners
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-200">
                Cost to enroll: {priceLabel}
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-[var(--border-color)] bg-white/92 p-6 shadow-soft dark:bg-slate-950/70">
            <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-slate-900 relative">
              <img src={cover} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <img
                  src={displayInstructor.avatarUrl || cover}
                  alt={displayInstructor.name}
                  className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
                />
                <span className="text-white font-semibold">with {displayInstructor.name || 'Instructor'}</span>
              </div>
            </div>
            <div className="grid gap-3">
              {isEnrolled ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => navigate(`/player/${course.id}`)} size="lg" disabled={enrollmentBusy}>Start Learning</Button>
                  <Button variant="secondary" onClick={handleUnenroll} size="lg" disabled={enrollmentBusy}>
                    {enrollmentBusy ? 'Updating...' : 'Unenroll'}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => handleEnroll()} size="lg" disabled={enrollmentBusy}>
                  {enrollmentBusy ? 'Enrolling...' : auth.user ? (priceCents > 0 ? `Pay ${priceLabel} to Enroll` : 'Enroll Course') : 'Login to Enroll'}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => dispatch(toggleWishlist(course.id))} className="flex-1">
                  <Heart size={16} className="mr-2" /> {isSaved ? 'Saved' : 'Add Wishlist'}
                </Button>
              </div>
            </div>
            {notice ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">{notice}</p> : null}
            {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">{error}</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6 rounded-[2rem] border border-[var(--border-color)] bg-white/92 p-8 shadow-soft dark:bg-slate-950/72">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 light:text-slate-600">
            {['Overview', 'Lessons', 'Resources'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === tab.toLowerCase()
                    ? 'bg-cyan-500 text-white shadow-glow'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 light:bg-black/5 light:text-slate-700 light:hover:bg-black/10'
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigate(`/course/${course.id}/assessments`)}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)]"
            >
              <ClipboardList size={16} />
              Assignments {assignments.length ? `(${assignments.length})` : ''}
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-5 text-[var(--text-secondary)]">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">What you will learn</h2>
              <p>{course.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="theme-subcard rounded-3xl p-5">
                  Real course rows, lessons, and instructor metadata are loaded from PostgreSQL.
                </div>
                <div className="theme-subcard rounded-3xl p-5">
                  Progress is saved to the database through the protected enrollment and progress APIs.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Curriculum</h2>
              <div className="space-y-3">
                {lessons.length ? lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="theme-subcard rounded-3xl p-4 text-[var(--text-secondary)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{lesson.title}</span>
                      <span>{lesson.durationMin ? `${lesson.durationMin} min` : lesson.type}</span>
                    </div>
                    {lesson.description ? <p className="mt-2 text-sm text-[var(--text-muted)]">{lesson.description}</p> : null}
                  </div>
                )) : (
                  <div className="theme-subcard rounded-3xl p-5 text-[var(--text-muted)]">No lessons added yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Resources</h2>
              <div className="theme-subcard rounded-3xl p-5 text-[var(--text-secondary)]">
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Course metadata and instructor profile are synced from the backend.
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4 light:bg-black/5">Category: {course.category}</div>
                  <div className="rounded-2xl bg-white/5 p-4 light:bg-black/5">Instructor: {displayInstructor.name || 'Instructor'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6 rounded-[2rem] border border-[var(--border-color)] bg-white/92 p-8 shadow-soft dark:bg-slate-950/72">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 light:text-cyan-700">Course summary</p>
            <ul className="mt-5 space-y-3 text-[var(--text-secondary)]">
              <li>Category: {course.category}</li>
              <li>Level: {course.level}</li>
              <li>Lessons: {lessons.length}</li>
              <li>Assignments: {assignments.length}</li>
              <li>Published: {course.isPublished ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-white/92 dark:bg-slate-900/72">
            <div className="p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400 light:text-slate-500">Choose celebrity instructor</p>
              <div className="mt-4 flex items-center gap-4">
                <img src={displayInstructor.avatarUrl || cover} alt={displayInstructor.name} className="h-16 w-16 rounded-2xl object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-100 light:text-slate-900">{displayInstructor.name || 'Instructor'}</p>
                  <p className="line-clamp-2 text-sm text-slate-400 light:text-slate-600">{displayInstructor.bio || displayInstructor.expertise || 'Pick any celebrity instructor before you start.'}</p>
                </div>
              </div>
              <Button variant="secondary" className="mt-4 w-full" onClick={toggleInstructorPanel}>
                {switchPanelOpen ? 'Close Instructor List' : 'Choose Celebrity'}
              </Button>
            </div>
            {switchPanelOpen ? (
              <div className="border-t border-[var(--border-color)]">
                <div className="p-5 pb-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Pick any celebrity for this course</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    This choice sets your active instructor when you start learning. You can still switch again later from the player.
                  </p>
                </div>
                {instructors.length ? (
                  <div className="max-h-[28rem] space-y-3 overflow-y-auto px-5 pb-4">
                    {instructors.map((item) => {
                      const active = String(item.id) === String(selectedInstructorId)
                      const current = instructor?.id === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedInstructorId(String(item.id))
                            setNotice(`${item.name} selected. Start learning to continue with this instructor.`)
                          }}
                          className={[
                            'flex w-full gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                            active
                              ? 'border-cyan-500 bg-cyan-500/10 shadow-soft'
                              : 'border-[var(--border-color)] bg-white/80 hover:border-cyan-500/50 hover:bg-cyan-500/5 dark:bg-slate-950/55',
                          ].join(' ')}
                        >
                          <img src={item.avatarUrl || '/favicon.svg'} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg border border-[var(--border-color)] object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-950 dark:text-slate-100">{item.name}</span>
                              {current ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[0.68rem] font-semibold text-emerald-700 dark:text-emerald-200">Default</span> : null}
                              {active && !current ? <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[0.68rem] font-semibold text-cyan-700 dark:text-cyan-200">Selected</span> : null}
                            </span>
                            <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">{item.matchReason || item.expertise || course.category}</span>
                            <span className="mt-2 line-clamp-2 block text-sm leading-5 text-slate-600 dark:text-slate-400">{item.bio || item.expertise}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-400">No celebrity instructors are available right now.</div>
                )}
                <div className="border-t border-[var(--border-color)] bg-white/95 p-5 dark:bg-slate-950/75">
                  {selectedInstructor ? (
                    <p className="mb-3 rounded-lg border border-[var(--border-color)] bg-black/[0.03] p-3 text-sm text-slate-700 dark:bg-white/5 dark:text-slate-300">
                      Selected: <span className="font-semibold text-slate-950 dark:text-slate-100">{selectedInstructor.name}</span>
                    </p>
                  ) : null}
                  <Button onClick={() => handleEnroll({ openPlayer: true })} disabled={!selectedInstructorId || enrollmentBusy} className="w-full">
                    {isEnrolled ? `Continue with ${selectedInstructor?.name || 'Selected Instructor'}` : priceCents > 0 ? `Pay ${priceLabel} to Enroll` : `Enroll with ${selectedInstructor?.name || 'Selected Instructor'}`}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  )
}
