import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, MessageSquareText, Play, Sparkles, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CourseCard from '../../components/ui/Course/CourseCard.jsx'
import PersonalityCard from '../../components/ui/TeacherSwitcher/PersonalityCard.jsx'
import { fetchCourses, fetchPlatformSummary } from '../../api/api.js'
import { aiPersonalities } from '../../constants/aiPersonalities.js'
import Button from '../../components/common/Button/Button.jsx'
import { pageTransition } from '../../utils/animationVariants.js'
import { cn } from '../../utils/classNames.js'

function generateParticlePositions(count) {
  return Array.from({ length: count }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    top: `${(index * 53) % 100}%`,
    duration: 3 + (index % 5),
    delay: (index % 6) * 0.22,
  }))
}

const learningPaths = ['Prompt Engineering', 'Fullstack AI Apps', 'Data Analyst Launchpad', 'Product Design Sprint']
const faqs = [
  ['Can I switch virtual teachers mid-course?', 'Yes. The selected teacher changes the tone, pacing, voice preview, and lesson guidance without resetting progress.'],
  ['Is this ready for real backend APIs?', 'The frontend is structured around protected routes, JWT storage, Axios services, and role-based views.'],
  ['How is this different from a generic course marketplace?', 'The core experience is the Indian celebrity-inspired AI teacher layer: personality, voice style, teaching style, mentor suggestions, and adaptive recommendations.'],
]

export default function LandingPage() {
  const navigate = useNavigate()
  const particles = useMemo(() => generateParticlePositions(26), [])
  const [activeTeacher, setActiveTeacher] = useState(aiPersonalities[0])
  const [courses, setCourses] = useState([])
  const [summary, setSummary] = useState({
    totalLearners: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalCategories: 0,
  })

  useEffect(() => {
    let isMounted = true
    async function loadLiveData() {
      try {
        const [summaryRes, coursesRes] = await Promise.all([
          fetchPlatformSummary().catch(() => ({ data: {} })),
          fetchCourses().catch(() => ({ data: { courses: [] } })),
        ])
        if (!isMounted) return
        const liveSummary = summaryRes.data?.summary || summaryRes.data || {}
        setSummary({
          totalLearners: liveSummary.totalLearners ?? 0,
          totalInstructors: liveSummary.totalInstructors ?? 0,
          totalCourses: liveSummary.totalCourses ?? 0,
          totalCategories: liveSummary.totalCategories ?? 0,
        })
        setCourses(coursesRes.data?.courses || coursesRes.data || [])
      } catch (error) {
        console.error('Failed to load landing data:', error)
      }
    }
    void loadLiveData()
    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(() => {
    const counts = courses.reduce((acc, course) => {
      const category = course.category || 'Uncategorized'
      acc.set(category, (acc.get(category) || 0) + 1)
      return acc
    }, new Map())
    return Array.from(counts, ([name, count]) => ({ id: name, name, count })).slice(0, 6)
  }, [courses])

  return (
    <motion.section className="space-y-20 pb-20" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <section className="theme-dark relative isolate overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-slate-950 px-5 py-8 shadow-glow sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(14,165,233,0.22),transparent_30%),radial-gradient(circle_at_84%_20%,rgba(20,184,166,0.16),transparent_28%),linear-gradient(135deg,rgba(7,24,39,0.98),rgba(2,6,23,0.96))]" />
        {particles.map((pos, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-cyan-200/80"
            style={{ left: pos.left, top: pos.top }}
            animate={{ opacity: [0.15, 0.9, 0.15], y: [0, -16, 0] }}
            transition={{ duration: pos.duration, repeat: Infinity, delay: pos.delay }}
          />
        ))}

        <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="max-w-3xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              <Sparkles size={16} />
              Indian actor and cricketer AI teachers with voice, tone, and adaptive lesson style
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-normal text-white sm:text-5xl lg:text-6xl">
                Learn with an Indian celebrity-inspired teacher built for
                <span className="block bg-gradient-to-r from-cyan-200 via-teal-200 to-amber-100 bg-clip-text text-transparent">
                  your brain.
                </span>
              </h1>
              <motion.p
                className="max-w-2xl text-lg leading-8 text-slate-300"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Switch between AI personalities inspired by Indian actors and cricketers, preview teaching tones, and keep the same course progress while the style adapts around you.
              </motion.p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => navigate('/register')} className="min-h-12">
                Start learning <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/personalities')} className="min-h-12">
                <Play size={16} className="mr-2" /> Preview teachers
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [summary.totalLearners, 'registered learners'],
                [summary.totalInstructors, 'instructors'],
                [summary.totalCourses, 'published courses'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-sm text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-r from-cyan-400/20 via-teal-500/20 to-amber-300/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Live celebrity teacher switch</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{activeTeacher.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">{activeTeacher.specialty}</p>
                </div>
                <img src={activeTeacher.avatar} alt={`${activeTeacher.name} avatar`} className="h-20 w-20 rounded-3xl border border-cyan-200/30 bg-slate-900 p-1" />
              </div>

              <div className={cn('mt-6 rounded-3xl border border-white/10 bg-gradient-to-br p-5', activeTeacher.colorTheme.bg)}>
                <div className="flex items-center gap-3 text-slate-100">
                  <MessageSquareText className="text-cyan-200" />
                  <p className="text-sm leading-6">
                    "I will teach this as {activeTeacher.teachingStyle.toLowerCase()}."
                  </p>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                  <span className="rounded-2xl bg-slate-950/45 p-3">Voice: {activeTeacher.voiceStyle}</span>
                  <span className="rounded-2xl bg-slate-950/45 p-3">Tone: {activeTeacher.teachingTone}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {aiPersonalities.map((teacher) => (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => setActiveTeacher(teacher)}
                    className={cn(
                      'rounded-2xl border p-3 text-left transition',
                      activeTeacher.id === teacher.id
                        ? 'border-cyan-200 bg-cyan-300/15 text-white'
                        : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-300/40',
                    )}
                  >
                    <span className="block text-sm font-semibold">{teacher.name}</span>
                    <span className="mt-1 block text-xs text-slate-400">{teacher.category}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Indian celebrity AI teachers</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Pick an actor or cricketer personality for the lesson</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/personalities')}>View all</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {aiPersonalities.map((personality) => (
            <PersonalityCard key={personality.id} personality={personality} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Trending AI courses</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Career tracks with adaptive guidance</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/explore')}>Explore catalog</Button>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {courses.length ? (
            courses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} onViewDetails={() => navigate(`/course/${course.id}`)} />
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 text-slate-300 lg:col-span-3">
              Courses published by admin will appear here automatically.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="glass-card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Learning paths</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Structured routes, not random browsing</h2>
          <p className="mt-4 text-slate-300">Each path pairs courses with an AI mentor mode, weekly goals, and project checkpoints.</p>
          <div className="mt-6 space-y-3">
            {learningPaths.map((path) => (
              <div key={path} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-slate-200">
                <CheckCircle2 className="text-emerald-300" size={18} />
                {path}
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.length ? categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => navigate(`/explore?category=${encodeURIComponent(category.name)}`)}
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.08]"
            >
              <BookOpen className="text-cyan-300" />
              <p className="mt-4 text-lg font-semibold text-white">{category.name}</p>
              <p className="mt-1 text-sm text-slate-400">{category.count} courses</p>
            </button>
          )) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-slate-300 sm:col-span-2">
              {summary.totalCategories} categories are available in the database.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          ['Learners', summary.totalLearners],
          ['Courses', summary.totalCourses],
          ['Categories', summary.totalCategories],
        ].map(([label, value]) => (
          <div key={label} className="glass-card p-6">
            <Users className="text-teal-300" />
            <p className="mt-5 text-3xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-400">{label} from the live database</p>
          </div>
        ))}
      </section>

      <section className="glass-card p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">FAQ</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {faqs.map(([question, answer]) => (
            <div key={question} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
              <h3 className="font-semibold text-white">{question}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.section>
  )
}


