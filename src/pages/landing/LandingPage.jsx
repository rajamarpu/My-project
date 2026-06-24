import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Award, BookOpen, BriefcaseBusiness, CheckCircle2, Compass,
  GraduationCap, Layers3, PlayCircle, Sparkles, Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import CourseCard from '../../components/ui/Course/CourseCard.jsx'
import { fetchCourses, fetchLearnerDashboard, fetchPlatformSummary } from '../../api/api.js'
import Button from '../../components/common/Button/Button.jsx'
import { pageTransition } from '../../utils/animationVariants.js'

const learningPaths = [
  { title: 'Web Development', text: 'Learn HTML, CSS, JavaScript, React, and modern frontend workflows.', icon: Sparkles },
  { title: 'Technical', text: 'Strengthen programming, backend, cloud, database, and problem-solving skills.', icon: BriefcaseBusiness },
  { title: 'Python to AI/ML', text: 'Start with Python foundations, then move into AI, machine learning, and applied projects.', icon: Target },
  { title: 'Career Growth', text: 'Build communication, leadership, and workplace readiness skills.', icon: Award },
]

const benefits = [
  { title: 'Structured learning', text: 'Clear course sequences replace random browsing.', icon: Layers3 },
  { title: 'Expert instruction', text: 'Learn with experienced instructors and guided mentors.', icon: GraduationCap },
  { title: 'Practical assessment', text: 'Assignments and assessments reinforce every skill.', icon: Target },
  { title: 'Visible progress', text: 'Track course completion, study time, and streaks.', icon: Compass },
  { title: 'Verified certificates', text: 'Turn completed learning into shareable credentials.', icon: Award },
  { title: 'Career readiness', text: 'Connect practical skills to employability outcomes.', icon: BriefcaseBusiness },
]

const journeySteps = [
  { title: 'Discover', text: 'Choose the right course and learning path.', icon: Compass },
  { title: 'Learn', text: 'Follow structured lessons with expert guidance.', icon: BookOpen },
  { title: 'Practice', text: 'Complete assignments and skill assessments.', icon: Target },
  { title: 'Prove', text: 'Earn certificates and visible progress records.', icon: Award },
]

function enrollmentCount(course) {
  return Number(course.enrollmentCount ?? course._count?.enrollments ?? course.enrollments?.length ?? 0)
}

export default function LandingPage() {
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [courses, setCourses] = useState([])
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ totalLearners: 0, totalInstructors: 0, totalCourses: 0, totalCategories: 0 })

  useEffect(() => {
    let active = true
    async function loadHome() {
      const [summaryResponse, courseResponse, dashboardResponse] = await Promise.all([
        fetchPlatformSummary().catch(() => ({ data: {} })),
        fetchCourses().catch(() => ({ data: { courses: [] } })),
        auth.user && auth.token ? fetchLearnerDashboard().catch(() => ({ data: { dashboard: { enrollments: [] } } })) : Promise.resolve({ data: { dashboard: { enrollments: [] } } }),
      ])
      if (!active) return
      const liveSummary = summaryResponse.data?.summary || summaryResponse.data || {}
      setSummary({
        totalLearners: liveSummary.totalLearners ?? 0,
        totalInstructors: liveSummary.totalInstructors ?? 0,
        totalCourses: liveSummary.totalCourses ?? 0,
        totalCategories: liveSummary.totalCategories ?? 0,
      })
      setCourses(courseResponse.data?.courses || courseResponse.data || [])
      setEnrolledCourses((dashboardResponse.data?.dashboard?.enrollments || []).map((enrollment) => ({ ...enrollment.course, progress: Math.round(Number(enrollment.completionPct || 0)), enrollment })).filter((course) => course.id))
      setLoading(false)
    }
    void loadHome()
    return () => { active = false }
  }, [auth.token, auth.user])

  const categories = useMemo(() => {
    const counts = new Map()
    courses.forEach((course) => counts.set(course.category || 'Uncategorized', (counts.get(course.category || 'Uncategorized') || 0) + 1))
    return Array.from(counts, ([name, count]) => ({ name, count })).slice(0, 8)
  }, [courses])
  const popular = useMemo(() => [...courses].sort((a, b) => enrollmentCount(b) - enrollmentCount(a)).slice(0, 3), [courses])
  const popularIds = useMemo(() => new Set(popular.map((course) => course.id)), [popular])
  const recommended = useMemo(() => courses.filter((course) => !popularIds.has(course.id)).slice(0, 4), [courses, popularIds])
  const heroStats = useMemo(() => [
    { label: 'Learners', value: summary.totalLearners.toLocaleString('en-IN') },
    { label: 'Courses', value: summary.totalCourses.toLocaleString('en-IN') },
    { label: 'Mentors', value: summary.totalInstructors.toLocaleString('en-IN') },
    { label: 'Categories', value: summary.totalCategories.toLocaleString('en-IN') },
  ], [summary])
  const featuredCourse = popular[0] || courses[0]

  function startLearning() {
    navigate(auth.user && auth.token ? '/dashboard' : '/register')
  }

  return (
    <motion.section className="w-full space-y-10 pb-16 xl:space-y-14" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)]">
        <div className="enterprise-mesh-panel relative overflow-hidden rounded-3xl border border-[var(--border-color)] px-[clamp(20px,4vw,52px)] py-[clamp(28px,4vw,52px)] shadow-soft">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.6),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.12),transparent_26%),linear-gradient(135deg,rgba(15,23,42,0.18),rgba(15,23,42,0))]" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)] shadow-soft">
              <Sparkles size={16} />
              Practical learning for real careers
            </span>
            <div className="mt-5 max-w-2xl space-y-4">
              <h1 className="text-[clamp(2.35rem,4.2vw,4.25rem)] font-black leading-[0.94] tracking-[-0.07em] text-[var(--text-primary)]">
                Build skills.
                {' '}
                <span className="upto-brand-text">Track progress.</span>
                {' '}
                <span className="block">Move your career forward.</span>
              </h1>
              <p className="max-w-2xl text-[1rem] leading-7 text-[var(--text-secondary)] sm:text-[1.05rem]">
                Learn through structured courses, practical assignments, assessments, expert guidance, and certificates designed for employability.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={startLearning} className="min-h-12">
                {auth.user ? 'Open dashboard' : 'Start learning'}
                <ArrowRight size={17} />
              </Button>
              <Button variant="secondary" onClick={() => navigate('/courses')} className="min-h-12">
                <Compass size={17} />
                Explore courses
              </Button>
              <Button variant="secondary" onClick={() => navigate('/dashboard')} className="min-h-12">
                <GraduationCap size={17} />
                View progress
              </Button>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-elevated)]/88 p-4 shadow-soft backdrop-blur">
                  <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{item.label}</p>
                  <p className="mt-1.5 text-[1.5rem] font-black leading-none text-[var(--text-primary)]">{item.value}</p>
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">Live platform snapshot</p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Learner-first', 'AI mentor support', 'Career-focused', 'Mobile friendly'].map((chip) => (
                <span key={chip} className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] shadow-sm">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="platform-card flex flex-col overflow-hidden rounded-3xl p-5 shadow-[var(--shadow-lg)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Your learning journey</p>
              <h2 className="mt-2 text-[1.4rem] font-black leading-tight text-[var(--text-primary)] sm:text-[1.6rem]">From first lesson to career proof</h2>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <GraduationCap size={23} />
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            {journeySteps.map((step, index) => (
              <div key={step.title} className="theme-subcard grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 rounded-2xl p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                  <step.icon size={18} />
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm text-[var(--text-primary)]">
                    {index + 1}. {step.title}
                  </strong>
                  <span className="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">{step.text}</span>
                </span>
                <CheckCircle2 size={17} className="shrink-0 text-[var(--color-success)]" />
              </div>
            ))}
          </div>

          {featuredCourse ? (
            <button
              type="button"
              onClick={() => navigate(`/course/${featuredCourse.id}`)}
              className="mt-5 rounded-2xl border border-[var(--accent-primary)]/20 bg-[var(--accent-soft)] p-4 text-left transition hover:border-[var(--accent-primary)]"
            >
              <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--accent-primary)]">Featured course</span>
              <span className="mt-2 flex items-start justify-between gap-3">
                <strong className="line-clamp-2 text-sm leading-6 text-[var(--text-primary)]">{featuredCourse.title}</strong>
                <ArrowRight size={16} className="shrink-0 text-[var(--accent-primary)]" />
              </span>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {featuredCourse.category || 'Uncategorized'}
                {' '}
                {enrollmentCount(featuredCourse) ? `· ${enrollmentCount(featuredCourse)} learners` : ''}
              </p>
              <span className="mt-4 block h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                <span className="block h-full w-[72%] rounded-full bg-[var(--brand-gradient)]" />
              </span>
            </button>
          ) : null}

          <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
            {[[summary.totalLearners, 'Learners'], [summary.totalCourses, 'Courses'], [summary.totalInstructors, 'Mentors']].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-[var(--bg-subtle)] p-3 text-center">
                <strong className="block text-lg text-[var(--accent-primary)]">{value}</strong>
                <span className="mt-1 block text-[0.68rem] font-semibold text-[var(--text-muted)]">{label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <HomeSection eyebrow="Continue Learning" title={auth.user ? 'Resume where you left off' : 'Start your learning journey'} action={auth.user ? <Button variant="secondary" onClick={() => navigate('/dashboard')}>Open dashboard</Button> : null}>
        {auth.user && enrolledCourses.length ? <div className="grid gap-3">{enrolledCourses.slice(0, 3).map((course) => <ContinueRow key={course.id} course={course} onContinue={() => navigate(`/player/${course.id}`)} />)}</div> : <div className="theme-card grid gap-5 rounded-xl p-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><PlayCircle size={27} /></span><div><h3 className="font-bold text-[var(--text-primary)]">{auth.user ? 'Choose your first course' : 'Create your learner account'}</h3><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Your active courses and progress will stay organized here.</p></div><Button onClick={startLearning}>{auth.user ? 'Browse courses' : 'Get started'}</Button></div>}
      </HomeSection>

      <HomeSection eyebrow="Popular Courses" title="What learners are choosing" action={<Button variant="secondary" onClick={() => navigate('/courses')}>View all</Button>}>
        <CourseGrid courses={popular} loading={loading} onOpen={(course) => navigate(`/course/${course.id}`)} empty="Popular courses will appear after enrollment activity begins." />
      </HomeSection>

      <HomeSection eyebrow="Recommended Courses" title="Continue building career-ready skills">
        <CourseGrid courses={recommended} loading={loading} onOpen={(course) => navigate(`/course/${course.id}`)} empty="New course recommendations will appear as the catalog grows." columns="xl:grid-cols-4" />
      </HomeSection>

      <HomeSection eyebrow="Learning Paths" title="Structured routes to meaningful outcomes">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{learningPaths.map((path) => <button key={path.title} type="button" onClick={() => navigate(`/learning-path?path=${encodeURIComponent(path.title)}`)} className="theme-card theme-subcard-hover rounded-xl p-5 text-left"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><path.icon size={20} /></span><h3 className="mt-4 font-bold text-[var(--text-primary)]">{path.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{path.text}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]">Explore path <ArrowRight size={15} /></span></button>)}</div>
      </HomeSection>

      <HomeSection eyebrow="Categories" title="Explore learning by skill area" action={<Button variant="secondary" onClick={() => navigate('/categories')}>All categories</Button>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.length ? categories.map((category) => <button key={category.name} type="button" onClick={() => navigate(`/explore?category=${encodeURIComponent(category.name)}`)} className="theme-subcard theme-subcard-hover flex items-center gap-4 rounded-xl p-4 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BookOpen size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[var(--text-primary)]">{category.name}</strong><span className="text-sm text-[var(--text-muted)]">{category.count} courses</span></span><ArrowRight size={16} className="text-[var(--text-muted)]" /></button>) : <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4"><EmptyMessage text="No learning categories are available yet. Check back after new courses are published." /></div>}</div>
      </HomeSection>

      <HomeSection eyebrow="Platform Benefits" title="Everything learners need in one LMS">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              className="theme-card rounded-2xl p-5 shadow-soft"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                  <benefit.icon size={20} />
                </span>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">0{index + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-black text-[var(--text-primary)]">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{benefit.text}</p>
            </motion.div>
          ))}
        </div>
      </HomeSection>
    </motion.section>
  )
}

function HomeSection({ eyebrow, title, action, children }) {
  return <section className="w-full"><div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.2em]">{eyebrow}</p><h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{title}</h2></div>{action}</div>{children}</section>
}

function ContinueRow({ course, onContinue }) {
  const progress = Math.max(0, Math.min(100, Number(course.progress || 0)))
  return <div className="theme-card grid gap-4 rounded-xl p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="min-w-0"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-primary)]">{course.category || 'Active course'}</span><h3 className="mt-2 truncate font-bold text-[var(--text-primary)]">{course.title}</h3><div className="mt-3 flex items-center gap-3"><span className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-subtle)]"><span className="block h-full rounded-full bg-[var(--brand-gradient)]" style={{ width: `${progress}%` }} /></span><span className="text-xs font-bold text-[var(--text-secondary)]">{progress}%</span></div></div><Button onClick={onContinue}>Continue <ArrowRight size={15} /></Button></div>
}

function CourseGrid({ courses, loading, onOpen, empty, columns = 'xl:grid-cols-3' }) {
  if (loading) return <div className={`grid gap-5 md:grid-cols-2 ${columns}`}>{Array.from({ length: columns.includes('4') ? 4 : 3 }).map((_, index) => <span key={index} className="skeleton h-[31rem] rounded-xl" />)}</div>
  if (!courses.length) return <EmptyMessage text={empty} />
  return <div className={`grid items-stretch gap-5 md:grid-cols-2 ${columns}`}>{courses.map((course) => <CourseCard key={course.id} course={course} onViewDetails={() => onOpen(course)} />)}</div>
}

function EmptyMessage({ text }) {
  return <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-subtle)] p-8 text-center"><CheckCircle2 className="mx-auto text-[var(--text-muted)]" size={28} /><p className="mt-3 text-sm font-semibold text-[var(--text-secondary)]">{text}</p></div>
}
