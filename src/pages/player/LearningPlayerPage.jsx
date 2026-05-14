import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, FileText, Lock, MessageCircle, PlayCircle } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { fadeInUp } from '../../animations/variants.js'
import { courseAPI, progressAPI } from '../../services/api.js'

export default function LearningPlayerPage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [progress, setProgress] = useState([])
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [notes, setNotes] = useState('')
  const [activePanel, setActivePanel] = useState('notes')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [courseResponse, progressResponse] = await Promise.all([
        courseAPI.getCourseById(courseId),
        progressAPI.getCourseProgress(courseId),
      ])
      setCourse(courseResponse.data.course)
      setProgress(progressResponse.data.progress)
      setActiveLessonId(courseResponse.data.course.lessons[0]?.id)
    }
    load()
  }, [courseId])

  const activeLesson = useMemo(() => course?.lessons.find((lesson) => lesson.id === activeLessonId), [course, activeLessonId])
  const completedIds = useMemo(() => progress.filter((item) => item.completed).map((item) => item.lessonId), [progress])
  const progressPercent = useMemo(() => course ? Math.round((completedIds.length / course.lessons.length) * 100) : 0, [completedIds.length, course])

  useEffect(() => {
    const record = progress.find((item) => item.lessonId === activeLessonId)
    setNotes(record?.notes || activeLesson?.notes || '')
  }, [activeLessonId, activeLesson, progress])

  const saveProgress = async (completed = false) => {
    if (!activeLesson) return
    setSaving(true)
    const response = await progressAPI.saveLessonProgress(course.id, activeLesson.id, { completed, notes, secondsWatched: 60 })
    setProgress((current) => {
      const next = current.filter((item) => item.lessonId !== activeLesson.id)
      return [...next, response.data.progress]
    })
    setSaving(false)
  }

  if (!course || !activeLesson) return <div className="h-[70vh] animate-pulse rounded-[2rem] bg-white/10" />

  return (
    <motion.section className="space-y-6 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-glow">
            <div className="aspect-video">
              <iframe className="h-full w-full" src={activeLesson.videoUrl} title={activeLesson.title} allow="autoplay; fullscreen" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">{course.title}</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">{activeLesson.title}</h1>
                <p className="mt-2 text-slate-400">Playback speed, fullscreen, subtitles, notes, resources, quiz, and discussion are available from this player workspace.</p>
              </div>
              <Button disabled={saving} onClick={() => saveProgress(true)}>
                <CheckCircle2 size={16} className="mr-2" /> {saving ? 'Saving...' : 'Mark complete'}
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
            <div className="flex flex-wrap gap-3">
              {['notes', 'quiz', 'resources', 'discussion'].map((panel) => (
                <button key={panel} onClick={() => setActivePanel(panel)} className={`rounded-full px-4 py-2 text-sm capitalize ${activePanel === panel ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-300'}`}>
                  {panel}
                </button>
              ))}
            </div>

            {activePanel === 'notes' && (
              <div className="mt-5 space-y-3">
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => saveProgress(false)} rows={7} className="w-full rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-slate-100 outline-none focus:border-cyan-300" />
                <p className="text-sm text-slate-500">Notes auto-save when you leave the field.</p>
              </div>
            )}

            {activePanel === 'quiz' && (
              <div className="mt-5 space-y-4">
                {activeLesson.quiz.map((item) => (
                  <div key={item.question} className="rounded-3xl bg-slate-900/80 p-5">
                    <p className="font-semibold text-white">{item.question}</p>
                    <div className="mt-4 grid gap-2">
                      {item.options.map((option, index) => <button key={option} className="rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10">{index + 1}. {option}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activePanel === 'resources' && (
              <div className="mt-5 grid gap-3">
                {activeLesson.resources.map((resource) => <a key={resource.label} href={resource.url} target="_blank" rel="noreferrer" className="rounded-3xl bg-slate-900/80 p-4 text-cyan-200 hover:bg-white/10">{resource.label}</a>)}
              </div>
            )}

            {activePanel === 'discussion' && (
              <div className="mt-5 rounded-3xl bg-slate-900/80 p-5 text-slate-300">
                <MessageCircle className="mb-3 text-cyan-300" size={20} />
                Ask a course question from the Community page and include this lesson title.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5 rounded-[2rem] border border-white/10 bg-slate-950/85 p-5 shadow-glow">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Progress tracker</p>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-300">{progressPercent}% completed</p>
          </div>

          <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
            {course.modules.map((module) => (
              <div key={module.id} className="rounded-[1.5rem] bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{module.level}</p>
                <h2 className="mt-2 font-semibold text-white">{module.title}</h2>
                <div className="mt-4 space-y-2">
                  {module.lessons.map((lesson) => {
                    const completed = completedIds.includes(lesson.id)
                    const active = activeLessonId === lesson.id
                    return (
                      <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left text-sm transition ${active ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950/80 text-slate-300 hover:bg-white/10'}`}>
                        {completed ? <CheckCircle2 size={17} /> : active ? <PlayCircle size={17} /> : <Lock size={17} />}
                        <span className="flex-1">{lesson.title}</span>
                        <span>{lesson.durationMinutes}m</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
            <FileText className="mb-3 text-cyan-300" size={20} />
            Certificate unlocks automatically when all lessons are complete.
          </div>
        </aside>
      </div>
    </motion.section>
  )
}
