import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { motion } from 'framer-motion'
import CourseCard from '../../components/ui/Course/CourseCard.jsx'
import Button from '../../components/common/Button/Button.jsx'
import { fadeInUp } from '../../utils/animationVariants.js'
import { enrollCourseRequest, fetchCourses, unenrollCourseRequest } from '../../api/api.js'
import { enrollCourse, unenrollCourse } from '../../store/slices/authSlice.js'
import { formatRupeesFromPaise } from '../../utils/money.js'

export default function ExploreCoursesPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const [searchParams] = useSearchParams()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyCourseId, setBusyCourseId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchCourses()
        setCourses(response.data.courses || [])
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load courses.')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    void loadCourses()
  }, [auth.token])

  async function handleEnrollmentToggle(course) {
    if (!auth.user) {
      navigate('/login')
      return
    }
    try {
      setBusyCourseId(course.id)
      setError('')
      setNotice('')
      if (course.isEnrolled) {
        const response = await unenrollCourseRequest(course.id)
        dispatch(unenrollCourse(course.id))
        const nextCount = response.data?.enrollmentCount ?? Math.max(0, Number(course.enrollmentCount ?? course._count?.enrollments ?? 1) - 1)
        setCourses((items) => items.map((item) => (
          item.id === course.id
            ? { ...item, isEnrolled: false, enrollmentCount: nextCount, _count: { ...(item._count || {}), enrollments: nextCount } }
            : item
        )))
        setNotice(`Unenrolled from ${course.title}.`)
      } else {
        const response = await enrollCourseRequest(course.id)
        dispatch(enrollCourse(response.data.enrollment.courseId))
        const currentCount = Number(course.enrollmentCount ?? course._count?.enrollments ?? 0)
        const nextCount = response.data?.enrollmentCount ?? currentCount + (response.data?.wasAlreadyEnrolled ? 0 : 1)
        setCourses((items) => items.map((item) => (
          item.id === course.id
            ? { ...item, isEnrolled: true, enrollmentCount: nextCount, _count: { ...(item._count || {}), enrollments: nextCount } }
            : item
        )))
        setNotice(`Enrolled in ${course.title}.`)
      }
    } catch (err) {
      if (err?.response?.status === 402) {
        const price = formatRupeesFromPaise(err.response.data?.priceCents || course.priceCents || 0)
        setError(err.response.data?.message || `Payment required. Cost to enroll is ${price}.`)
      } else {
        setError(err?.response?.data?.message || err.message || 'Could not update enrollment.')
      }
    } finally {
      setBusyCourseId('')
    }
  }

  const categories = useMemo(() => ['All', ...new Set(courses.map((course) => course.category).filter(Boolean))], [courses])
  const levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const haystack = [
          course.title,
          course.description,
          course.category,
          course.level,
          course.createdBy?.name,
          course.createdBy?.bio,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
        const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel
        return matchesQuery && matchesCategory && matchesLevel
      }),
    [courses, query, selectedCategory, selectedLevel],
  )

  return (
    <motion.section className="space-y-10 pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="grid gap-6 rounded-[2rem] border border-black/10 bg-white/95 p-8 shadow-glow dark:border-white/10 dark:bg-slate-950/90 dark:text-white light:text-slate-900">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Explore courses</p>
            <h1 className="text-4xl font-semibold text-white dark:text-white light:text-slate-900">
              Discover real courses from PostgreSQL
            </h1>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-600">
              Search the live course catalog, filter by category, and open the exact same course records the admin portal sees.
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
            placeholder="Search courses, instructors, or categories"
          />
        </label>
      </div>

      {notice ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">{notice}</p> : null}
      {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">{error}</p> : null}

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
            {loading ? (
              <div className="col-span-full rounded-lg border border-white/10 bg-slate-950/60 p-8 text-center text-slate-400">
                Loading live courses...
              </div>
            ) : filteredCourses.length ? (
              filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={() => navigate(`/course/${course.id}`)}
                  onEnrollToggle={handleEnrollmentToggle}
                  enrollmentBusy={busyCourseId === course.id}
                />
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-white/10 bg-slate-950/60 p-8 text-center text-slate-400">
                No courses found.
              </div>
            )}
          </div>
        </div>

        <aside className={`${filtersOpen ? 'block' : 'hidden'} space-y-6 max-h-[calc(100vh-240px)] overflow-y-auto xl:block`}>
          <div className="glass-card rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft dark:bg-slate-950/80 dark:border-white/10 dark:text-white">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400 light:text-slate-600">Category filters</p>
            <div className="mt-5 grid gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-3xl px-4 py-3 text-left text-sm transition ${
                    selectedCategory === category
                      ? 'bg-cyan-500 text-white shadow-glow'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 dark:bg-white/5 dark:text-slate-300 light:bg-black/5 light:text-slate-700 light:hover:bg-black/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft dark:bg-slate-950/80 dark:border-white/10">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400 light:text-slate-600">Level filters</p>
            <div className="mt-5 grid gap-3">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSelectedLevel(level)}
                  className={`rounded-3xl px-4 py-3 text-left text-sm transition ${
                    selectedLevel === level
                      ? 'bg-cyan-500 text-white shadow-glow'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 dark:bg-white/5 dark:text-slate-300 light:bg-black/5 light:text-slate-700 light:hover:bg-black/10'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft dark:bg-slate-950/80 dark:border-white/10">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400 dark:text-slate-400 light:text-slate-600">Quick actions</p>
            <div className="mt-5 space-y-3 text-slate-300 dark:text-slate-300 light:text-slate-700">
              <p className="text-sm">Use the live database filters to narrow courses by category and level.</p>
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
