import { useMemo, useState } from 'react'
import CourseCard from '../../components/courses/CourseCard.jsx'
import { celebCourses } from '../../data/dummyData.js'
import Button from '../../components/ui/Button.jsx'
import { motion } from 'framer-motion'
import { fadeInUp } from '../../animations/variants.js'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function ExploreCoursesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
   const categories = ['All', ...new Set(celebCourses.map((course) => course.category))]
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']
  const initialCategory = categories.includes(searchParams.get('category')) ? searchParams.get('category') : 'All'
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

   const filteredCourses = useMemo(
     () =>
       celebCourses.filter((course) => {
         const haystack = [course.title, course.description, course.category, course.level, ...(course.tags || [])].join(' ').toLowerCase()
         const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
         const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
         const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel
         return matchesQuery && matchesCategory && matchesLevel
       }),
     [query, selectedCategory, selectedLevel],
   )

  return (
    <motion.section className="space-y-10 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="grid gap-6 rounded-[2rem] border border-black/10 bg-white/95 p-8 shadow-glow dark:bg-slate-950/90 dark:border-white/10 dark:text-white light:text-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Explore courses</p>
            <h1 className="text-4xl font-semibold text-white dark:text-white light:text-slate-900">
              Discover upskilling-focused technical and creative learning
            </h1>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-600">
              Filter by category, skill level, or mentor. Enjoy premium programming, design, leadership, and cricket-inspired courses taught by Indian celebrities.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setFiltersOpen((value) => !value)}>
            {filtersOpen ? <X size={16} className="mr-2" /> : <SlidersHorizontal size={16} className="mr-2" />}
            {filtersOpen ? 'Hide Filters' : 'Filter Courses'}
          </Button>
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-soft dark:border-white/10 dark:bg-slate-950/70">
          <Search size={18} className="text-cyan-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search courses, skills, mentors, or categories"
          />
        </label>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_0.35fr]">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            <div className="glass-card p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Course count</p>
              <p className="mt-3 text-3xl font-semibold text-white dark:text-white light:text-slate-900">
                {filteredCourses.length}
              </p>
            </div>
            <div className="glass-card p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Selected category</p>
              <p className="mt-3 text-3xl font-semibold text-white dark:text-white light:text-slate-900">
                {selectedCategory}
              </p>
            </div>
            <div className="glass-card p-6 shadow-soft">
              <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Skill level</p>
              <p className="mt-3 text-3xl font-semibold text-white dark:text-white light:text-slate-900">
                {selectedLevel}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onViewDetails={() => navigate(`/course/${course.id}`)}
              />
            ))}
          </div>
        </div>

        <aside className={`${filtersOpen ? 'block' : 'hidden'} space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto xl:block`}>
            <div className="glass-card rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft dark:bg-slate-950/80 dark:border-white/10 dark:text-white">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400 light:text-slate-600">
              Category filters
            </p>
            <div className="mt-5 grid gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-3xl px-4 py-3 text-left text-sm transition ${
                    selectedCategory === category
                      ? 'bg-cyan-500 text-slate-950 shadow-glow'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 dark:bg-white/5 dark:text-slate-300 light:bg-black/5 light:text-slate-700 light:hover:bg-black/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft dark:bg-slate-950/80 dark:border-white/10">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400 light:text-slate-600">
              Level filters
            </p>
            <div className="mt-5 grid gap-3">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-3xl px-4 py-3 text-left text-sm transition ${
                    selectedLevel === level
                      ? 'bg-cyan-500 text-slate-950 shadow-glow'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 dark:bg-white/5 dark:text-slate-300 light:bg-black/5 light:text-slate-700 light:hover:bg-black/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft dark:bg-slate-950/80 dark:border-white/10">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400 light:text-slate-600">
              Quick actions
            </p>
            <div className="mt-5 space-y-3 text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p className="text-sm">Select a category to instantly filter the full catalog.</p>
              <p className="text-sm">Use level filters to focus on beginner, intermediate, or advanced tracks.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setSelectedCategory('All')
                  setSelectedLevel('All')
                }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </motion.section>
  )
}
