import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../utils/animationVariants.js'
import Button from '../../components/common/Button/Button.jsx'
import ChatInterface from '../../components/ui/Dashboard/ChatInterface.jsx'
import { fetchCourseById, fetchCourseInstructors, fetchUserProgress, switchCourseInstructor, updateUserProgress } from '../../api/api.js'
import { getCourseAssignments, getCourseLessons, getCourseModules, getLessonKind, getLessonOutcomes, getLessonResources, lessonMeta } from '../../utils/courseContent.js'
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react'

export default function LearningPlayerPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [course, setCourse] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [instructors, setInstructors] = useState([])
  const [lessonProgress, setLessonProgress] = useState([])
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)
  const [selectedInstructorId, setSelectedInstructorId] = useState('')
  const [switchingInstructor, setSwitchingInstructor] = useState(false)
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [playbackSpeed, setPlaybackSpeed] = useState('1')
  const [lessonNotes, setLessonNotes] = useState('')

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')
        const [courseRes, progressRes] = await Promise.all([
          fetchCourseById(courseId),
          fetchUserProgress(courseId).catch(() => ({ data: { progress: [] } })),
        ])
        const loadedCourse = courseRes.data.course
        const loadedEnrollment = progressRes.data.enrollment || null
        setCourse(loadedCourse)
        setEnrollment(loadedEnrollment)
        setLessonProgress(progressRes.data.progress || [])
        setSelectedInstructorId(String(loadedEnrollment?.currentInstructorId || loadedCourse.createdById || loadedCourse.createdBy?.id || ''))
        const instructorsRes = await fetchCourseInstructors(loadedCourse.id).catch(() => ({ data: { instructors: [] } }))
        setInstructors(instructorsRes.data.instructors || [])
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load lesson player.')
        setCourse(null)
        setEnrollment(null)
        setInstructors([])
        setLessonProgress([])
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [auth.user, courseId])

  const lessons = useMemo(() => getCourseLessons(course), [course])
  const modules = useMemo(() => getCourseModules(course), [course])
  const assignments = useMemo(() => getCourseAssignments(course), [course])
  const activeLesson = lessons[activeLessonIndex] || lessons[0]
  const completedLessonIds = new Set(lessonProgress.filter((item) => item.completed).map((item) => item.lessonId).filter(Boolean))
  const completedCount = lessons.filter((lesson) => lessonProgress.some((item) => item.lessonId === lesson.id && item.completed)).length
  const progressPct = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0
  const activeInstructor = enrollment?.currentInstructor || course?.createdBy || null
  const selectedInstructor = instructors.find((item) => String(item.id) === String(selectedInstructorId))
  const switchHistory = enrollment?.instructorChanges || []
  const selectedIsCurrent = selectedInstructor && activeInstructor?.id === selectedInstructor.id
  const activeResources = getLessonResources(activeLesson)
  const courseResources = useMemo(() => lessons.flatMap((lesson) => getLessonResources(lesson).map((resource) => ({ ...resource, lessonTitle: lesson.title }))), [lessons])
  const activeMeta = lessonMeta(activeLesson)
  const activeKind = getLessonKind(activeLesson)
  const activeOutcomes = getLessonOutcomes(activeLesson)
  const activeVideoUrl = resolveActiveLessonVideoUrl(activeLesson, activeInstructor)
  const certificateReady = progressPct >= 100 && lessons.length > 0

  useEffect(() => {
    if (!course?.id || !activeLesson?.id) return
    const initial = window.setTimeout(() => {
      setLessonNotes(window.localStorage.getItem(`lesson-notes:${course.id}:${activeLesson.id}`) || '')
    }, 0)
    return () => window.clearTimeout(initial)
  }, [course?.id, activeLesson?.id])

  useEffect(() => {
    if (!course?.id || !activeLesson?.id) return
    window.localStorage.setItem(`lesson-notes:${course.id}:${activeLesson.id}`, lessonNotes)
  }, [course?.id, activeLesson?.id, lessonNotes])

  const toggleInstructorPanel = async () => {
    const nextOpen = !switchPanelOpen
    setSwitchPanelOpen(nextOpen)
    if (!nextOpen || !course || instructors.length) return
    try {
      const instructorsRes = await fetchCourseInstructors(course.id)
      setInstructors(instructorsRes.data.instructors || [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load instructors.')
    }
  }

  const markComplete = async () => {
    if (!course || !activeLesson) return
    try {
      const response = await updateUserProgress({
        courseId: course.id,
        lessonId: activeLesson.id,
        percentComplete: 100,
        watchedSeconds: activeLesson.durationMin * 60,
      })
      setLessonProgress((prev) => {
        const next = prev.filter((item) => item.lessonId !== activeLesson.id)
        next.push(response.data.progress)
        return next
      })
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not save progress.')
    }
  }

  const changeInstructor = async () => {
    if (!course || !selectedInstructorId) return
    const nextInstructor = instructors.find((item) => String(item.id) === String(selectedInstructorId))
    if (!nextInstructor) return
    if (activeInstructor?.id === nextInstructor.id) {
      setNotice(`${nextInstructor.name} is already your active instructor for this course.`)
      return
    }
    const confirmed = window.confirm(`Switch this course instructor to ${nextInstructor.name}? Your completed lessons, quizzes, certificates, and progress will stay unchanged.`)
    if (!confirmed) return

    try {
      setSwitchingInstructor(true)
      setError('')
      setNotice('')
      const response = await switchCourseInstructor(course.id, { instructorId: nextInstructor.id })
      setEnrollment(response.data.enrollment ? { ...response.data.enrollment, instructorChanges: response.data.history || [] } : null)
      setSelectedInstructorId(String(nextInstructor.id))
      setNotice(`Instructor changed to ${nextInstructor.name}. Continue from the same lesson whenever you are ready.`)
      setSwitchPanelOpen(false)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not change instructor.')
    } finally {
      setSwitchingInstructor(false)
    }
  }

  if (loading) {
    return <div className="glass-card p-8 text-[var(--text-secondary)]">Loading player...</div>
  }

  if (error && !course) {
    return <section className="rounded-lg border border-red-400/30 bg-red-500/10 p-8 text-red-700 dark:text-red-100"><h1 className="text-2xl font-bold">Course player unavailable</h1><p className="mt-3">{error}</p><Button className="mt-5" variant="secondary" onClick={() => navigate('/explore')}>Browse courses</Button></section>
  }

  if (course && !course.isEnrolled && !enrollment) {
    return <section className="glass-card rounded-2xl p-8 text-center shadow-glow"><h1 className="text-3xl font-black text-[var(--text-primary)]">Enrollment required</h1><p className="mx-auto mt-3 max-w-xl text-[var(--text-secondary)]">Enroll in {course.title} before opening its lessons, assessments, notes, and community workspace.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={() => navigate(`/course/${course.id}`)}>View enrollment options</Button><Button variant="secondary" onClick={() => navigate('/explore')}>Back to courses</Button></div></section>
  }

  return (
    <motion.section className="mx-auto w-full max-w-[1600px] space-y-6 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <nav className="sticky top-[76px] z-20 flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--navbar-bg)] p-3 shadow-soft backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between" aria-label="Course player navigation">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="secondary" onClick={() => navigate(`/course/${course.id}`)}><ChevronLeft size={16} /> Course details</Button>
          <span className="hidden truncate text-sm font-semibold text-[var(--text-secondary)] lg:block">{activeLesson?.title || course.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden min-w-44 items-center gap-3 sm:flex"><span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]"><span className="block h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${progressPct}%` }} /></span><span className="text-xs font-bold text-[var(--text-secondary)]">{progressPct}%</span></div>
          <Button variant="secondary" onClick={() => setActiveLessonIndex((index) => Math.max(0, index - 1))} disabled={activeLessonIndex <= 0} aria-label="Previous lesson"><ChevronLeft size={16} /> Previous</Button>
          <Button variant="secondary" aria-label="Next lesson" onClick={() => setActiveLessonIndex((index) => Math.min(lessons.length - 1, index + 1))} disabled={activeLessonIndex >= lessons.length - 1}>Next <ChevronRight size={16} /></Button>
        </div>
      </nav>
      <div className="enterprise-mesh-panel rounded-xl border border-[var(--border-color)] p-5 shadow-soft lg:p-6">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-primary)]">Learning player</p>
                <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{course.title}</h1>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Watch lessons, save notes, track progress, and discuss with other learners in one focused workspace.
                </p>
              </div>

              <div className="hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-soft lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Progress</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{progressPct}%</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{completedCount}/{lessons.length || 1} lessons completed</p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-soft sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary)]">{activeMeta.moduleTitle || 'Current lesson'}</p>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{activeLesson?.title || 'No lesson selected'}</h2>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{lessonKindLabel(activeKind)} {activeLesson?.durationMin ? `| ${activeLesson.durationMin} min` : ''}</p>
                </div>
                <label className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                  Speed
                  <select className="ml-2 bg-transparent text-sm text-[var(--text-primary)] outline-none" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(event.target.value)}>
                    {['0.75', '1', '1.25', '1.5', '2'].map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
                  </select>
                </label>
              </div>
              {activeLesson ? (
                <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border-color)] bg-slate-950">
                  {activeVideoUrl && isDirectVideo(activeVideoUrl) ? (
                    <video
                      key={`${activeLesson.id}-${activeVideoUrl}-${playbackSpeed}`}
                      className="aspect-video w-full bg-black"
                      controls
                      preload="metadata"
                      poster={activeMeta.thumbnailUrl || course.thumbnailUrl || ''}
                      onLoadedMetadata={(event) => { event.currentTarget.playbackRate = Number(playbackSpeed) }}
                      onRateChange={(event) => { event.currentTarget.playbackRate = Number(playbackSpeed) }}
                    >
                      <source src={activeVideoUrl} />
                      {activeMeta.captionsUrl ? <track src={activeMeta.captionsUrl} kind="captions" srcLang="en" label="English" default /> : null}
                    </video>
                  ) : activeVideoUrl ? (
                    <iframe className="aspect-video w-full border-0" src={activeVideoUrl} title={activeLesson.title} allow="autoplay; fullscreen; picture-in-picture" />
                  ) : activeKind === 'EXTERNAL_URL' && activeMeta.courseUrl ? (
                    <div className="grid aspect-video place-items-center bg-slate-950 p-8 text-center text-white">
                      <div>
                        <p className="text-lg font-semibold">External course lesson</p>
                        <a className="mt-4 inline-flex rounded-lg bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]" href={activeMeta.courseUrl} target="_blank" rel="noreferrer">Open Lesson URL</a>
                      </div>
                    </div>
                  ) : (
                    <div className="grid aspect-video place-items-center bg-slate-950 p-8 text-center text-slate-200">
                      <div>
                        <p className="text-lg font-semibold">Content ready</p>
                        <p className="mt-2 text-sm text-slate-400">Attach a video, external URL, PDF, or downloadable resource from the admin course editor.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 platform-empty-state min-h-[10rem] text-sm leading-7">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">No lessons yet</p>
                    <p className="mt-1 text-[var(--text-secondary)]">Add lessons from the admin course editor to activate the player experience.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-soft sm:p-5">
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary)]">Active instructor</p>
              <div className="mt-4 flex items-center gap-3">
                <img src={activeInstructor?.avatarUrl || course.thumbnailUrl || '/favicon.svg'} alt={activeInstructor?.name || 'Instructor'} className="h-12 w-12 rounded-xl border border-[var(--border-color)] object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-[var(--text-primary)]">{activeInstructor?.name || 'Instructor not selected'}</p>
                  <p className="truncate text-sm text-[var(--text-secondary)]">{activeInstructor?.expertise || course.category}</p>
                </div>
              </div>
              <Button variant="secondary" className="mt-4 w-full" onClick={toggleInstructorPanel}>
                {switchPanelOpen ? 'Close Instructor List' : 'Change Instructor'}
              </Button>
              {notice ? <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">{notice}</p> : null}
              {switchPanelOpen ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-soft">
                  <div className="border-b border-[var(--border-color)] p-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Choose any celebrity instructor
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Your completed lessons, quiz work, certificates, and course progress will stay unchanged.
                    </p>
                  </div>

                  {instructors.length ? (
                    <div className="max-h-[24rem] space-y-3 overflow-y-auto p-3 pr-2">
                      {instructors.map((instructor) => {
                        const active = String(instructor.id) === String(selectedInstructorId)
                        const current = activeInstructor?.id === instructor.id
                        return (
                          <button
                            key={instructor.id}
                            type="button"
                            onClick={() => setSelectedInstructorId(String(instructor.id))}
                            className={[
                              'flex w-full gap-3 rounded-lg border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                              active
                                ? 'border-cyan-500 bg-cyan-500/10 shadow-soft'
                                : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-subtle)]',
                            ].join(' ')}
                          >
                            <img
                              src={instructor.avatarUrl || '/favicon.svg'}
                              alt={instructor.name}
                              className="h-16 w-16 shrink-0 rounded-lg border border-[var(--border-color)] object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-[var(--text-primary)]">{instructor.name}</span>
                                {current ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[0.68rem] font-semibold text-emerald-700 dark:text-emerald-200">Current</span> : null}
                                {active && !current ? <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[0.68rem] font-semibold text-cyan-700 dark:text-cyan-200">Selected</span> : null}
                              </span>
                              <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                                {instructor.matchReason || instructor.expertise || course.category}
                              </span>
                              <span className="mt-2 line-clamp-2 block text-sm leading-5 text-[var(--text-secondary)]">
                                {instructor.bio || 'Available to guide your upcoming lessons and instructor interactions.'}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-[var(--text-secondary)]">
                      No celebrity instructors are available right now.
                    </div>
                  )}

                  <div className="border-t border-[var(--border-color)] bg-[var(--bg-elevated)] p-3">
                    {selectedInstructor ? (
                      <div className="mb-3 flex items-center gap-3 rounded-lg bg-[var(--bg-subtle)] p-3">
                        <img src={selectedInstructor.avatarUrl || '/favicon.svg'} alt={selectedInstructor.name} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Selected instructor</p>
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{selectedInstructor.name}</p>
                        </div>
                      </div>
                    ) : null}
                    <Button onClick={changeInstructor} disabled={switchingInstructor || !selectedInstructorId || selectedIsCurrent} className="w-full">
                      {switchingInstructor ? 'Switching...' : selectedIsCurrent ? 'Already Active' : `Confirm Change${selectedInstructor ? ` to ${selectedInstructor.name}` : ''}`}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Certificate unlock</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-card)]">
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: 'var(--brand-gradient)' }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {certificateReady ? 'Eligible after assessment review' : `${Math.max(0, 100 - progressPct)}% more progress needed`}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Complete lessons and pass course assessments to unlock certificate generation.</p>
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary)]">Lesson playlist</p>
            <div className="mt-5 space-y-4">
              {modules.length ? modules.map((module) => (
                <div key={module.title} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{module.title}</p>
                  <div className="space-y-2">
                    {module.lessons.map((lesson) => {
                      const index = lessons.findIndex((item) => item.id === lesson.id)
                      const completed = completedLessonIds.has(lesson.id)
                      const isActive = index === activeLessonIndex
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setActiveLessonIndex(index)}
                          className={[
                            'w-full rounded-lg p-3 text-left transition border',
                            isActive ? 'border-emerald-500/50 bg-emerald-500/10 text-[var(--text-primary)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-emerald-500/30 hover:bg-[var(--bg-subtle)]',
                          ].join(' ')}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{index + 1}. {lesson.title}</span>
                              <span className="mt-1 block text-xs text-[var(--text-muted)]">{lessonKindLabel(getLessonKind(lesson))}</span>
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">{completed ? 'Done' : lesson.durationMin ? `${lesson.durationMin}m` : lesson.type}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                  No lessons yet. Add course content to unlock the playlist.
                </div>
              )}
            </div>

            {assignments.length ? (
              <button
                type="button"
                onClick={() => navigate(`/course/${course.id}/assessments`)}
                className="w-full rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 text-left text-sm font-semibold text-amber-700 transition hover:bg-amber-500/15 dark:text-amber-100"
              >
                {assignments.length} assignment{assignments.length === 1 ? '' : 's'} available on the assignments page
              </button>
            ) : null}

            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--text-muted)]">Completion</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {completedCount === lessons.length && lessons.length ? 'All lessons completed.' : 'Complete lessons to unlock the next module.'}
              </p>
            </div>

            {switchHistory.length ? (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-5">
                <p className="text-sm uppercase tracking-[0.25em] text-[var(--text-muted)]">Instructor history</p>
                <div className="mt-3 space-y-2">
                  {switchHistory.slice(0, 3).map((item) => (
                    <p key={item.id} className="text-sm text-[var(--text-secondary)]">
                      {item.fromInstructor?.name || 'Original instructor'} to {item.toInstructor?.name || 'Instructor'} on {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

          </aside>

          <div className="space-y-5 lg:col-span-2">
            {activeLesson?.description ? (
              <div className="whitespace-pre-line rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                {activeLesson.description}
              </div>
            ) : null}
            {activeOutcomes.length ? (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Learning outcomes</p>
                <ul className="mt-3 grid gap-2 text-sm text-[var(--text-secondary)]">
                  {activeOutcomes.map((outcome) => <li key={outcome}>- {outcome}</li>)}
                </ul>
              </div>
            ) : null}
            {activeResources.length ? (
              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Attached files</p>
                <div className="mt-3 grid gap-2">
                  {activeResources.map((resource, index) => (
                    <a
                      key={`${resource.url}-${index}`}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--accent-primary)] transition hover:border-[var(--accent-primary)]/50"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">{resource.name || resource.url}</span>
                      <span className="text-xs text-[var(--text-muted)]">{resource.mimeType || 'file'}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setActiveLessonIndex((index) => Math.max(index - 1, 0))} disabled={activeLessonIndex <= 0}>
                Previous lesson
              </Button>
              <Button onClick={markComplete} disabled={!auth.user}>Mark complete</Button>
              <Button variant="secondary" onClick={() => setActiveLessonIndex((index) => Math.min(index + 1, lessons.length - 1))} disabled={activeLessonIndex >= lessons.length - 1}>
                Next lesson
              </Button>
              <Button variant="secondary" onClick={() => navigate(`/course/${course.id}/assessments`)}>
                View assignments{assignments.length ? ` (${assignments.length})` : ''}
              </Button>
            </div>
            <label className="block rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
              <span className="text-sm font-bold text-[var(--text-primary)]">My lesson notes</span>
              <textarea
                className="mt-3 min-h-28 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-primary)] outline-none"
                value={lessonNotes}
                onChange={(event) => setLessonNotes(event.target.value)}
                placeholder="Take private notes while watching this lesson."
              />
            </label>
          </div>
        </div>
      </div>

      <div className="learning-player-support-grid grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <section className="learning-player-resources-card glass-card rounded-xl p-5 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-primary)]">Resources and next steps</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <PlayerAction title="Assessment" text={`${assignments.length} assignment${assignments.length === 1 ? '' : 's'} available`} onClick={() => navigate(`/course/${course.id}/assessments`)} />
            <PlayerAction title="Course details" text="Review curriculum and instructor" onClick={() => navigate(`/course/${course.id}`)} />
            <PlayerAction title="Certificates" text={certificateReady ? 'Check eligibility status' : 'Unlock after completion'} onClick={() => navigate('/certificates')} />
          </div>
          <div className="mt-5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[var(--text-primary)]">Course resource library</p><p className="mt-1 text-xs text-[var(--text-muted)]">Files and links attached across all lessons</p></div><span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--accent-primary)]">{courseResources.length}</span></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {courseResources.length ? courseResources.map((resource, index) => <a key={`${resource.url}-${index}`} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-3 text-left transition hover:border-[var(--accent-primary)]/50"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">{resource.url ? <Download size={16} /> : <FileText size={16} />}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{resource.name || 'Lesson resource'}</span><span className="block truncate text-xs text-[var(--text-muted)]">{resource.lessonTitle}</span></span></a>) : <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-5 text-sm text-[var(--text-secondary)] sm:col-span-2">Resources added by instructors will appear here automatically.</div>}
            </div>
          </div>
          <div className="mt-5 grid gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Course progress summary</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {completedCount}/{lessons.length || 1} lessons completed. {certificateReady ? 'You are ready for the certificate path.' : `${Math.max(0, 100 - progressPct)}% more progress needed for certificate eligibility.`}
              </p>
            </div>
            <div className="min-w-[10rem]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-secondary)]">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--bg-card)]">
                <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: 'var(--brand-gradient)' }} />
              </div>
            </div>
          </div>
        </section>
        <ChatInterface courseId={course.id} roomId={`course:${course.id}`} />
      </div>
    </motion.section>
  )
}

function PlayerAction({ title, text, onClick }) {
  return (
    <button type="button" onClick={onClick} className="theme-subcard theme-subcard-hover rounded-lg p-4 text-left">
      <span className="block font-bold text-[var(--text-primary)]">{title}</span>
      <span className="mt-2 block text-sm leading-6 text-[var(--text-secondary)]">{text}</span>
    </button>
  )
}

function lessonKindLabel(kind) {
  return {
    UPLOADED_VIDEO: 'Uploaded video',
    AI_AVATAR_VIDEO: 'AI narrated video',
    EXTERNAL_URL: 'External URL',
    PDF_RESOURCE: 'PDF resource',
    DOWNLOADABLE_MATERIAL: 'Downloadable material',
  }[kind] || 'Lesson'
}

function isDirectVideo(url = '') {
  return /\.(mp4|webm|ogg)(\?|#|$)/i.test(url) || /^data:video\//.test(url)
}

function resolveActiveLessonVideoUrl(lesson, instructor) {
  const variants = lesson?.quizJson?.aiVideo?.instructorVideos
  if (Array.isArray(variants) && variants.length) {
    const active = variants.find((item) => String(item.instructorId) === String(instructor?.id))
    return active?.videoUrl || variants[0]?.videoUrl || lesson?.videoUrl || ''
  }
  return lesson?.videoUrl || ''
}
