import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { celebCourses } from '../../data/dummyData.js'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../animations/variants.js'
import Button from '../../components/ui/Button.jsx'

const PROGRESS_KEY_PREFIX = 'uptoskills-progress-v1'

function getProgressKey(courseId) {
  return `${PROGRESS_KEY_PREFIX}:${courseId}`
}

function safeParseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export default function LearningPlayerPage() {
  const { courseId } = useParams()

   const course = useMemo(
     () => celebCourses.find((item) => item.id === courseId) || celebCourses[0],
     [courseId],
   )

  return <LearningPlayerContent key={course.id} course={course} />
}

function LearningPlayerContent({ course }) {
  const lessons = course.curriculum || []
  const [activeLessonIndex, setActiveLessonIndex] = useState(0)

  const [completedMap, setCompletedMap] = useState(() => {
    const raw = window.localStorage.getItem(getProgressKey(course.id))
    const parsed = raw ? safeParseJson(raw) : null
    if (parsed && typeof parsed === 'object') return parsed
    return {}
  })

  useEffect(() => {
    window.localStorage.setItem(getProgressKey(course.id), JSON.stringify(completedMap))
  }, [course.id, completedMap])

  const completedCount = Object.values(completedMap).filter(Boolean).length
  const totalCount = lessons.length || 1
  const progressPct = Math.round((completedCount / totalCount) * 100)

  const isLessonCompleted = (index) => Boolean(completedMap[String(index)])

  const maxUnlockedIndex = (() => {
    const firstIncomplete = lessons.findIndex((_, idx) => !isLessonCompleted(idx))
    if (firstIncomplete === -1) return Math.max(0, lessons.length - 1)
    return Math.max(0, firstIncomplete)
  })()

  const canSelectLesson = (idx) => idx <= maxUnlockedIndex
  const activeLesson = lessons[activeLessonIndex] || lessons[0]

  const [markCompleteBusy, setMarkCompleteBusy] = useState(false)

  const handleMarkComplete = () => {
    if (markCompleteBusy) return
    setMarkCompleteBusy(true)
    setCompletedMap((prev) => ({ ...prev, [String(activeLessonIndex)]: true }))
    setMarkCompleteBusy(false)
  }

  const handleNext = () => {
    if (!isLessonCompleted(activeLessonIndex)) return
    const nextIdx = activeLessonIndex + 1
    if (nextIdx < lessons.length && canSelectLesson(nextIdx)) setActiveLessonIndex(nextIdx)
  }

  return (
    <motion.section className="space-y-10 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 text-slate-100 shadow-glow lg:p-8 p-6">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Learning</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-100">
                  {course.title}
                </h1>
                <p className="mt-2 text-slate-400">
                  Complete the lesson to unlock "Next".
                </p>
              </div>

              <div className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-4 lg:block">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  Progress
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-100">
                  {progressPct}%
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {completedCount}/{totalCount} lessons completed
                </p>
              </div>
            </div>

            <div className="aspect-[16/9] overflow-hidden rounded-[2rem] bg-slate-900 shadow-xl">
              <iframe
                className="h-full w-full"
                src={course.trailer}
                title={`Lesson: ${activeLesson?.title || 'Lesson'}`}
                allow="autoplay; fullscreen"
              />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    {activeLesson?.title || 'Lesson'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {activeLesson?.length || ''}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isLessonCompleted(activeLessonIndex) ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-400/15 px-3 py-2 text-sm text-emerald-200 border border-emerald-300/30">
                      Completed
                    </span>
                  ) : (
                    <Button variant="secondary" onClick={handleMarkComplete} disabled={markCompleteBusy}>
                      Mark complete
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <Button
                  onClick={handleNext}
                  disabled={!isLessonCompleted(activeLessonIndex) || activeLessonIndex >= lessons.length - 1}
                >
                  Next
                </Button>

                {isLessonCompleted(activeLessonIndex) ? (
                  <p className="text-sm text-emerald-200">
                    Video completed - go to Next to continue.
                  </p>
                ) : (
                  <p className="text-sm text-slate-400">
                    When you finish the video, click "Mark complete".
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {['Auto-save progress', 'Playback speed', 'Subtitles', 'AI notes'].map((feature) => (
                <div
                  key={feature}
                  className="rounded-3xl bg-white/90 text-slate-600 border border-black/10"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-soft">
            <div className="space-y-6 rounded-[2rem] p-0">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 px-1">Lesson playlist</p>

              <div className="mt-5 space-y-3">
                {lessons.map((lesson, index) => {
                  const completed = isLessonCompleted(index)
                  const unlocked = canSelectLesson(index)
                  const isActive = index === activeLessonIndex

                  return (
                    <button
                      key={lesson.title}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => setActiveLessonIndex(index)}
                      className={[
                        'w-full rounded-3xl p-4 text-left transition border',
                        isActive ? 'border-emerald-300/50 bg-emerald-300/10 text-slate-100' : '',
                        !isActive
                          ? 'border-white/10 bg-slate-900/40 text-slate-300 hover:border-emerald-300/30'
                          : '',
                        !unlocked ? 'opacity-50 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate">
                          {index + 1}. {lesson.title}
                        </span>
                        <span className="text-sm text-slate-400">
                          {completed ? 'Done' : lesson.length}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                Completion
              </p>
              <p className="mt-3 text-sm text-slate-300">
                {completedCount === totalCount
                  ? 'All lessons completed - certificate ready.'
                  : 'Complete the next lesson to unlock your next module.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  )
}
