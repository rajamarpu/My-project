import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Check,
  ChevronDown,
  Grid2X2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { motion } from 'framer-motion'
import CourseCard from '../../components/ui/Course/CourseCard.jsx'
import Button from '../../components/common/Button/Button.jsx'
import { useTheme } from '../../hooks/useTheme.js'
import { fadeInUp } from '../../utils/animationVariants.js'
import { createCheckout, enrollCourseRequest, fetchCourses, fetchSavedCourses, invalidateApiCachePrefix, unenrollCourseRequest } from '../../api/api.js'
import { enrollCourse, setWishlist, unenrollCourse } from '../../store/slices/authSlice.js'
import { formatRupeesFromPaise } from '../../utils/money.js'
import { resolveCourseThumbnail } from '../../utils/courseThumbnail.js'
import { notifyDashboardRefresh } from '../../utils/dashboardRefresh.js'
import { getCourseTitle } from '../../utils/courseTitle.js'
import { readApiCache } from '../../api/api.js'

const levels = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const priceFilters = ['All', 'Free', 'Paid']
const ratingFilters = [4, 3, 2]
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
  const { theme: resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const pageTextPrimary = isDark ? 'text-white' : 'text-[var(--text-primary)]'
  const pageTextSecondary = isDark ? 'text-cyan-100' : 'text-[var(--text-secondary)]'
  const pageTextMuted = isDark ? 'text-slate-300' : 'text-[var(--text-muted)]'
  const pageAccentText = isDark ? 'text-cyan-300' : 'text-[var(--accent-primary)]'
  const pageDarkSurface = 'dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(8,47,73,0.88),rgba(30,41,59,0.92))]'
  const [searchParams, setSearchParams] = useSearchParams()
  const filterDrawerRef = useRef(null)
  const restoringUrlState = useRef(false)
  const [courses, setCourses] = useState(() => readApiCache('courses')?.courses || readApiCache('courses') || [])
  const [loading, setLoading] = useState(() => !(readApiCache('courses')?.courses || readApiCache('courses') || []).length)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyCourseId, setBusyCourseId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'All')
  const [selectedLevel, setSelectedLevel] = useState(() => searchParams.get('level') || 'All')
  const [selectedPrice, setSelectedPrice] = useState(() => searchParams.get('price') || 'All')
  const [minimumRating, setMinimumRating] = useState(() => Number(searchParams.get('rating') || 0))
  const [query, setQuery] = useState(() => searchParams.get('search') || searchParams.get('q') || '')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'popular')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  useEffect(() => {
    restoringUrlState.current = true
    let frame
    const timer = window.setTimeout(() => {
      setSelectedCategory(searchParams.get('category') || 'All')
      setSelectedLevel(searchParams.get('level') || 'All')
      setSelectedPrice(searchParams.get('price') || 'All')
      setMinimumRating(Number(searchParams.get('rating') || 0))
      setQuery(searchParams.get('search') || searchParams.get('q') || '')
      setSortBy(searchParams.get('sort') || 'popular')
      frame = window.requestAnimationFrame(() => { restoringUrlState.current = false })
    }, 0)
    return () => { window.clearTimeout(timer); if (frame) window.cancelAnimationFrame(frame) }
  }, [searchParams])

  useEffect(() => {
    if (restoringUrlState.current) return undefined
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams()
      if (query.trim()) next.set('q', query.trim())
      if (selectedCategory !== 'All') next.set('category', selectedCategory)
      if (selectedLevel !== 'All') next.set('level', selectedLevel)
      if (selectedPrice !== 'All') next.set('price', selectedPrice)
      if (minimumRating) next.set('rating', String(minimumRating))
      if (sortBy !== 'popular') next.set('sort', sortBy)
      if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true })
    }, 220)
    return () => window.clearTimeout(timer)
  }, [minimumRating, query, searchParams, selectedCategory, selectedLevel, selectedPrice, setSearchParams, sortBy])

  const loadCourses = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCourses() }, 0)
    return () => window.clearTimeout(timer)
  }, [auth.token, loadCourses])

  useEffect(() => {
    if (!auth.user || String(auth.user.role || auth.role).toLowerCase() !== 'learner') return
    fetchSavedCourses().then((response) => dispatch(setWishlist((response.data?.savedCourses || []).map((course) => course.id)))).catch(() => {})
  }, [auth.role, auth.user, dispatch])

  useEffect(() => {
    if (!filtersOpen) return undefined
    const previousFocus = document.activeElement
    const drawer = filterDrawerRef.current
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setFiltersOpen(false)
        return
      }
      if (event.key !== 'Tab' || !drawer) return
      const focusable = [...drawer.querySelectorAll(focusableSelector)].filter((element) => element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => drawer?.querySelector(focusableSelector)?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [filtersOpen])

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
        invalidateApiCachePrefix('courses')
        invalidateApiCachePrefix('learner-dashboard')
        invalidateApiCachePrefix(`course:${course.id}`)
        const nextCount = response.data?.enrollmentCount ?? Math.max(0, getEnrollmentCount(course) - 1)
        setCourses((items) => items.map((item) => (
          item.id === course.id
            ? { ...item, isEnrolled: false, enrollmentCount: nextCount, _count: { ...(item._count || {}), enrollments: nextCount } }
            : item
        )))
        notifyDashboardRefresh({ source: 'explore-unenroll', courseId: course.id })
        setNotice(`Unenrolled from ${getCourseTitle(course)}.`)
      } else {
        const response = await enrollCourseRequest(course.id)
        dispatch(enrollCourse(response.data.enrollment.courseId))
        invalidateApiCachePrefix('courses')
        invalidateApiCachePrefix('learner-dashboard')
        invalidateApiCachePrefix(`course:${course.id}`)
        const currentCount = getEnrollmentCount(course)
        const nextCount = response.data?.enrollmentCount ?? currentCount + (response.data?.wasAlreadyEnrolled ? 0 : 1)
        setCourses((items) => items.map((item) => (
          item.id === course.id
            ? { ...item, isEnrolled: true, enrollmentCount: nextCount, _count: { ...(item._count || {}), enrollments: nextCount } }
            : item
        )))
        notifyDashboardRefresh({ source: 'explore-enroll', courseId: course.id })
        setNotice(`Enrolled in ${getCourseTitle(course)}.`)
      }
    } catch (err) {
      if (err?.response?.status === 402) {
        const price = formatRupeesFromPaise(err.response.data?.priceCents || course.priceCents || 0)
        try {
          const checkout = await createCheckout({ courseId: course.id }, window.crypto.randomUUID())
          if (checkout.data?.checkoutUrl) window.location.assign(checkout.data.checkoutUrl)
          else setError(`Secure checkout could not be opened. Cost to enroll is ${price}.`)
        } catch (checkoutError) {
          setError(checkoutError?.response?.data?.message || err.response.data?.message || `Payment required. Cost to enroll is ${price}.`)
        }
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
  const trendingSearches = useMemo(() => {
    const tags = new Set()
    courses.forEach((course) => {
      ;[course.category, course.level, ...(course.tags || [])].filter(Boolean).forEach((tag) => tags.add(String(tag)))
    })
    return [...tags].slice(0, 8)
  }, [courses])
  const searchSuggestions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return courses.filter((course) => [getCourseTitle(course), course.category, course.level, course.createdBy?.name, ...(course.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(needle)).slice(0, 6)
  }, [courses, query])

  function openSuggestion(course) {
    setSearchOpen(false)
    setActiveSuggestion(-1)
    navigate(`/course/${course.id}`)
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setSearchOpen(false)
      setActiveSuggestion(-1)
      return
    }
    if (!searchSuggestions.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSearchOpen(true)
      setActiveSuggestion((current) => (current + 1) % searchSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSearchOpen(true)
      setActiveSuggestion((current) => (current <= 0 ? searchSuggestions.length - 1 : current - 1))
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault()
      openSuggestion(searchSuggestions[activeSuggestion])
    }
  }

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const haystack = [
          getCourseTitle(course),
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
  const filterPanel = (
    <div className="course-filter-panel enterprise-glass-panel space-y-5 rounded-none border-0 p-5 shadow-none xl:min-h-full xl:rounded-xl xl:border xl:border-[var(--border-color)] xl:shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Filters</p>
        <button type="button" onClick={resetFilters} className="inline-flex min-h-11 items-center px-2 text-xs font-semibold text-[var(--accent-primary)]">Clear all</button>
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
        <SlidersHorizontal size={16} className="mr-2" /> Show Results
      </Button>
    </div>
  )

  return (
    <motion.section className="courses-page h-full min-h-0 overflow-hidden" variants={fadeInUp} initial="hidden" animate="visible">
      <div className="grid h-full min-h-0 overflow-hidden xl:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside className="hidden h-full min-h-0 flex-col overflow-hidden border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 xl:flex">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            {filterPanel}
          </div>
        </aside>

        {filtersOpen ? (
          <div className="fixed inset-x-0 bottom-0 top-[72px] z-40 xl:hidden">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-slate-950/45"
              onClick={() => setFiltersOpen(false)}
            />
            <aside ref={filterDrawerRef} role="dialog" aria-modal="true" aria-labelledby="mobile-course-filters-title" tabIndex={-1} className="absolute bottom-0 left-0 top-0 w-[min(22rem,88vw)] overflow-y-auto overscroll-contain bg-[var(--bg-card)] shadow-2xl">
              <h2 id="mobile-course-filters-title" className="sr-only">Filter courses</h2>
              {filterPanel}
            </aside>
          </div>
        ) : null}

        <div className="h-full min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5 lg:px-6">
          <div className="min-w-0 space-y-4">
            <section className={`course-hero-panel enterprise-mesh-panel rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_18%,var(--border-color))] bg-[linear-gradient(135deg,rgba(255,107,53,0.12),rgba(20,184,166,0.14),rgba(37,99,235,0.10))] p-4 shadow-[0_18px_45px_rgba(37,99,235,0.08)] sm:p-5 ${pageDarkSurface} dark:border-[color-mix(in_srgb,var(--accent-primary)_20%,var(--border-color))] dark:shadow-[0_22px_55px_rgba(15,23,42,0.42)]`}>
              <div className="grid gap-4">
                <div>
                  <p className={`inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_22%,transparent)] bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-primary)] shadow-sm ${isDark ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-200' : ''} dark:border-[var(--border-color)] dark:bg-[var(--bg-elevated)]`}>
                    <Sparkles size={14} /> Explore courses
                  </p>
                  <h1 className={`mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl ${pageTextPrimary}`}>
                    Unlock skills. <span className={pageAccentText}>Build your future.</span>
                  </h1>
                  <p className={`mt-3 max-w-3xl text-sm leading-6 ${pageTextSecondary}`}>
                    Discover your actual UptoSkills course catalog across categories, levels, instructors, pricing, and progress.
                  </p>
                  <label className={`relative mt-4 flex min-h-11 max-w-3xl items-center gap-3 rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_16%,var(--border-color))] bg-white/92 px-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] focus-within:border-[var(--accent-primary)] focus-within:ring-4 focus-within:ring-[var(--focus-ring)] ${isDark ? 'border-cyan-400/25 bg-slate-950/55 shadow-[0_10px_28px_rgba(8,47,73,0.4)]' : ''} dark:border-[var(--border-color)] dark:bg-[var(--bg-secondary)]`}>
                    <Search size={18} className={pageAccentText} />
                    <input
                      value={query}
                      onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); setActiveSuggestion(-1) }}
                      onFocus={() => setSearchOpen(true)}
                      onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
                      onKeyDown={handleSearchKeyDown}
                      className={`w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)] ${pageTextPrimary} ${isDark ? 'placeholder:text-slate-400' : ''}`}
                      placeholder="Search courses, instructors, or topics..."
                      aria-label="Search courses, instructors, or topics"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={searchOpen && Boolean(query.trim())}
                      aria-controls="course-search-suggestions"
                      aria-activedescendant={activeSuggestion >= 0 ? `course-suggestion-${activeSuggestion}` : undefined}
                    />
                    {searchOpen && query.trim() ? (
                      <div id="course-search-suggestions" role="listbox" className={`absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_14%,var(--border-color))] bg-[var(--bg-elevated)] p-2 shadow-[var(--shadow-overlay)] ${isDark ? 'border-cyan-400/20 bg-slate-950/95' : ''}`}>
                        {searchSuggestions.length ? searchSuggestions.map((course, index) => (
                          <button id={`course-suggestion-${index}`} key={course.id} type="button" role="option" aria-selected={activeSuggestion === index} onMouseEnter={() => setActiveSuggestion(index)} onMouseDown={(event) => { event.preventDefault(); openSuggestion(course) }} className={`flex min-h-16 w-full items-center gap-3 rounded-lg p-2 text-left transition ${activeSuggestion === index ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-subtle)]'} ${isDark ? 'text-white hover:bg-cyan-500/10' : ''}`}>
                            <span className="grid h-14 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-[color-mix(in_srgb,var(--accent-primary)_14%,var(--border-color))] bg-[linear-gradient(135deg,rgba(255,107,53,0.08),rgba(20,184,166,0.08))]"><img src={resolveCourseThumbnail(course)} alt="" className="h-full w-full object-contain" /></span>
                            <span className="min-w-0 flex-1"><span className={`block truncate text-sm font-bold ${pageTextPrimary}`}>{getCourseTitle(course)}</span><span className={`mt-1 block truncate text-xs ${pageTextSecondary}`}>{course.createdBy?.name || 'Instructor'} - {course.level || 'Beginner'} - {course.category || 'Course'}</span></span>
                          </button>
                        )) : <div className={`p-4 text-sm ${pageTextSecondary}`}>No live suggestions match "{query.trim()}". Press Enter to keep filtering the catalog.</div>}
                      </div>
                    ) : null}
                  </label>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric value={courses.length} label="Courses" />
                <Metric value={`${categories.length - 1}+`} label="Categories" />
                <Metric value={`${totalLearners}+`} label="Learners" />
                <Metric value={averageRating} label="Average Rating" icon={<Star size={14} className="fill-[var(--accent-warm)] text-[var(--accent-warm)]" />} />
              </div>
            </section>

            {notice ? <p className={`rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 ${isDark ? 'border-emerald-300/30 bg-emerald-500/15 text-emerald-100' : ''}`}>{notice}</p> : null}
            {error && courses.length ? <p className={`rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 ${isDark ? 'border-rose-300/30 bg-rose-500/15 text-rose-100' : ''}`}>{error}</p> : null}

            <section className={`course-toolbar-panel enterprise-glass-panel rounded-2xl border border-[color-mix(in_srgb,var(--accent-primary)_10%,var(--border-color))] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,251,255,0.88))] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] ${isDark ? 'border-cyan-400/15 bg-[linear-gradient(180deg,rgba(2,6,23,0.92),rgba(15,23,42,0.88))] shadow-[0_18px_40px_rgba(8,47,73,0.34)]' : ''} dark:border-transparent dark:bg-transparent dark:shadow-soft`}>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`mr-2 text-xs font-bold uppercase tracking-[0.12em] ${pageTextPrimary}`}>Trending Searches:</span>
                  {trendingSearches.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setQuery(tag)}
                      className={`min-h-11 rounded-full border border-[color-mix(in_srgb,var(--accent-primary)_12%,var(--border-color))] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] ${isDark ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:border-cyan-300 hover:text-white' : ''} dark:border-[var(--border-color)] dark:bg-[var(--bg-subtle)]`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="secondary" onClick={() => setFiltersOpen((value) => !value)} className="xl:hidden">
                    {filtersOpen ? <X size={16} className="mr-2" /> : <SlidersHorizontal size={16} className="mr-2" />}
                    Filters {activeFilterCount ? `(${activeFilterCount})` : ''}
                  </Button>
                  <div className={`flex min-h-11 items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_12%,var(--border-color))] bg-white/90 px-3 shadow-sm ${isDark ? 'border-cyan-400/20 bg-slate-950/70 shadow-[0_10px_24px_rgba(8,47,73,0.28)]' : ''} dark:border-[var(--border-color)] dark:bg-[var(--bg-secondary)]`}>
                    <span className={`whitespace-nowrap text-xs font-semibold ${pageTextMuted}`}>Sort by</span>
                    <label className="relative">
                      <span className="sr-only">Sort courses by</span>
                      <select
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value)}
                        className={`min-h-0 w-32 appearance-none border-0 bg-transparent py-1 pl-0 pr-6 text-sm font-semibold outline-none ${pageTextPrimary}`}
                      >
                        <option value="popular">Most Popular</option>
                        <option value="rating">Highest Rated</option>
                        <option value="price-low">Lowest Price</option>
                        <option value="newest">Newest</option>
                      </select>
                      <ChevronDown className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 ${pageTextMuted}`} size={15} />
                    </label>
                  </div>
                  <span className={`hidden h-10 w-10 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_14%,var(--border-color))] bg-[linear-gradient(135deg,rgba(255,107,53,0.12),rgba(20,184,166,0.12))] text-[var(--accent-primary)] shadow-sm ${isDark ? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200' : ''} sm:grid`}>
                    <Grid2X2 size={18} />
                  </span>
                </div>
              </div>

              <div className={`mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4 ${isDark ? 'border-cyan-400/15' : ''}`}>
                <p className={`text-sm font-bold ${pageTextPrimary}`}>{sortedCourses.length} courses found</p>
                {activeFilterCount ? <button type="button" onClick={resetFilters} className={`text-sm font-semibold ${pageAccentText}`}>Clear filters</button> : null}
              </div>
            </section>

            <div className="grid min-h-0 gap-4 overflow-visible md:grid-cols-2 2xl:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }, (_, index) => <CourseCardSkeleton key={index} />)
              ) : error && !courses.length ? (
                <div className="col-span-full platform-empty-state" role="alert">
                  <div>
                    <X className={`mx-auto ${isDark ? 'text-rose-300' : 'text-[var(--danger)]'}`} size={34} />
                    <p className={`mt-3 text-base font-bold ${pageTextPrimary}`}>Courses could not be loaded</p>
                    <p className={`mt-1 max-w-md text-sm ${pageTextSecondary}`}>{error}</p>
                    <Button className="mt-5" onClick={loadCourses}>Try again</Button>
                  </div>
                </div>
              ) : sortedCourses.length ? (
                sortedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onViewDetails={() => navigate(`/course/${course.id}`)}
                    onEnrollToggle={handleEnrollmentToggle}
                    onContinue={() => navigate(`/player/${course.id}`)}
                    enrollmentBusy={busyCourseId === course.id}
                  />
                ))
              ) : (
                <div className="col-span-full platform-empty-state">
                  <div>
                    <Search className={`mx-auto ${pageTextMuted}`} size={36} />
                    <p className={`mt-3 text-base font-bold ${pageTextPrimary}`}>No matching courses found</p>
                    <p className={`mt-1 max-w-md text-sm ${pageTextSecondary}`}>
                      Try a different keyword or clear filters to discover more learning paths.
                    </p>
                    <Button variant="secondary" className="mt-5" onClick={resetFilters}>Clear filters</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function FilterGroup({ title, children }) {
  const { theme: resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const titleColor = isDark ? 'text-white' : 'text-[var(--text-primary)]'
  const mutedColor = isDark ? 'text-cyan-200' : 'text-[var(--text-muted)]'

  return (
    <div className="border-t border-[color-mix(in_srgb,var(--accent-primary)_10%,var(--border-color))] pt-4">
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-xs font-black uppercase tracking-[0.16em] ${titleColor}`}>{title}</p>
        <ChevronDown size={14} className={mutedColor} aria-hidden="true" />
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FilterOption({ checked, label, count, onClick, icon }) {
  const { theme: resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const optionTone = isDark ? 'text-white' : 'text-[var(--text-secondary)]'
  const countTone = isDark ? 'text-cyan-100' : 'text-[var(--text-secondary)]'

  return (
    <button type="button" onClick={onClick} aria-pressed={checked} className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-xs transition ${checked ? 'border border-[color-mix(in_srgb,var(--accent-primary)_20%,var(--border-color))] bg-[color-mix(in_srgb,var(--accent-soft)_60%,white)] text-[var(--text-primary)] shadow-sm dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-white' : `text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] ${isDark ? 'text-cyan-100 hover:bg-cyan-500/10' : ''}`}`}>
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white dark:border-cyan-300 dark:bg-cyan-300 dark:text-slate-950' : 'border-[var(--border-muted)] bg-[var(--bg-secondary)] dark:border-cyan-400/30 dark:bg-slate-950/60'}`}>
        {checked ? <Check size={11} /> : null}
      </span>
      <span className={`min-w-0 flex-1 truncate ${optionTone}`}>{icon || label}</span>
      <span className={countTone}>{count ?? 0}</span>
    </button>
  )
}

function Metric({ value, label, icon }) {
  const { theme: resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const textColor = isDark ? '#ffffff' : '#000000'
  const iconNode = isValidElement(icon)
    ? cloneElement(icon, {
        color: textColor,
        className: `${icon.props.className || ''} ${isDark ? 'text-white' : 'text-black'}`.trim(),
        style: { ...(icon.props.style || {}), color: textColor, fill: 'none' },
      })
    : icon

  return (
    <div className="enterprise-glow-card rounded-xl border border-[color-mix(in_srgb,var(--accent-primary)_12%,var(--border-color))] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,247,241,0.92))] px-3 py-2.5 shadow-[0_12px_26px_rgba(15,23,42,0.06)] dark:border-[var(--border-color)] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.88))]">
      <p className="flex items-center gap-1 text-xl font-black" style={{ color: textColor, WebkitTextFillColor: textColor }}>
        {value}{iconNode}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: textColor, WebkitTextFillColor: textColor, opacity: 0.82 }}>{label}</p>
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="min-h-[25rem] animate-pulse rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3" aria-label="Loading course" role="status">
      <div className="aspect-video rounded-lg bg-[var(--bg-subtle)]" />
      <div className="mt-4 flex gap-3">
        <div className="h-10 w-10 rounded-lg bg-[var(--bg-subtle)]" />
        <div className="flex-1 space-y-2"><div className="h-4 w-4/5 rounded bg-[var(--bg-subtle)]" /><div className="h-3 w-2/3 rounded bg-[var(--bg-subtle)]" /></div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2"><div className="h-9 rounded-lg bg-[var(--bg-subtle)]" /><div className="h-9 rounded-lg bg-[var(--bg-subtle)]" /><div className="h-9 rounded-lg bg-[var(--bg-subtle)]" /></div>
      <div className="mt-4 flex gap-2"><div className="h-7 w-20 rounded-lg bg-[var(--bg-subtle)]" /><div className="h-7 w-24 rounded-lg bg-[var(--bg-subtle)]" /></div>
      <div className="mt-8 h-11 rounded-lg bg-[var(--bg-subtle)]" />
    </div>
  )
}
