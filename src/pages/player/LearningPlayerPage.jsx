import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { celebrityCourses } from '../../data/dummyData.js'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../animations/variants.js'
import Button from '../../components/ui/Button.jsx'

export default function LearningPlayerPage() {
  const { courseId } = useParams()
  const course = useMemo(() => celebrityCourses.find((item) => item.id === courseId) || celebrityCourses[0], [courseId])

  return (
    <motion.section className="space-y-10 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-glow lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr] lg:items-start">
          <div className="space-y-5">
            <div className="aspect-[16/9] overflow-hidden rounded-[2rem] bg-slate-900 shadow-xl">
              <iframe
                className="h-full w-full"
                src={course.trailer}
                title="Learning player"
                allow="autoplay; fullscreen"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-white">{course.title}</h1>
                <p className="mt-2 text-slate-400">Netflix-style learning experience with notes, quizzes, and AI study tools.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary">Bookmark</Button>
                <Button>Download PDF</Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Auto-save progress', 'Playback speed', 'Subtitles', 'AI notes'].map((feature) => (
                <div key={feature} className="rounded-3xl bg-slate-900/80 p-5 text-slate-300">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-soft">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Lesson playlist</p>
              <div className="mt-5 space-y-3">
                {course.curriculum.map((lesson, index) => (
                  <div key={lesson.title} className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span>{index + 1}. {lesson.title}</span>
                      <span className="text-sm text-slate-400">{lesson.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Progress</p>
              <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-3/4 bg-gradient-to-r from-cyan-400 to-violet-500" />
              </div>
              <p className="mt-3 text-sm text-slate-300">67% completed — complete the next module to unlock your certificate.</p>
            </div>
          </aside>
        </div>
      </div>
    </motion.section>
  )
}
