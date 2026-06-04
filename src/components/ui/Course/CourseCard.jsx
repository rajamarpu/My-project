import { motion } from 'framer-motion'
import { Star, Clock, CheckCircle2, Layers3, Users, ArrowRight } from 'lucide-react'
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
  const glowClass = teacher.colorTheme?.bg || 'from-cyan-400/20 via-violet-500/20 to-amber-300/10'
  const enrollmentCount = course.enrollmentCount ?? course._count?.enrollments ?? course.enrollments?.length ?? 0
  const courseLessons = getCourseLessons(course)
  const courseAssignments = getCourseAssignments(course)
  const isEnrolled = Boolean(course.isEnrolled)
  const priceCents = Number(course.priceCents || 0)
  const priceLabel = priceCents > 0 ? formatRupeesFromPaise(priceCents) : 'Free'

  return (
    <motion.article
      whileHover={{ y: -4 }}
      onClick={onViewDetails}
      className="enterprise-glow-card group glass-card relative flex min-h-[33rem] min-w-0 cursor-pointer flex-col overflow-hidden p-4 transition sm:p-5"
    >
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r opacity-70 blur-3xl transition group-hover:opacity-100', glowClass)} />
      <div className="theme-dark relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950/80">
        <img
          src={image}
          alt={course.title}
          className={cn(
            'h-full w-full opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100',
            isLogoImage ? 'object-contain p-7' : 'object-contain',
          )}
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur">
            {course.level || 'Beginner'}
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur">
            {priceLabel}
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex items-start gap-3">
        <img src={teacher.avatarUrl || image} alt={`${teacher.name || 'Instructor'} avatar`} className="h-11 w-11 rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] object-cover p-1" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-semibold text-[var(--text-primary)]">{course.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">
            Guided by {teacher.name || 'Instructor'}{teacher.bio ? ` - ${teacher.bio}` : ''}
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        {[
          [Star, course.rating ?? '0.0', 'text-[var(--warning)]'],
          [Clock, course.duration || `${courseLessons.length} lessons`, 'text-[var(--accent-primary)]'],
          [Users, `${enrollmentCount} learners`, 'text-[var(--success)]'],
          [Layers3, `${courseLessons.length} lessons${courseAssignments.length ? `, ${courseAssignments.length} assignments` : ''}`, 'text-[var(--text-secondary)]'],
        ].map(([Icon, label, color]) => (
          <span key={label} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--bg-subtle)] px-3 text-sm text-[var(--text-secondary)]">
            <Icon size={15} className={color} /> {label}
          </span>
        ))}
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {tag}
          </span>
        ))}
      </div>

      <div className="relative mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: 'var(--brand-gradient)' }} />
        </div>
      </div>

      <div className="relative mt-auto grid w-full gap-2 pt-4">
        <button
          onClick={(event) => {
            event.stopPropagation()
            onViewDetails()
          }}
          className="inline-flex min-h-10 w-full min-w-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-cyan-400/50 hover:bg-[var(--bg-subtle)]"
          type="button"
        >
          View Details <ArrowRight size={16} className="ml-2" />
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
              'inline-flex min-h-10 w-full min-w-0 items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
              isEnrolled
                ? 'border-red-400/40 text-red-700 hover:bg-red-500/10 dark:text-red-100'
                : 'btn-primary border-transparent text-white shadow-glow hover:brightness-110',
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
            'inline-flex min-h-10 w-full min-w-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition',
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



