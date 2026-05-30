import { motion } from 'framer-motion'
import { Heart, Star, Clock, CheckCircle2, Layers3, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist } from '../../../store/slices/authSlice.js'
import { cn } from '../../../utils/classNames.js'
import { resolveCourseThumbnail } from '../../../utils/courseThumbnail.js'
import { formatRupeesFromPaise } from '../../../utils/money.js'
import { getCourseAssignments, getCourseLessons } from '../../../utils/courseContent.js'

export default function CourseCard({ course, onViewDetails, onEnrollToggle, enrollmentBusy = false }) {
  const dispatch = useDispatch()
  const wishlist = useSelector((state) => state.auth.wishlist)
  const active = wishlist.includes(course.id)
  const teacher = course.createdBy || course.instructor || {}
  const progress = course.progress ?? 0
  const tags = course.tags || [course.category, teacher.expertise].filter(Boolean)
  const image = resolveCourseThumbnail(course)
  const isLogoImage = String(image).includes('.svg')
  const isSubjectArtwork = String(image).startsWith('data:image/svg+xml')
  const glowClass = teacher.colorTheme?.bg || 'from-indigo-500/20 via-violet-500/20 to-purple-300/10'
  const enrollmentCount = course.enrollmentCount ?? course._count?.enrollments ?? course.enrollments?.length ?? 0
  const courseLessons = getCourseLessons(course)
  const courseAssignments = getCourseAssignments(course)
  const isEnrolled = Boolean(course.isEnrolled)
  const priceCents = Number(course.priceCents || 0)
  const priceLabel = priceCents > 0 ? formatRupeesFromPaise(priceCents) : 'Free'

  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.01 }}
      onClick={onViewDetails}
      className="group glass-card relative cursor-pointer overflow-hidden p-4 transition sm:p-5"
    >
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r opacity-70 blur-3xl transition group-hover:opacity-100', glowClass)} />
      <div className="theme-dark relative overflow-hidden rounded-xl border border-white/10 bg-slate-950/60">
        <img
          src={image}
          alt={course.title}
          className={cn(
            'h-40 w-full opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100',
            isSubjectArtwork ? 'object-fill' : isLogoImage ? 'bg-slate-950 object-contain p-7' : 'object-cover',
          )}
        />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur">
            {course.level || 'Beginner'}
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-violet-100 backdrop-blur">
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex items-start gap-3">
        <img src={teacher.avatarUrl || image} alt={`${teacher.name || 'Instructor'} avatar`} className="h-12 w-12 rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] object-cover p-1" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-semibold text-[var(--text-primary)]">{course.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
            Guided by {teacher.name || 'Instructor'}{teacher.bio ? ` - ${teacher.bio}` : ''}
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2 text-sm text-[var(--warning)]">
          <Star size={16} /> {course.rating ?? '0.0'}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[var(--accent-primary)]">
          <Clock size={16} /> {course.duration || `${courseLessons.length} lessons`}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[var(--success)]">
          <Users size={16} /> {enrollmentCount} learners
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Layers3 size={16} /> {courseLessons.length} lessons{courseAssignments.length ? `, ${courseAssignments.length} assignments` : ''}
        </span>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-bold)]">
          {priceLabel}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Heart
            size={16}
            className={cn('transition', active ? 'text-[var(--accent-bold)]' : 'text-[var(--text-muted)]')}
          />
          {active ? 'Wishlisted' : 'Add to Wishlist'}
        </span>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-[var(--border-color)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {tag}
          </span>
        ))}
      </div>

      <div className="relative mt-5">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--brand-gradient)' }} />
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-3">
        <button
          onClick={(event) => {
            event.stopPropagation()
            onViewDetails()
          }}
          className="btn-secondary min-w-[130px]"
          type="button"
        >
          View Details
        </button>
        {onEnrollToggle ? (
          <button
            type="button"
            disabled={enrollmentBusy}
            onClick={(event) => {
              event.stopPropagation()
              onEnrollToggle(course)
            }}
            className={cn(
              'btn-secondary min-w-[130px] disabled:cursor-not-allowed disabled:opacity-60',
              isEnrolled
                ? 'border-red-400/40 text-red-700 hover:bg-red-500/10 dark:text-red-100'
                : 'border-emerald-400/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-100',
            )}
          >
            {enrollmentBusy ? 'Updating...' : isEnrolled ? 'Unenroll' : priceCents > 0 ? `Pay ${priceLabel}` : 'Enroll'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            dispatch(toggleWishlist(course.id))
          }}
          className={cn(
            'btn-glow min-w-[140px] text-sm transition-colors',
            active
              ? 'border border-[var(--accent-primary)] bg-[var(--accent-soft)] text-[var(--accent-primary)]'
              : 'btn-primary text-white shadow-glow',
          )}
        >
          {active ? <><CheckCircle2 size={16} className="mr-2" /> Saved</> : 'Add Wishlist'}
        </button>
      </div>
    </motion.article>
  )
}



