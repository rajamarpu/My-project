import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Star, Heart, Users, Clock, BarChart3, FileText, MessageSquare } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import { createCheckout, enrollCourseRequest, fetchCourseById, fetchCourseInstructors, fetchSavedCourses, invalidateApiCachePrefix, readApiCache, removeSavedCourseRequest, saveCourseRequest, unenrollCourseRequest } from '../../api/api.js'
import { toggleWishlist, setWishlist, enrollCourse, unenrollCourse } from '../../store/slices/authSlice.js'
import { resolveCourseThumbnail } from '../../utils/courseThumbnail.js'
import { formatRupeesFromPaise } from '../../utils/money.js'
import { getCourseAssignments, getCourseLessons, getCourseModules, getLessonOutcomes } from '../../utils/courseContent.js'
import { notifyDashboardRefresh } from '../../utils/dashboardRefresh.js'
import { getCourseTitle } from '../../utils/courseTitle.js'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const wishlist = useSelector((state) => state.auth.wishlist)
  const [course, setCourse] = useState(() => readApiCache(`course:${courseId}`)?.course || null)
  const [instructors, setInstructors] = useState(() => readApiCache(`course-instructors:${courseId}`)?.instructors || [])
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(() => !readApiCache(`course:${courseId}`)?.course)
  const [enrollmentBusy, setEnrollmentBusy] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [wishlistBusy, setWishlistBusy] = useState(false)

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

  useEffect(() => {
    if (!auth.user || String(auth.user.role || auth.role).toLowerCase() !== 'learner') return
    fetchSavedCourses().then((response) => dispatch(setWishlist((response.data?.savedCourses || []).map((item) => item.id)))).catch(() => {})
  }, [auth.role, auth.user, dispatch])

  const isSaved = wishlist.includes(course?.id)
  const lessons = getCourseLessons(course)
  const assignments = getCourseAssignments(course)
  const modules = getCourseModules(course)
  const outcomes = [...new Set(lessons.flatMap(getLessonOutcomes))]
  const durationText = `${lessons.length} lessons`

  const enrollmentCount = course?.enrollmentCount ?? course?._count?.enrollments ?? course?.enrollments?.length ?? 0
  const isEnrolled = Boolean(course?.isEnrolled)
  const priceCents = Number(course?.priceCents || 0)
  const priceLabel = priceCents > 0 ? formatRupeesFromPaise(priceCents) : 'Free'
  const courseTitle = getCourseTitle(course)

  const handleEnroll = async ({ openPlayer = false, instructorId = null } = {}) => {
    if (!auth.user) {
      navigate('/login')
      return
    }
    try {
      setEnrollmentBusy(true)
      setError('')
      const payload = Number.isInteger(instructorId) ? { instructorId } : {}
      const response = await enrollCourseRequest(course.id, payload)
      dispatch(enrollCourse(response.data.enrollment.courseId))
      invalidateApiCachePrefix('learner-dashboard')
      invalidateApiCachePrefix('courses')
      invalidateApiCachePrefix(`course:${course.id}`)
      setCourse((current) => {
        const currentCount = Number(current?.enrollmentCount ?? current?._count?.enrollments ?? 0)
        const nextCount = response.data?.enrollmentCount ?? (current?.isEnrolled ? currentCount : currentCount + 1)
        return { ...current, isEnrolled: true, enrollmentCount: nextCount, _count: { ...(current?._count || {}), enrollments: nextCount } }
      })
      notifyDashboardRefresh({ source: 'course-enroll', courseId: course.id })
      setNotice('You are enrolled in this course.')
      if (openPlayer) navigate(`/player/${course.id}`)
    } catch (err) {
      let errorToHandle = err
      if (err?.response?.status === 400 && Number.isInteger(instructorId)) {
        try {
          const response = await enrollCourseRequest(course.id)
          dispatch(enrollCourse(response.data.enrollment.courseId))
          invalidateApiCachePrefix('learner-dashboard')
          invalidateApiCachePrefix('courses')
          invalidateApiCachePrefix(`course:${course.id}`)
          setCourse((current) => {
            const currentCount = Number(current?.enrollmentCount ?? current?._count?.enrollments ?? 0)
            const nextCount = response.data?.enrollmentCount ?? (current?.isEnrolled ? currentCount : currentCount + 1)
            return { ...current, isEnrolled: true, enrollmentCount: nextCount, _count: { ...(current?._count || {}), enrollments: nextCount } }
          })
          notifyDashboardRefresh({ source: 'course-enroll', courseId: course.id })
          setNotice('You are enrolled in this course.')
          if (openPlayer) navigate(`/player/${course.id}`)
          return
        } catch (fallbackError) {
          errorToHandle = fallbackError
        }
      }
      if (errorToHandle?.response?.status === 402) {
        try {
          const checkout = await createCheckout({ courseId: course.id }, window.crypto.randomUUID())
          if (checkout.data?.checkoutUrl) window.location.assign(checkout.data.checkoutUrl)
          else setError(`Secure checkout could not be opened. Cost to enroll is ${priceLabel}.`)
        } catch (checkoutError) {
          setError(checkoutError?.response?.data?.message || errorToHandle?.response?.data?.message || `Payment required. Cost to enroll is ${priceLabel}.`)
        }
      } else {
        setError(errorToHandle?.response?.data?.message || errorToHandle?.message || 'Enrollment failed.')
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
      invalidateApiCachePrefix('learner-dashboard')
      invalidateApiCachePrefix('courses')
      invalidateApiCachePrefix(`course:${course.id}`)
      const nextCount = response.data?.enrollmentCount ?? Math.max(0, Number(enrollmentCount) - 1)
      setCourse((current) => ({ ...current, isEnrolled: false, enrollmentCount: nextCount, _count: { ...(current?._count || {}), enrollments: nextCount } }))
      notifyDashboardRefresh({ source: 'course-unenroll', courseId: course.id })
      setNotice('You are unenrolled from this course.')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unenrollment failed.')
    } finally {
      setEnrollmentBusy(false)
    }
  }

  const handleWishlist = async () => {
    if (!auth.user) { navigate('/login'); return }
    try {
      setWishlistBusy(true)
      dispatch(toggleWishlist(course.id))
      if (isSaved) await removeSavedCourseRequest(course.id)
      else await saveCourseRequest(course.id)
      invalidateApiCachePrefix('saved-courses')
    } catch (err) {
      dispatch(toggleWishlist(course.id))
      setError(err?.response?.data?.message || 'Could not update saved courses.')
    } finally { setWishlistBusy(false) }
  }

  if (loading) {
    return <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 text-[var(--text-secondary)]">Loading course...</div>
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
    <section className="space-y-6 pb-16">
      <div className="upto-hero-panel overflow-hidden rounded-2xl p-4 sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-primary)]">Course detail</p>
            <h1 className="text-4xl font-semibold text-[var(--text-primary)]">{courseTitle}</h1>
            <p className="max-w-2xl text-[var(--text-secondary)]">{course.description}</p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]">
                <Star size={16} className="text-amber-300" /> {course.rating ?? '0.0'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]">
                <Clock size={16} className="text-[var(--accent-primary)]" /> {durationText}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]">
                <BarChart3 size={16} className="text-[var(--accent-primary)]" /> {course.level}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-sm text-[var(--text-primary)]">
                <Users size={16} className="text-[var(--success)]" /> {enrollmentCount} learners
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-200">
                Cost to enroll: {priceLabel}
              </span>
            </div>

            <div className="grid gap-3 pt-1 sm:grid-cols-3">
              <div className="platform-card-muted p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <BarChart3 size={16} className="text-[var(--accent-primary)]" />
                  Practical Skills
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Analytics, visualization, and decision-ready data workflows.</p>
              </div>
              <div className="platform-card-muted p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <ClipboardList size={16} className="text-[var(--accent-primary)]" />
                  Assignments
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{isEnrolled ? `${assignments.length} unlocked for this course.` : 'Available after enrollment.'}</p>
              </div>
              <div className="platform-card-muted p-4 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Users size={16} className="text-[var(--accent-primary)]" />
                  Guided Learning
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Learn with {displayInstructor.name || 'your selected instructor'}.</p>
              </div>
            </div>

            <div className="grid gap-3 pt-1 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="rounded-xl border border-orange-200/70 bg-orange-50/70 p-4 shadow-sm dark:border-orange-400/20 dark:bg-orange-500/10">
                <p className="text-sm font-semibold text-[var(--text-primary)]">What you will practice</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    course.category || 'Programming fundamentals',
                    `${course.level || 'Beginner'} concepts`,
                    assignments.length ? `${assignments.length} assignment${assignments.length === 1 ? '' : 's'}` : 'Practice checkpoints',
                    `${lessons.length || 1} guided lesson${(lessons.length || 1) === 1 ? '' : 's'}`,
                  ].map((item) => (
                    <span key={item} className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                  Build confidence through syntax basics, guided examples, lesson resources, and assignment-backed progress.
                </p>
              </div>

              <div className="platform-card-muted p-4 shadow-sm">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Course path</p>
                <div className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                  {['Start lesson', 'Practice assignment', 'Unlock certificate'].map((step, index) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-primary)]">{index + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="platform-card space-y-3 p-4">
            <div className="aspect-[16/9] overflow-hidden rounded-xl bg-slate-900 relative">
              <img src={cover} alt={courseTitle} className="h-full w-full object-contain" />
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
                  <Button variant="secondary" onClick={handleUnenroll} size="lg" loading={enrollmentBusy} loadingLabel="Updating...">
                    Unenroll
                  </Button>
                </div>
              ) : (
                <Button onClick={() => handleEnroll()} size="lg" loading={enrollmentBusy} loadingLabel="Enrolling...">
                  {auth.user ? (priceCents > 0 ? `Pay ${priceLabel} to Enroll` : 'Enroll Course') : 'Login to Enroll'}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleWishlist} loading={wishlistBusy} disabled={wishlistBusy} className="flex-1">
                  <Heart size={16} className="mr-2" /> {isSaved ? 'Saved' : 'Add Wishlist'}
                </Button>
              </div>
            </div>
            {notice ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">{notice}</p> : null}
            {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">{error}</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)] xl:items-start">
        <div className="platform-card space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
            {[
              ['Overview', 'overview'],
              ['Curriculum', 'curriculum'],
              ['Reviews', 'reviews'],
              ['Resources', 'resources'],
            ].map(([label, key]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`min-h-11 rounded-full px-4 py-2 transition ${
                  activeTab === key
                    ? 'bg-cyan-500 text-white shadow-glow'
                    : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (isEnrolled || auth.role === 'admin') navigate(`/course/${course.id}/assessments`)
                else void handleEnroll()
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-primary)]"
            >
              <ClipboardList size={16} />
              {isEnrolled || auth.role === 'admin' ? `Assignments ${assignments.length ? `(${assignments.length})` : ''}` : 'Enroll to view assignments'}
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 text-[var(--text-secondary)]">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">What you will learn</h2>
                  <p className="mt-3 leading-7">{course.description}</p>
                </div>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Your learning setup</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <span className="flex items-center justify-between gap-3">
                      <span>Lessons</span>
                      <strong className="text-[var(--text-primary)]">{lessons.length}</strong>
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <span>Assignments</span>
                      <strong className="text-[var(--text-primary)]">{assignments.length}</strong>
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <span>Instructor</span>
                      <strong className="truncate text-[var(--text-primary)]">{displayInstructor.name || 'Instructor'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  [BarChart3, 'Skill outcome', course.category || 'Career-ready skills'],
                  [Clock, 'Course pace', durationText],
                  [ClipboardList, 'Practice mode', assignments.length ? `${assignments.length} assignments` : 'Practice checkpoints'],
                  [Users, 'Learning style', `Guided by ${displayInstructor.name || 'mentor'}`],
                ].map(([Icon, title, text]) => (
                  <div key={title} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-sm">
                    <Icon size={18} className="text-[var(--accent-primary)]" />
                    <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">{text}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Learning outcomes</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(outcomes.length ? outcomes : [
                    `Understand the core concepts in ${course.category || 'this subject'}`,
                    `Apply ${course.level || 'guided'} skills through practical lessons`,
                    'Complete assignments and measurable practice checkpoints',
                    'Build progress toward a verified course certificate',
                  ]).map((outcome) => <div key={outcome} className="flex items-start gap-3 rounded-lg bg-[var(--bg-subtle)] p-3 text-sm text-[var(--text-secondary)]"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[var(--color-success)]" /><span>{outcome}</span></div>)}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-[var(--text-primary)]">Learning path preview</h3>
                    <button type="button" onClick={() => setActiveTab('curriculum')} className="text-sm font-semibold text-[var(--accent-primary)]">
                      View all
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {(lessons.length ? lessons.slice(0, 4) : [
                      { id: 'intro', title: 'Course introduction', type: 'Overview' },
                      { id: 'practice', title: 'Guided practice checkpoint', type: 'Practice' },
                      { id: 'project', title: 'Apply the concept in a project', type: 'Project' },
                    ]).map((lesson, index) => (
                      <div key={lesson.id || lesson.title} className="flex items-start gap-3 rounded-lg bg-[var(--bg-subtle)] p-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-primary)]">
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-[var(--text-primary)]">{lesson.title}</span>
                          <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                            {lesson.durationMin ? `${lesson.durationMin} min` : lesson.type || 'Lesson'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                  <h3 className="font-semibold text-[var(--text-primary)]">Recommended next step</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    {isEnrolled
                      ? 'Continue from the player and complete the next lesson checkpoint.'
                      : 'Enroll to unlock the player, assignments, and mentor-guided progress.'}
                  </p>
                  <div className="mt-4 rounded-xl bg-[var(--bg-subtle)] p-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{course.level || 'Beginner'} path</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{course.category || 'Skill development'} · {priceLabel}</p>
                  </div>
                  <Button className="mt-4 w-full" onClick={() => (isEnrolled ? navigate(`/player/${course.id}`) : handleEnroll())} loading={enrollmentBusy} loadingLabel="Enrolling...">
                    {isEnrolled ? 'Continue Learning' : 'Enroll and Start'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              <div><h2 className="text-2xl font-semibold text-[var(--text-primary)]">Course curriculum</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">{modules.length} modules · {lessons.length} lessons · {assignments.length} assignments</p></div>
              <div className="space-y-3">
                {modules.length ? modules.map((module, moduleIndex) => <section key={module.title} className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]"><div className="flex items-center justify-between gap-3 border-b border-[var(--border-color)] bg-[var(--bg-subtle)] p-4"><span className="font-semibold text-[var(--text-primary)]">Module {moduleIndex + 1}: {module.title}</span><span className="text-xs font-semibold text-[var(--text-muted)]">{module.lessons.length} lessons</span></div><div className="divide-y divide-[var(--border-color)]">{module.lessons.map((lesson, index) => <div key={lesson.id} className="flex items-start gap-3 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-primary)]">{index + 1}</span><span className="min-w-0 flex-1"><span className="block font-semibold text-[var(--text-primary)]">{lesson.title}</span>{lesson.description ? <span className="mt-1 block text-sm text-[var(--text-secondary)]">{lesson.description}</span> : null}</span><span className="shrink-0 text-xs text-[var(--text-muted)]">{lesson.durationMin ? `${lesson.durationMin} min` : lesson.type}</span></div>)}</div></section>) : <div className="theme-subcard rounded-xl p-5 text-[var(--text-muted)]">No curriculum has been added yet.</div>}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[15rem_minmax(0,1fr)]">
                <div className="rounded-xl bg-[var(--accent-soft)] p-5 text-center"><Star className="mx-auto fill-[var(--color-warning)] text-[var(--color-warning)]" size={26} /><p className="mt-3 text-4xl font-bold text-[var(--text-primary)]">{Number(course.rating || 0).toFixed(1)}</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Course rating</p></div>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5"><h2 className="text-xl font-semibold text-[var(--text-primary)]">Learner reviews</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Ratings reflect the live course record. Written learner reviews will appear here when review collection is available.</p><div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]"><Users size={17} /> {enrollmentCount} enrolled learners</div></div>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center"><MessageSquare className="mx-auto text-[var(--text-muted)]" size={30} /><p className="mt-3 font-semibold text-[var(--text-primary)]">No written reviews yet</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Be among the first learners to complete this course.</p></div>
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
                  <div className="rounded-2xl bg-[var(--bg-subtle)] p-4">Category: {course.category}</div>
                  <div className="rounded-2xl bg-[var(--bg-subtle)] p-4">Instructor: {displayInstructor.name || 'Instructor'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="platform-card space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--accent-primary)]">Course summary</p>
            <ul className="mt-5 space-y-3 text-[var(--text-secondary)]">
              <li>Category: {course.category}</li>
              <li>Level: {course.level}</li>
              <li>Lessons: {lessons.length}</li>
              <li>Assignments: {assignments.length}</li>
              <li>Published: {course.isPublished ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">Meet your instructor</p>
              <div className="mt-4 flex items-center gap-4">
                <img src={displayInstructor.avatarUrl || cover} alt={displayInstructor.name} className="h-16 w-16 rounded-2xl object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{displayInstructor.name || 'Instructor'}</p>
                  <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{displayInstructor.bio || displayInstructor.expertise || 'Pick any celebrity instructor before you start.'}</p>
                </div>
              </div>
              <Button variant="secondary" className="mt-4 w-full" onClick={toggleInstructorPanel}>
                {switchPanelOpen ? 'Close Instructor List' : 'Choose Celebrity'}
              </Button>
            </div>
            {switchPanelOpen ? (
              <div className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)] p-5">
                <label className="block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Select instructor
                  <select
                    value={selectedInstructorId}
                    onChange={(event) => {
                      const nextId = event.target.value
                      const nextInstructor = instructors.find((item) => String(item.id) === String(nextId))
                      setSelectedInstructorId(nextId)
                      if (nextInstructor) setNotice(`${nextInstructor.name} selected. Start learning to continue with this instructor.`)
                    }}
                    className="mt-2 min-h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 text-sm font-semibold text-[var(--text-primary)] outline-none"
                  >
                    {instructors.length ? instructors.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}{instructor?.id === item.id ? ' (Default)' : ''}
                      </option>
                    )) : (
                      <option value="">No instructors available</option>
                    )}
                  </select>
                </label>

                {selectedInstructor ? (
                  <div className="mt-4 flex items-start gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3">
                    <img src={selectedInstructor.avatarUrl || '/favicon.svg'} alt={selectedInstructor.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text-primary)]">{selectedInstructor.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]">
                        {selectedInstructor.matchReason || selectedInstructor.expertise || selectedInstructor.bio || course.category}
                      </p>
                    </div>
                  </div>
                ) : null}

                <Button
                  onClick={() => handleEnroll({ openPlayer: true, instructorId: selectedInstructorId ? Number(selectedInstructorId) : null })}
                  loading={enrollmentBusy}
                  loadingLabel="Updating..."
                  className="mt-4 w-full"
                >
                  {isEnrolled ? `Continue with ${selectedInstructor?.name || 'Selected Instructor'}` : priceCents > 0 ? `Pay ${priceLabel} to Enroll` : `Enroll with ${selectedInstructor?.name || 'Selected Instructor'}`}
                </Button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  )
}
