import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../utils/animationVariants.js'
import Button from '../../components/common/Button/Button.jsx'
import { fetchCourseById, fetchCourseInstructors, fetchUserProgress, switchCourseInstructor, updateUserProgress } from '../../api/api.js'
import { getCourseAssignments, getCourseLessons, getCourseModules, getLessonKind, getLessonOutcomes, getLessonResources, lessonMeta } from '../../utils/courseContent.js'

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
  const activeMeta = lessonMeta(activeLesson)
  const activeKind = getLessonKind(activeLesson)
  const activeOutcomes = getLessonOutcomes(activeLesson)

  useEffect(() => {
    if (!course?.id || !activeLesson?.id) return
    setLessonNotes(window.localStorage.getItem(`lesson-notes:${course.id}:${activeLesson.id}`) || '')
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
    return <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-8 text-red-700 dark:text-red-100">{error}</div>
  }

  return (
    <motion.section className="space-y-10 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="glass-card p-6 shadow-glow lg:p-8 light:bg-white/90">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">Learning</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">{course.title}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  Progress is stored in PostgreSQL and reloaded on every visit.
                </p>
              </div>

              <div className="hidden rounded-lg border border-[var(--border-color)] bg-black/[0.03] p-4 dark:bg-white/5 lg:block">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Progress</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">{progressPct}%</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{completedCount}/{lessons.length || 1} lessons completed</p>
              </div>
            </div>

            <div className="rounded-lg border border-[var(--border-color)] bg-white/85 p-6 dark:bg-slate-900/80">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">{activeMeta.moduleTitle || 'Current lesson'}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-slate-100">{activeLesson?.title || 'No lesson selected'}</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{lessonKindLabel(activeKind)} {activeLesson?.durationMin ? `| ${activeLesson.durationMin} min` : ''}</p>
                </div>
                <label className="rounded-lg border border-[var(--border-color)] bg-black/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:bg-white/5 dark:text-slate-300">
                  Speed
                  <select className="ml-2 bg-transparent text-sm text-slate-950 outline-none dark:text-slate-100" value={playbackSpeed} onChange={(event) => setPlaybackSpeed(event.target.value)}>
                    {['0.75', '1', '1.25', '1.5', '2'].map((speed) => <option key={speed} value={speed}>{speed}x</option>)}
                  </select>
                </label>
              </div>
              {activeLesson ? (
                <div className="mt-5 overflow-hidden rounded-lg border border-[var(--border-color)] bg-slate-950">
                  {activeLesson.videoUrl && isDirectVideo(activeLesson.videoUrl) ? (
                    <video
                      key={`${activeLesson.id}-${playbackSpeed}`}
                      className="aspect-video w-full bg-black"
                      controls
                      preload="metadata"
                      poster={activeMeta.thumbnailUrl || course.thumbnailUrl || ''}
                      onLoadedMetadata={(event) => { event.currentTarget.playbackRate = Number(playbackSpeed) }}
                      onRateChange={(event) => { event.currentTarget.playbackRate = Number(playbackSpeed) }}
                    >
                      <source src={activeLesson.videoUrl} />
                      {activeMeta.captionsUrl ? <track src={activeMeta.captionsUrl} kind="captions" srcLang="en" label="English" default /> : null}
                    </video>
                  ) : activeLesson.videoUrl ? (
                    <iframe className="aspect-video w-full border-0" src={activeLesson.videoUrl} title={activeLesson.title} allow="autoplay; fullscreen; picture-in-picture" />
                  ) : activeKind === 'EXTERNAL_URL' && activeMeta.courseUrl ? (
                    <div className="grid aspect-video place-items-center bg-slate-950 p-8 text-center text-white">
                      <div>
                        <p className="text-lg font-semibold">External course lesson</p>
                        <a className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950" href={activeMeta.courseUrl} target="_blank" rel="noreferrer">Open Lesson URL</a>
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
                <div className="mt-3 rounded-lg border border-[var(--border-color)] bg-black/[0.025] p-5 text-sm leading-7 text-slate-700 dark:bg-white/5 dark:text-slate-300">
                  No course lessons have been added yet.
                </div>
              )}
              {activeLesson?.description ? (
                <div className="mt-5 whitespace-pre-line rounded-lg border border-[var(--border-color)] bg-black/[0.025] p-4 text-sm leading-7 text-slate-700 dark:bg-white/5 dark:text-slate-300">
                  {activeLesson.description}
                </div>
              ) : null}
              {activeOutcomes.length ? (
                <div className="mt-5 rounded-lg border border-[var(--border-color)] bg-black/[0.025] p-4 dark:bg-white/5">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Learning outcomes</p>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300">
                    {activeOutcomes.map((outcome) => <li key={outcome}>- {outcome}</li>)}
                  </ul>
                </div>
              ) : null}
              {activeResources.length ? (
                <div className="mt-5 rounded-lg border border-[var(--border-color)] bg-white/70 p-4 dark:bg-slate-950/40">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">Attached files</p>
                  <div className="mt-3 grid gap-2">
                    {activeResources.map((resource, index) => (
                      <a
                        key={`${resource.url}-${index}`}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-color)] bg-black/[0.025] px-3 py-2 text-sm text-cyan-700 transition hover:border-cyan-400/50 dark:bg-white/5 dark:text-cyan-200"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">{resource.name || resource.url}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{resource.mimeType || 'file'}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={markComplete} disabled={!auth.user}>Mark complete</Button>
                <Button variant="secondary" onClick={() => setActiveLessonIndex((index) => Math.min(index + 1, lessons.length - 1))} disabled={activeLessonIndex >= lessons.length - 1}>
                  Next lesson
                </Button>
                <Button variant="secondary" onClick={() => navigate(`/course/${course.id}/assessments`)}>
                  View assignments{assignments.length ? ` (${assignments.length})` : ''}
                </Button>
              </div>
              <label className="mt-5 block rounded-lg border border-[var(--border-color)] bg-black/[0.025] p-4 dark:bg-white/5">
                <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">My lesson notes</span>
                <textarea
                  className="mt-3 min-h-28 w-full rounded-lg border border-[var(--border-color)] bg-white/80 p-3 text-sm text-slate-900 outline-none dark:bg-slate-950/70 dark:text-slate-100"
                  value={lessonNotes}
                  onChange={(event) => setLessonNotes(event.target.value)}
                  placeholder="Take private notes while watching this lesson."
                />
              </label>
            </div>
          </div>

          <aside className="space-y-6 rounded-lg border border-[var(--border-color)] bg-white/80 p-6 shadow-soft dark:bg-slate-950/75">
            <div className="rounded-lg border border-[var(--border-color)] bg-black/[0.03] p-5 dark:bg-white/5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-300">Active instructor</p>
              <div className="mt-4 flex items-center gap-3">
                <img src={activeInstructor?.avatarUrl || course.thumbnailUrl || '/favicon.svg'} alt={activeInstructor?.name || 'Instructor'} className="h-12 w-12 rounded-xl border border-[var(--border-color)] object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950 dark:text-slate-100">{activeInstructor?.name || 'Instructor not selected'}</p>
                  <p className="truncate text-sm text-slate-600 dark:text-slate-400">{activeInstructor?.expertise || course.category}</p>
                </div>
              </div>
              <Button variant="secondary" className="mt-4 w-full" onClick={toggleInstructorPanel}>
                {switchPanelOpen ? 'Close Instructor List' : 'Change Instructor'}
              </Button>
              {notice ? <p className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">{notice}</p> : null}
              {switchPanelOpen ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border-color)] bg-white/90 shadow-soft dark:bg-slate-950/75">
                  <div className="border-b border-[var(--border-color)] p-4">
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                      Choose any celebrity instructor
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
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
                                : 'border-[var(--border-color)] bg-white/80 hover:border-cyan-500/50 hover:bg-cyan-500/5 dark:bg-slate-900/75',
                            ].join(' ')}
                          >
                            <img
                              src={instructor.avatarUrl || '/favicon.svg'}
                              alt={instructor.name}
                              className="h-16 w-16 shrink-0 rounded-lg border border-[var(--border-color)] object-cover"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-slate-950 dark:text-slate-100">{instructor.name}</span>
                                {current ? <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[0.68rem] font-semibold text-emerald-700 dark:text-emerald-200">Current</span> : null}
                                {active && !current ? <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-[0.68rem] font-semibold text-cyan-700 dark:text-cyan-200">Selected</span> : null}
                              </span>
                              <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                                {instructor.matchReason || instructor.expertise || course.category}
                              </span>
                              <span className="mt-2 line-clamp-2 block text-sm leading-5 text-slate-600 dark:text-slate-400">
                                {instructor.bio || 'Available to guide your upcoming lessons and instructor interactions.'}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      No celebrity instructors are available right now.
                    </div>
                  )}

                  <div className="border-t border-[var(--border-color)] bg-white/95 p-3 dark:bg-slate-950/95">
                    {selectedInstructor ? (
                      <div className="mb-3 flex items-center gap-3 rounded-lg bg-black/[0.03] p-3 dark:bg-white/5">
                        <img src={selectedInstructor.avatarUrl || '/favicon.svg'} alt={selectedInstructor.name} className="h-10 w-10 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Selected instructor</p>
                          <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{selectedInstructor.name}</p>
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

            <p className="text-sm uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">Lesson playlist</p>
            <div className="mt-5 space-y-4">
              {modules.length ? modules.map((module) => (
                <div key={module.title} className="rounded-lg border border-[var(--border-color)] bg-black/[0.025] p-3 dark:bg-white/5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{module.title}</p>
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
                            isActive ? 'border-emerald-500/50 bg-emerald-500/10 text-slate-950 dark:border-emerald-300/50 dark:bg-emerald-300/10 dark:text-slate-100' : 'border-[var(--border-color)] bg-white/60 text-slate-700 hover:border-emerald-500/30 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-emerald-300/30',
                          ].join(' ')}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold">{index + 1}. {lesson.title}</span>
                              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{lessonKindLabel(getLessonKind(lesson))}</span>
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{completed ? 'Done' : lesson.durationMin ? `${lesson.durationMin}m` : lesson.type}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-[var(--border-color)] bg-black/[0.03] p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  No lessons yet.
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

            <div className="rounded-lg border border-[var(--border-color)] bg-black/[0.03] p-5 dark:bg-white/5">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Completion</p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {completedCount === lessons.length && lessons.length ? 'All lessons completed.' : 'Complete lessons to unlock the next module.'}
              </p>
            </div>

            {switchHistory.length ? (
              <div className="rounded-lg border border-[var(--border-color)] bg-black/[0.03] p-5 dark:bg-white/5">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Instructor history</p>
                <div className="mt-3 space-y-2">
                  {switchHistory.slice(0, 3).map((item) => (
                    <p key={item.id} className="text-sm text-slate-600 dark:text-slate-300">
                      {item.fromInstructor?.name || 'Original instructor'} to {item.toInstructor?.name || 'Instructor'} on {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

          </aside>
        </div>
      </div>
    </motion.section>
  )
}

function lessonKindLabel(kind) {
  return {
    UPLOADED_VIDEO: 'Uploaded video',
    AI_AVATAR_VIDEO: 'AI avatar video',
    EXTERNAL_URL: 'External URL',
    PDF_RESOURCE: 'PDF resource',
    DOWNLOADABLE_MATERIAL: 'Downloadable material',
  }[kind] || 'Lesson'
}

function isDirectVideo(url = '') {
  return /^\/uploads\//.test(url) || /\.(mp4|webm|ogg)(\?|#|$)/i.test(url) || /^data:video\//.test(url)
}
