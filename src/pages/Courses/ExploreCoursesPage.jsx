import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Database,
  GraduationCap,
  Grid2X2,
  Layers3,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import CourseCard from '../../components/ui/Course/CourseCard.jsx'
import Button from '../../components/common/Button/Button.jsx'
import { fadeInUp } from '../../utils/animationVariants.js'
import { enrollCourseRequest, fetchCourses, unenrollCourseRequest } from '../../api/api.js'
import { enrollCourse, unenrollCourse } from '../../store/slices/authSlice.js'
import { formatRupeesFromPaise } from '../../utils/money.js'

const levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const priceFilters = ['All', 'Free', 'Paid']
const ratingFilters = [4, 3, 2]
const areaIcons = [Code2, BarChart3, Brain, Cloud, Database, Layers3]

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item) || 'Uncategorized'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function getEnrollmentCount(course) {
  return Number(course.enrollmentCount ?? course._count?.enrollments ?? course.enrollments?.length ?? 0)
}

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
  const [selectedPrice, setSelectedPrice] = useState('All')
  const [minimumRating, setMinimumRating] = useState(0)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')
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
        const nextCount = response.data?.enrollmentCount ?? Math.max(0, getEnrollmentCount(course) - 1)
        setCourses((items) => items.map((item) => (
          item.id === course.id
            ? { ...item, isEnrolled: false, enrollmentCount: nextCount, _count: { ...(item._count || {}), enrollments: nextCount } }
            : item
        )))
        setNotice(`Unenrolled from ${course.title}.`)
      } else {
        const response = await enrollCourseRequest(course.id)
        dispatch(enrollCourse(response.data.enrollment.courseId))
        const currentCount = getEnrollmentCount(course)
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

  const categoryCounts = useMemo(() => countBy(courses, (course) => course.category), [courses])
  const levelCounts = useMemo(() => countBy(courses, (course) => course.level), [courses])
  const categories = useMemo(() => ['All', ...Object.keys(categoryCounts).filter(Boolean)], [categoryCounts])
  const totalLearners = useMemo(() => courses.reduce((sum, course) => sum + getEnrollmentCount(course), 0), [courses])
  const averageRating = useMemo(() => {
    const rated = courses.map((course) => Number(course.rating || 0)).filter((rating) => rating > 0)
    if (!rated.length) return '0.0'
    return (rated.reduce((sum, rating) => sum + rating, 0) / rated.length).toFixed(1)
  }, [courses])
  const freeCount = useMemo(() => courses.filter((course) => Number(course.priceCents || 0) === 0).length, [courses])
  const paidCount = Math.max(0, courses.length - freeCount)
  const popularAreas = useMemo(() => (
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
  ), [categoryCounts])
  const trendingSearches = useMemo(() => {
    const tags = new Set()
    courses.forEach((course) => {
      ;[course.category, course.level, ...(course.tags || [])].filter(Boolean).forEach((tag) => tags.add(String(tag)))
    })
    return [...tags].slice(0, 8)
  }, [courses])

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
          ...(course.tags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        const priceCents = Number(course.priceCents || 0)
        const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase())
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
        const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel
        const matchesPrice = selectedPrice === 'All' || (selectedPrice === 'Free' ? priceCents === 0 : priceCents > 0)
        const matchesRating = !minimumRating || Number(course.rating || 0) >= minimumRating
        return matchesQuery && matchesCategory && matchesLevel && matchesPrice && matchesRating
      }),
    [courses, minimumRating, query, selectedCategory, selectedLevel, selectedPrice],
  )

  const sortedCourses = useMemo(() => {
    const nextCourses = [...filteredCourses]
    if (sortBy === 'rating') {
      nextCourses.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    } else if (sortBy === 'price-low') {
      nextCourses.sort((a, b) => Number(a.priceCents || 0) - Number(b.priceCents || 0))
    } else if (sortBy === 'newest') {
      nextCourses.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } else {
      nextCourses.sort((a, b) => getEnrollmentCount(b) - getEnrollmentCount(a))
    }
    return nextCourses
  }, [filteredCourses, sortBy])

  const resetFilters = () => {
    setQuery('')
    setSelectedCategory('All')
    setSelectedLevel('All')
    setSelectedPrice('All')
    setMinimumRating(0)
  }

  const activeFilterCount = [query.trim(), selectedCategory !== 'All', selectedLevel !== 'All', selectedPrice !== 'All', minimumRating > 0].filter(Boolean).length

  return (
    <motion.section className="pb-16" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} xl:block`}>
          <div className="enterprise-glass-panel sticky top-24 space-y-5 rounded-xl p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Filters</p>
              <button type="button" onClick={resetFilters} className="text-xs font-semibold text-[var(--accent-primary)]">Clear all</button>
            </div>

            <FilterGroup title="Categories">
              {categories.map((category) => (
                <FilterOption
                  key={category}
                  checked={selectedCategory === category}
                  label={category === 'All' ? 'All Categories' : category}
                  count={category === 'All' ? courses.length : categoryCounts[category]}
                  onClick={() => setSelectedCategory(category)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Level">
              {levels.map((level) => (
                <FilterOption
                  key={level}
                  checked={selectedLevel === level}
                  label={level === 'All' ? 'All Levels' : level}
                  count={level === 'All' ? courses.length : levelCounts[level] || 0}
                  onClick={() => setSelectedLevel(level)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Price">
              {priceFilters.map((price) => (
                <FilterOption
                  key={price}
                  checked={selectedPrice === price}
                  label={price === 'All' ? 'All Prices' : price}
                  count={price === 'All' ? courses.length : price === 'Free' ? freeCount : paidCount}
                  onClick={() => setSelectedPrice(price)}
                />
              ))}
            </FilterGroup>

            <FilterGroup title="Ratings">
              {ratingFilters.map((rating) => (
                <FilterOption
                  key={rating}
                  checked={minimumRating === rating}
                  label={`${rating}+ stars`}
                  count={courses.filter((course) => Number(course.rating || 0) >= rating).length}
                  onClick={() => setMinimumRating(minimumRating === rating ? 0 : rating)}
                  icon={<span className="text-[var(--accent-warm)]">{'★'.repeat(rating)}</span>}
                />
              ))}
            </FilterGroup>

            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              <SlidersHorizontal size={16} className="mr-2" /> Apply Filters
            </Button>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.95fr)]">
            <section className="enterprise-mesh-panel rounded-xl border border-[var(--border-color)] p-6 shadow-soft sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
                    <Sparkles size={14} /> Explore courses
                  </p>
                  <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
                    Unlock skills. <span className="text-[var(--accent-primary)]">Build your future.</span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                    Discover your actual UptoSkills course catalog across categories, levels, instructors, pricing, and progress.
                  </p>
                  <label className="mt-6 flex min-h-12 max-w-2xl items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 shadow-sm">
                    <Search size={18} className="text-[var(--accent-primary)]" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                      placeholder="Search courses, instructors, or topics..."
                    />
                  </label>
                </div>
                <div className="enterprise-orbit-visual hidden h-56 place-items-center rounded-xl lg:grid">
                  <div className="relative grid h-36 w-36 place-items-center rounded-3xl bg-[var(--bg-card)] shadow-soft">
                    <GraduationCap size={62} className="text-[var(--accent-primary)]" />
                    <span className="absolute -right-5 top-7 rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-primary)] shadow-soft">
                      <BookOpenCheck size={22} />
                    </span>
                    <span className="absolute -bottom-4 left-4 rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent-primary)] shadow-soft">
                      <Sparkles size={20} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <Metric value={courses.length} label="Courses" />
                <Metric value={`${categories.length - 1}+`} label="Categories" />
                <Metric value={`${totalLearners}+`} label="Learners" />
                <Metric value={averageRating} label="Average Rating" icon={<Star size={14} className="fill-[var(--accent-warm)] text-[var(--accent-warm)]" />} />
              </div>
            </section>

            <section className="enterprise-glass-panel grid gap-4 rounded-xl p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Popular Areas</p>
                  <p className="text-xs text-[var(--text-secondary)]">Explore top in-demand skills</p>
                </div>
                <button type="button" onClick={() => setSelectedCategory('All')} className="text-xs font-semibold text-[var(--accent-primary)]">View all</button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(popularAreas.length ? popularAreas : [['Courses', courses.length]]).map(([category, count], index) => {
                  const Icon = areaIcons[index % areaIcons.length]
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category === 'Courses' ? 'All' : category)}
                      className="enterprise-glow-card flex min-h-20 items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 text-left"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                        <Icon size={20} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-[var(--text-primary)]">{category}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{count} courses</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="grid min-h-24 items-center rounded-xl bg-[var(--bg-subtle)] p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Become job-ready with</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">skill paths</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">Curated paths help you learn, build, and get hired.</p>
                </div>
                <Button variant="secondary" onClick={() => setSelectedLevel('BEGINNER')}>Explore Paths</Button>
              </div>
            </section>
          </div>

          {notice ? <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">{notice}</p> : null}
          {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">{error}</p> : null}

          <section className="enterprise-glass-panel rounded-xl p-4 shadow-soft">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-xs font-bold text-[var(--text-primary)]">Trending Searches:</span>
                {trendingSearches.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className="rounded-full bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => setFiltersOpen((value) => !value)} className="xl:hidden">
                  {filtersOpen ? <X size={16} className="mr-2" /> : <SlidersHorizontal size={16} className="mr-2" />}
                  Filters {activeFilterCount ? `(${activeFilterCount})` : ''}
                </Button>
                <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 text-xs font-semibold text-[var(--text-primary)]">
                  Sort by:
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="min-h-0 border-0 bg-transparent p-0 text-xs outline-none">
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Lowest Price</option>
                    <option value="newest">Newest</option>
                  </select>
                  <ChevronDown size={14} />
                </label>
                <span className="hidden rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent-primary)] sm:grid">
                  <Grid2X2 size={18} />
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
              <p className="text-sm font-bold text-[var(--text-primary)]">{sortedCourses.length} courses found</p>
              {activeFilterCount ? <button type="button" onClick={resetFilters} className="text-sm font-semibold text-[var(--accent-primary)]">Clear filters</button> : null}
            </div>
          </section>

          <div className="grid min-h-0 gap-5 overflow-visible md:grid-cols-2 2xl:grid-cols-3">
            {loading ? (
              <div className="col-span-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 text-center text-[var(--text-secondary)]">
                Loading live courses...
              </div>
            ) : sortedCourses.length ? (
              sortedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onViewDetails={() => navigate(`/course/${course.id}`)}
                  onEnrollToggle={handleEnrollmentToggle}
                  enrollmentBusy={busyCourseId === course.id}
                />
              ))
            ) : (
              <div className="col-span-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-elevated)] p-8 text-center text-[var(--text-secondary)]">
                No courses found. Try another keyword, category, level, price, or rating.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function FilterGroup({ title, children }) {
  return (
    <div className="border-t border-[var(--border-color)] pt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--text-primary)]">{title}</p>
        <ChevronDown size={14} className="text-[var(--text-muted)]" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FilterOption({ checked, label, count, onClick, icon }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2 text-left text-xs text-[var(--text-secondary)]">
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white' : 'border-[var(--border-muted)] bg-[var(--bg-secondary)]'}`}>
        {checked ? <Check size={11} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{icon || label}</span>
      <span>{count ?? 0}</span>
    </button>
  )
}

function Metric({ value, label, icon }) {
  return (
    <div className="enterprise-glow-card rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
      <p className="flex items-center gap-1 text-2xl font-bold text-[var(--accent-primary)]">
        {value}{icon}
      </p>
      <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}
