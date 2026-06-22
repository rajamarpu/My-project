import { Star, Clock, Heart, Users, ArrowRight, Loader2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist } from '../../../store/slices/authSlice.js'
import { cn } from '../../../utils/classNames.js'
import { resolveCourseThumbnail } from '../../../utils/courseThumbnail.js'
import { formatRupeesFromPaise } from '../../../utils/money.js'
import { getCourseLessons } from '../../../utils/courseContent.js'
import { removeSavedCourseRequest, saveCourseRequest } from '../../../api/api.js'
import { useState } from 'react'

export default function CourseCard({ course, onViewDetails, onEnrollToggle, onContinue, enrollmentBusy = false }) {
  const dispatch = useDispatch()
  const wishlist = useSelector((state) => state.auth.wishlist)
  const user = useSelector((state) => state.auth.user)
  const [savingWishlist, setSavingWishlist] = useState(false)
  const active = wishlist.includes(course.id)
  const teacher = course.createdBy || course.instructor || {}
  const progress = course.progress ?? 0
  const tags = course.tags || [course.category, teacher.expertise].filter(Boolean)
  const image = resolveCourseThumbnail(course)
  const isLogoImage = String(image).includes('.svg')
  const glowClass = teacher.colorTheme?.bg || 'from-cyan-400/20 via-violet-500/20 to-amber-300/10'
  const enrollmentCount = course.enrollmentCount ?? course._count?.enrollments ?? course.enrollments?.length ?? 0
  const courseLessons = getCourseLessons(course)
  const isEnrolled = Boolean(course.isEnrolled)
  const priceCents = Number(course.priceCents || 0)
  const priceLabel = priceCents > 0 ? formatRupeesFromPaise(priceCents) : 'Free'
  const progressLabel = progress >= 100 ? 'Completed' : progress > 0 ? 'Continue' : 'Not started'

  async function updateWishlist() {
    if (!user || savingWishlist) return
    dispatch(toggleWishlist(course.id))
    try {
      setSavingWishlist(true)
      if (active) await removeSavedCourseRequest(course.id)
      else await saveCourseRequest(course.id)
    } catch {
      dispatch(toggleWishlist(course.id))
    } finally { setSavingWishlist(false) }
  }

  return (
    <article
      className="course-card enterprise-glow-card group glass-card relative flex min-h-[25rem] min-w-0 flex-col overflow-hidden rounded-xl p-3 transition duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
    >
      <button type="button" onClick={onViewDetails} className="absolute inset-0 z-[1] cursor-pointer rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--accent-primary)]" aria-label={`View details for ${course.title}`} />
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r opacity-40 blur-xl transition-opacity duration-150 group-hover:opacity-65', glowClass)} />
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <img
          src={image}
          alt={course.title}
          className={cn(
            'h-full w-full object-contain opacity-95 transition-opacity duration-150 group-hover:opacity-100',
            isLogoImage ? 'p-6' : 'p-0',
          )}
          loading="lazy"
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--accent-bold)] backdrop-blur">
            {course.level || 'Beginner'}
          </span>
          <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--success)] backdrop-blur">
            {priceLabel}
          </span>
        </div>
        {isEnrolled ? (
          <div className="absolute bottom-3 left-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--accent-primary)] backdrop-blur">
            {progressLabel}
          </div>
        ) : null}
      </div>

      <div className="relative mt-4 flex items-start gap-3">
        <img src={teacher.avatarUrl || image} alt={`${teacher.name || 'Instructor'} avatar`} className="h-10 w-10 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] object-contain p-1" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-base font-black leading-snug text-[var(--text-primary)]">{course.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
            Guided by {teacher.name || 'Instructor'}{teacher.bio ? ` - ${teacher.bio}` : ''}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          [Star, course.rating ?? '0.0', 'text-[var(--warning)]'],
          [Clock, course.duration || `${courseLessons.length} lessons`, 'text-[var(--accent-primary)]'],
          [Users, `${enrollmentCount} learners`, 'text-[var(--success)]'],
        ].map(([Icon, label, color]) => (
          <span key={label} className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] px-2 text-[0.7rem] font-semibold text-[var(--text-secondary)]">
            <Icon size={13} className={`shrink-0 ${color}`} /> <span className="truncate">{label}</span>
          </span>
        ))}
      </div>

      <div className="relative mt-3 flex min-h-[1.75rem] flex-wrap gap-2">
        {tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-2 py-1 text-[0.68rem] font-medium text-[var(--text-secondary)]">
            {tag}
          </span>
        ))}
      </div>

      {isEnrolled ? <div className="relative mt-3">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
          <span>Learning progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--brand-gradient)' }} />
        </div>
      </div> : null}

      <div className="relative z-10 mt-auto grid w-full grid-cols-[minmax(0,1fr)_2.75rem] gap-2 pt-4">
        {onEnrollToggle ? (
          <button
            type="button"
            aria-label={isEnrolled ? `${progress > 0 ? 'Continue' : 'Start'} ${course.title}` : `Enroll in ${course.title}`}
            disabled={enrollmentBusy}
            onClick={() => (isEnrolled ? onContinue?.(course) : onEnrollToggle(course))}
            className={cn(
              'btn-primary inline-flex min-h-11 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-sm font-bold text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {enrollmentBusy ? <><Loader2 size={14} className="mr-1 animate-spin" /> Updating</> : isEnrolled ? <>{progress > 0 ? 'Continue Learning' : 'Start Learning'} <ArrowRight size={14} className="ml-1" /></> : priceCents > 0 ? `Pay ${priceLabel}` : 'Enroll Now'}
          </button>
        ) : (
          <button type="button" onClick={onViewDetails} className="btn-primary inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-bold text-white">View Course <ArrowRight size={14} className="ml-1" /></button>
        )}
        <button
          type="button"
          aria-label={active ? `Remove ${course.title} from wishlist` : `Add ${course.title} to wishlist`}
          title={active ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={updateWishlist}
          disabled={savingWishlist || !user}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-lg border transition',
            active
              ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
              : 'border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]',
          )}
        >
          <Heart size={17} fill={active ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  )
}



