import { useMemo, useState } from 'react'
import CourseCard from '../../components/courses/CourseCard.jsx'
import { celebrityCourses } from '../../data/dummyData.js'
import Button from '../../components/ui/Button.jsx'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../animations/variants.js'

export default function ExploreCoursesPage() {
  const categories = ['All', ...new Set(celebrityCourses.map((course) => course.category))]
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')

  const filteredCourses = useMemo(
    () =>
      celebrityCourses.filter((course) => {
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
        const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel
        return matchesCategory && matchesLevel
      }),
    [selectedCategory, selectedLevel],
  )

  return (
    <motion.section className="space-y-10 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="grid gap-6 rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-glow">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Explore courses</p>
          <h1 className="text-4xl font-semibold text-white">Discover celebrity-led technical and creative learning</h1>
          <p className="text-slate-400">Filter by category, skill level, or mentor. Enjoy premium programming, design, leadership, and cricket-inspired courses taught by Indian celebrities.</p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_0.35fr]">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <div className="glass-card p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Course count</p>
              <p className="mt-3 text-3xl font-semibold text-white">{filteredCourses.length}</p>
            </div>
            <div className="glass-card p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Selected category</p>
              <p className="mt-3 text-3xl font-semibold text-white">{selectedCategory}</p>
            </div>
            <div className="glass-card p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Skill level</p>
              <p className="mt-3 text-3xl font-semibold text-white">{selectedLevel}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} onViewDetails={() => window.location.assign(`/course/${course.id}`)} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass-card rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Category filters</p>
            <div className="mt-5 grid gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-3xl px-4 py-3 text-left text-sm transition ${selectedCategory === category ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Level filters</p>
            <div className="mt-5 grid gap-3">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-3xl px-4 py-3 text-left text-sm transition ${selectedLevel === level ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Quick actions</p>
            <div className="mt-5 space-y-3 text-slate-300">
              <p className="text-sm">Select a category to instantly filter the full catalog.</p>
              <p className="text-sm">Use level filters to focus on beginner, intermediate, or advanced tracks.</p>
              <Button variant="secondary" onClick={() => { setSelectedCategory('All'); setSelectedLevel('All') }}>Reset filters</Button>
            </div>
          </div>
        </aside>
      </div>
    </motion.section>
  )
}
