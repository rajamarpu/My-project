import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Sparkles, TrendingUp, RotateCcw } from 'lucide-react'
import CourseCard from '../../components/courses/CourseCard.jsx'
import Button from '../../components/ui/Button.jsx'
import { fadeInUp } from '../../animations/variants.js'
import { courseAPI } from '../../services/api.js'

const PAGE_SIZE = 6

export default function ExploreCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [meta, setMeta] = useState({ total: 0, categories: ['All'], levels: ['All', 'Beginner', 'Intermediate', 'Advanced'], trending: [], recommended: [] })
  const [filters, setFilters] = useState({ q: '', category: 'All', level: 'All' })
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const hasMore = useMemo(() => courses.length < meta.total, [courses.length, meta.total])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!filters.q.trim()) return setSuggestions([])
      const response = await courseAPI.getSuggestions(filters.q)
      setSuggestions(response.data.suggestions)
    }, 250)
    return () => clearTimeout(timeout)
  }, [filters.q])

  useEffect(() => {
    loadCourses(0, true)
  }, [filters.category, filters.level])

  const loadCourses = async (nextOffset = 0, replace = false) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true)
      setError('')
      const response = await courseAPI.getAllCourses({ ...filters, offset: nextOffset, limit: PAGE_SIZE })
      setCourses((current) => (replace ? response.data.courses : [...current, ...response.data.courses]))
      setMeta({
        total: response.data.total,
        categories: response.data.categories,
        levels: response.data.levels,
        trending: response.data.trending,
        recommended: response.data.recommended,
      })
      setOffset(nextOffset + PAGE_SIZE)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load courses')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const applySearch = (event) => {
    event.preventDefault()
    setSuggestions([])
    loadCourses(0, true)
  }

  const resetFilters = () => {
    setFilters({ q: '', category: 'All', level: 'All' })
    setTimeout(() => loadCourses(0, true), 0)
  }

  return (
    <motion.section className="space-y-8 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Explore courses</p>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-white">Celebrity-powered learning paths</h1>
            <p className="mt-3 text-slate-400">Search, filter, enroll, and continue structured beginner-to-advanced courses with real progress tracking.</p>
          </div>
          <form onSubmit={applySearch} className="relative">
            <div className="flex rounded-3xl border border-white/10 bg-white/5 p-2">
              <Search className="ml-3 mt-3 text-slate-400" size={20} />
              <input
                value={filters.q}
                onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                placeholder="Search React, AI, Design..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-white outline-none"
              />
              <Button type="submit">Search</Button>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-20 mt-2 rounded-3xl border border-white/10 bg-slate-950 p-3 shadow-glow">
                {suggestions.map((item) => (
                  <button key={item.id} type="button" onClick={() => navigate(`/course/${item.id}/preview`)} className="block w-full rounded-2xl px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/10">
                    {item.title} <span className="text-slate-500">in {item.category}</span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={<Sparkles size={18} />} label="Matching courses" value={meta.total} />
            <Metric icon={<TrendingUp size={18} />} label="Trending now" value={meta.trending.length} />
            <Metric icon={<Search size={18} />} label="Active filter" value={filters.category} />
          </div>

          {error && <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>}

          {loading ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[2rem] bg-white/10" />)}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => <CourseCard key={course.id} course={course} onViewDetails={() => navigate(`/course/${course.id}/preview`)} />)}
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 text-center text-slate-300">
              <p className="text-lg font-semibold text-white">No courses match that search.</p>
              <p className="mt-2 text-sm text-slate-400">Reset filters or try a broader topic.</p>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" disabled={loadingMore} onClick={() => loadCourses(offset, false)}>
                {loadingMore ? 'Loading...' : 'Load more courses'}
              </Button>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <FilterGroup title="Categories" items={meta.categories} value={filters.category} onChange={(category) => setFilters((prev) => ({ ...prev, category }))} />
          <FilterGroup title="Learning level" items={meta.levels} value={filters.level} onChange={(level) => setFilters((prev) => ({ ...prev, level }))} />
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Recommended</p>
            <div className="mt-5 space-y-3">
              {meta.recommended.map((course) => (
                <button key={course.id} onClick={() => navigate(`/course/${course.id}/preview`)} className="w-full rounded-3xl bg-white/5 p-4 text-left text-sm text-slate-300 hover:bg-white/10">
                  <span className="font-semibold text-white">{course.title}</span>
                  <span className="mt-1 block text-slate-500">{course.level} / {course.category}</span>
                </button>
              ))}
            </div>
            <Button variant="secondary" className="mt-5" onClick={resetFilters}>
              <RotateCcw size={16} className="mr-2" /> Reset filters
            </Button>
          </div>
        </aside>
      </div>
    </motion.section>
  )
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-5 shadow-soft">
      <div className="flex items-center gap-2 text-cyan-300">{icon}<span className="text-xs uppercase tracking-[0.2em]">{label}</span></div>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  )
}

function FilterGroup({ title, items, value, onChange }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
      <p className="text-sm uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <button key={item} onClick={() => onChange(item)} className={`rounded-3xl px-4 py-3 text-left text-sm transition ${value === item ? 'bg-cyan-500 text-slate-950 shadow-glow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
