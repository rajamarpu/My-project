import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, CheckCircle2, Play, Sparkles, Trophy, Zap, Users, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import CourseCard from '../../components/ui/Course/CourseCard.jsx'
import PersonalityCard from '../../components/ui/TeacherSwitcher/PersonalityCard.jsx'
import { fetchCourses, fetchPlatformSummary } from '../../api/api.js'
import { aiPersonalities } from '../../constants/aiPersonalities.js'
import Button from '../../components/common/Button/Button.jsx'
import { pageTransition } from '../../utils/animationVariants.js'

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
  const auth = useSelector((state) => state.auth)
  const particles = useMemo(() => generateParticlePositions(26), [])
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

  const startLearning = () => {
    if (auth.user && auth.token) {
      navigate('/dashboard')
      return
    }
    navigate('/register')
  }

  return (
    <motion.section className="w-full max-w-full space-y-8 pb-14 sm:space-y-10 xl:space-y-12" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <section className="relative isolate w-full max-w-full overflow-hidden rounded-xl border border-[var(--border-color)] bg-white px-[clamp(16px,4vw,48px)] py-[clamp(20px,3vw,40px)] text-[var(--text-primary)] shadow-[0_28px_90px_rgba(37,99,235,0.14)] transition-colors dark:bg-[var(--bg-secondary)] sm:rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(37,99,235,0.15),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(6,182,212,0.16),transparent_30%),radial-gradient(circle_at_54%_90%,rgba(219,39,119,0.10),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,251,255,0.96))] dark:bg-[radial-gradient(circle_at_18%_15%,rgba(56,189,248,0.22),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(45,212,191,0.16),transparent_30%),linear-gradient(135deg,rgba(7,29,47,0.98),rgba(8,62,87,0.94))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-secondary)]/50 to-transparent" />
        {particles.map((pos, index) => (
          <motion.span
            key={index}
            className="absolute h-1 w-1 rounded-full bg-[var(--accent-secondary)]/70"
            style={{ left: pos.left, top: pos.top }}
            animate={{ opacity: [0.15, 0.9, 0.15], y: [0, -16, 0] }}
            transition={{ duration: pos.duration, repeat: Infinity, delay: pos.delay }}
          />
        ))}

        <div className="relative grid w-full gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:items-center xl:gap-8 2xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,0.85fr)]">
          <div className="w-full max-w-[72rem] space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-secondary)]/35 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 dark:bg-white/10 dark:text-cyan-100">
              <Sparkles size={16} />
              XP tracks, badges, and AI teachers built for freshers
            </div>
            <div className="space-y-4">
              <h1 className="text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[1.04] tracking-normal text-slate-800 dark:text-white">
                Learn faster with a
                <span className="block text-[var(--accent-bold)] dark:text-pink-300">
                  gamified skill campus
                </span>
                built for
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-orange-500 bg-clip-text text-transparent">
                  {' '}your career.
                </span>
              </h1>
              <motion.p
                className="max-w-[56rem] text-base leading-7 text-[var(--text-secondary)] dark:text-slate-300 sm:text-lg sm:leading-8 xl:text-xl xl:leading-9"
                initial={{ opacity: 0.2 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Switch between AI mentor personalities, earn achievements as you progress, and follow clean course paths that make serious upskilling feel playful and approachable.
              </motion.p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={startLearning} className="min-h-12">
                Start learning <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/personalities')} className="min-h-12 border-cyan-400/45 text-cyan-700 dark:text-cyan-100">
                <Play size={16} className="mr-2" /> Preview teachers
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:max-w-4xl">
              {[
                [summary.totalLearners, 'learners on leaderboard'],
                [summary.totalInstructors, 'AI mentor styles'],
                [summary.totalCourses, 'skill quests live'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-[var(--border-color)] bg-white/90 p-4 shadow-[0_18px_48px_rgba(37,99,235,0.10)] dark:bg-white/[0.07]">
                  <p className="text-2xl font-semibold text-blue-600 dark:text-white">{value}</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)] dark:text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative w-full">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-blue-500/18 via-cyan-400/18 to-pink-500/12 blur-2xl sm:-inset-5" />
            <div className="relative rounded-xl border border-[var(--border-color)] bg-white/88 p-4 shadow-2xl backdrop-blur-xl dark:bg-white/[0.08] sm:rounded-[2rem] sm:p-5">
              <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Career-ready progress</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-800 dark:text-white">Build proof as you learn</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] dark:text-slate-300">Turn lessons into XP, badges, and visible milestones recruiters can understand.</p>
                </div>
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-[0_16px_38px_rgba(245,158,11,0.18)] dark:border-amber-200/30 dark:from-slate-900 dark:to-slate-800">
                  <Trophy className="h-10 w-10 text-amber-500" />
                </div>
              </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-soft dark:border-white/10 dark:from-slate-900/80 dark:to-slate-800/80">
                  <div className="flex items-center gap-3">
                    <Zap className="text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">XP Points</p>
                      <p className="text-xs text-[var(--text-muted)] dark:text-slate-400">Complete lessons to earn more</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-amber-500">0</span>
                </div>

                <div className="flex items-center justify-between rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-soft dark:border-white/10 dark:from-slate-900/80 dark:to-slate-800/80">
                  <div className="flex items-center gap-3">
                    <Target className="text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Skill Badges</p>
                      <p className="text-xs text-[var(--text-muted)] dark:text-slate-400">Unlock by mastering topics</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-500">0</span>
                </div>

                <div className="rounded-3xl border border-[var(--border-color)] bg-white/75 p-4 shadow-soft dark:bg-slate-950/75">
                  <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
                    <Sparkles className="text-cyan-600 dark:text-cyan-200" />
                    <p className="text-sm leading-6">
                      Start your first course to begin earning achievements and tracking your learning streak.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-full space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Indian celebrity AI teachers</p>
            <h2 className="mt-2 text-[clamp(1.65rem,4vw,2.35rem)] font-semibold leading-tight text-white">Pick an actor or cricketer personality for the lesson</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/personalities')}>View all</Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {aiPersonalities.map((personality) => (
            <PersonalityCard key={personality.id} personality={personality} />
          ))}
        </div>
      </section>

      <section className="w-full max-w-full space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Trending AI courses</p>
            <h2 className="mt-2 text-[clamp(1.65rem,4vw,2.35rem)] font-semibold leading-tight text-white">Career tracks with adaptive guidance</h2>
          </div>
          <Button variant="secondary" onClick={() => navigate('/explore')}>Explore catalog</Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

      <section className="grid w-full max-w-full gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="glass-card p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Learning paths</p>
          <h2 className="mt-2 text-[clamp(1.65rem,4vw,2.35rem)] font-semibold leading-tight text-white">Structured routes, not random browsing</h2>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <section className="grid w-full max-w-full gap-5 md:grid-cols-3">
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

      <section className="glass-card w-full max-w-full p-5 sm:p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">FAQ</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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


