import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CourseCard from '../../components/courses/CourseCard.jsx'
import { celebrityCourses } from '../../data/dummyData.js'
import Button from '../../components/ui/Button.jsx'
import { pageTransition } from '../../animations/variants.js'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <motion.section className="space-y-16 pb-16" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.24),_transparent_30%),radial-gradient(circle_at_10%_20%,_rgba(168,85,247,0.18),_transparent_22%)]" />
        <div className="relative grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Premium celebrity learning • curated by AI
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn Directly From Global Celebrities
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              A cinematic academy for creators, athletes, artists, and founders. Experience high-production courses, live classes, programming bootcamps, and AI-powered mastery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => navigate('/login')}>Start Learning</Button>
              <Button variant="secondary" onClick={() => navigate('/community')}>
                <Play size={16} className="mr-2" /> Watch Demo
              </Button>
            </div>
          </div>

          <div className="relative grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.27em] text-cyan-300">Featured Mentor</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Deepika Padukone</h2>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm text-emerald-200">Live Now</span>
            </div>
            <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1080&q=80"
                alt="Celebrity mentor"
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
            </div>
            <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
              <p>Inside the course: Performance nutrition, recovery routines, and stage confidence.</p>
              <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                <span>AI mentor</span>
                <span>Interactive notes</span>
                <span>Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Trending Celebrity Courses</p>
            <h2 className="text-3xl font-semibold text-white">Browse what the world is learning</h2>
          </div>
          <button className="btn-secondary inline-flex items-center gap-2 text-sm">
            Explore All <ArrowRight size={18} />
          </button>
        </div>

        <div className="flex snap-x scroll-pl-6 gap-6 overflow-x-auto pb-4">
          {celebrityCourses.map((course) => (
            <div key={course.id} className="min-w-[320px] snap-start">
              <CourseCard course={course} onViewDetails={() => navigate(`/course/${course.id}`)} />
            </div>
          ))}
        </div>
      </section>
    </motion.section>
  )
}
