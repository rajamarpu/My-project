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
  { title: 'Campus to Career', text: 'Build foundational workplace and interview-ready skills.', icon: BriefcaseBusiness },
  { title: 'AI and Technology', text: 'Learn practical tools, development, and emerging AI workflows.', icon: Sparkles },
  { title: 'Professional Growth', text: 'Strengthen communication, leadership, and business capability.', icon: Target },
  { title: 'Certificate Sprint', text: 'Follow a focused route from lessons to verified achievement.', icon: Award },
]

const benefits = [
  { title: 'Structured learning', text: 'Clear course sequences replace random browsing.', icon: Layers3 },
  { title: 'Expert instruction', text: 'Learn with experienced instructors and guided mentors.', icon: GraduationCap },
  { title: 'Practical assessment', text: 'Assignments and assessments reinforce every skill.', icon: Target },
  { title: 'Visible progress', text: 'Track course completion, study time, and streaks.', icon: Compass },
  { title: 'Verified certificates', text: 'Turn completed learning into shareable credentials.', icon: Award },
  { title: 'Career readiness', text: 'Connect practical skills to employability outcomes.', icon: BriefcaseBusiness },
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

  function startLearning() {
    navigate(auth.user && auth.token ? '/dashboard' : '/register')
  }

  return (
    <motion.section className="w-full space-y-10 pb-16 xl:space-y-14" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <section className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(23rem,0.88fr)]">
        <div className="enterprise-mesh-panel relative overflow-hidden rounded-2xl border border-[var(--border-color)] px-[clamp(20px,4vw,56px)] py-[clamp(36px,5vw,68px)] shadow-soft">
          <div className="relative max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--accent-primary)] shadow-soft"><Sparkles size={16} /> Practical learning for real careers</span>
            <h1 className="mt-6 text-[clamp(2.5rem,5vw,4.75rem)] font-bold leading-[1.03] text-[var(--text-primary)]">Build skills. Prove progress. <span className="upto-brand-text">Move your career forward.</span></h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">Learn through structured courses, practical assignments, assessments, expert guidance, and certificates designed for employability.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button onClick={startLearning} className="min-h-12">{auth.user ? 'Open dashboard' : 'Start learning'} <ArrowRight size={17} /></Button><Button variant="secondary" onClick={() => navigate('/courses')} className="min-h-12"><Compass size={17} /> Explore courses</Button></div>
          </div>
        </div>

        <aside className="platform-card flex flex-col overflow-hidden rounded-2xl p-5 shadow-[var(--shadow-lg)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="theme-eyebrow text-xs font-bold uppercase tracking-[0.18em]">Your learning journey</p><h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">From first lesson to career proof</h2></div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><GraduationCap size={23} /></span>
          </div>

          <div className="mt-6 grid gap-3">
            {[
              ['Discover', 'Choose the right course and learning path.', Compass],
              ['Learn', 'Follow structured lessons with expert guidance.', BookOpen],
              ['Practice', 'Complete assignments and skill assessments.', Target],
              ['Prove', 'Earn certificates and visible progress records.', Award],
            ].map(([title, text, Icon], index) => (
              <div key={title} className="theme-subcard flex items-center gap-3 rounded-xl p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={18} /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm text-[var(--text-primary)]">{index + 1}. {title}</strong><span className="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">{text}</span></span>
                <CheckCircle2 size={17} className="shrink-0 text-[var(--color-success)]" />
              </div>
            ))}
          </div>

          {popular[0] ? <button type="button" onClick={() => navigate(`/course/${popular[0].id}`)} className="mt-5 rounded-xl border border-[var(--accent-primary)]/25 bg-[var(--accent-soft)] p-4 text-left transition hover:border-[var(--accent-primary)]"><span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-primary)]">Popular now</span><span className="mt-2 flex items-center justify-between gap-3"><strong className="truncate text-sm text-[var(--text-primary)]">{popular[0].title}</strong><ArrowRight size={16} className="shrink-0 text-[var(--accent-primary)]" /></span></button> : null}

          <div className="mt-auto grid grid-cols-3 gap-2 pt-5">{[[summary.totalLearners, 'Learners'], [summary.totalCourses, 'Courses'], [summary.totalInstructors, 'Mentors']].map(([value, label]) => <div key={label} className="rounded-xl bg-[var(--bg-subtle)] p-3 text-center"><strong className="block text-xl text-[var(--accent-primary)]">{value}</strong><span className="mt-1 block text-[0.68rem] font-semibold text-[var(--text-muted)]">{label}</span></div>)}</div>
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{learningPaths.map((path) => <button key={path.title} type="button" onClick={() => navigate('/learning-path')} className="theme-card theme-subcard-hover rounded-xl p-5 text-left"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><path.icon size={20} /></span><h3 className="mt-4 font-bold text-[var(--text-primary)]">{path.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{path.text}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]">Explore path <ArrowRight size={15} /></span></button>)}</div>
      </HomeSection>

      <HomeSection eyebrow="Categories" title="Explore learning by skill area" action={<Button variant="secondary" onClick={() => navigate('/categories')}>All categories</Button>}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{categories.length ? categories.map((category) => <button key={category.name} type="button" onClick={() => navigate(`/explore?category=${encodeURIComponent(category.name)}`)} className="theme-subcard theme-subcard-hover flex items-center gap-4 rounded-xl p-4 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BookOpen size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[var(--text-primary)]">{category.name}</strong><span className="text-sm text-[var(--text-muted)]">{category.count} courses</span></span><ArrowRight size={16} className="text-[var(--text-muted)]" /></button>) : <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4"><EmptyMessage text="No learning categories are available yet. Check back after new courses are published." /></div>}</div>
      </HomeSection>

      <HomeSection eyebrow="Platform Benefits" title="Everything learners need in one LMS">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{benefits.map((benefit) => <div key={benefit.title} className="theme-card rounded-xl p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><benefit.icon size={20} /></span><h3 className="mt-4 font-bold text-[var(--text-primary)]">{benefit.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{benefit.text}</p></div>)}</div>
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
