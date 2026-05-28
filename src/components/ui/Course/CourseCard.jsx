import { motion } from 'framer-motion'
import { Heart, Star, Clock, CheckCircle2, Layers3, Users } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist } from '../../../store/slices/authSlice.js'
import { cn } from '../../../utils/classNames.js'
import { resolveCourseThumbnail } from '../../../utils/courseThumbnail.js'

export default function CourseCard({ course, onViewDetails }) {
  const dispatch = useDispatch()
  const wishlist = useSelector((state) => state.auth.wishlist)
  const active = wishlist.includes(course.id)
  const teacher = course.createdBy || course.instructor || {}
  const progress = course.progress ?? 0
  const tags = course.tags || [course.category, teacher.expertise].filter(Boolean)
  const image = resolveCourseThumbnail(course)
  const isLogoImage = String(image).includes('.svg')
  const isSubjectArtwork = String(image).startsWith('data:image/svg+xml')
  const glowClass = teacher.colorTheme?.bg || 'from-cyan-500/20 via-teal-500/20 to-amber-300/10'

  return (
    <motion.article
      whileHover={{ y: -8, scale: 1.01 }}
      onClick={onViewDetails}
      className="group glass-card relative cursor-pointer overflow-hidden border-white/10 p-4 shadow-glow transition dark:border-white/10 light:border-black/10 sm:p-5"
    >
      <div className={cn('absolute inset-x-0 top-0 h-32 bg-gradient-to-r blur-3xl transition group-hover:opacity-90', glowClass)} />
      <div className="theme-dark relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/50">
        <img
          src={image}
          alt={course.title}
          className={cn(
            'h-40 w-full opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-95',
            isSubjectArtwork ? 'object-fill' : isLogoImage ? 'bg-slate-950 object-contain p-7' : 'object-cover',
          )}
        />
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-cyan-100 backdrop-blur">
            {course.level || 'Beginner'}
          </span>
          <span className="rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur">
            {course.isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex items-start gap-3">
        <img src={teacher.avatarUrl || image} alt={`${teacher.name || 'Instructor'} avatar`} className="h-12 w-12 rounded-2xl border border-cyan-300/30 bg-slate-900 object-cover p-1" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-semibold text-white dark:text-white light:text-slate-900">{course.title}</h3>
          <p className="mt-1 text-sm text-slate-300 dark:text-slate-300 light:text-slate-600">
            Guided by {teacher.name || 'Instructor'}{teacher.bio ? ` - ${teacher.bio}` : ''}
          </p>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 text-slate-300 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2 text-sm text-amber-300">
          <Star size={16} className="text-amber-300" /> {course.rating ?? '0.0'}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-cyan-300 dark:text-cyan-300 light:text-cyan-700">
          <Clock size={16} className="text-cyan-300 dark:text-cyan-300 light:text-cyan-700" /> {course.duration || `${course.lessons?.length || 0} lessons`}
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-green-300 dark:text-green-300 light:text-green-700">
          <Users size={16} className="text-green-300 dark:text-green-300 light:text-green-700" /> {course._count?.enrollments ?? course.enrollments?.length ?? 0} learners
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-teal-300 dark:text-teal-300 light:text-teal-700">
          <Layers3 size={16} /> {course._count?.lessons ?? course.lessons?.length ?? 0} lessons
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400 light:text-slate-500">
          <Heart
            size={16}
            className={cn('transition', active ? 'text-orange-500' : 'text-slate-500 dark:text-slate-500')}
          />
          {active ? 'Wishlisted' : 'Add to Wishlist'}
        </span>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 light:text-slate-600">
            {tag}
          </span>
        ))}
      </div>

      <div className="relative mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800/80">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-teal-400" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap gap-3">
        <button
          onClick={(event) => {
            event.stopPropagation()
            onViewDetails()
          }}
          className="btn-secondary min-w-[130px] dark:border-white/10 light:border-black/10"
          type="button"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            dispatch(toggleWishlist(course.id))
          }}
          className={cn(
            'btn-glow min-w-[140px] text-sm transition-colors',
            active
              ? 'bg-white/10 text-white border border-cyan-400 dark:text-white light:text-slate-900 light:bg-black/5'
              : 'bg-cyan-500 text-slate-950 dark:text-slate-950',
          )}
        >
          {active ? <><CheckCircle2 size={16} className="mr-2" /> Saved</> : 'Add Wishlist'}
        </button>
      </div>
    </motion.article>
  )
}



