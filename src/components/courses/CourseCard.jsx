import { motion } from 'framer-motion'
import { Heart, Star, Clock, CheckCircle2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist } from '../../redux/slices/authSlice.js'
import { cn } from '../../utils/classNames.js'

export default function CourseCard({ course, onViewDetails }) {
  const dispatch = useDispatch()
  const wishlist = useSelector((state) => state.auth.wishlist)
  const active = wishlist.includes(course.id)
  const image = course.image || course.thumbnail

  return (
    <motion.article
      whileHover={{ y: -10 }}
      className="glass-card relative overflow-hidden border-white/10 p-5 shadow-glow"
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-cyan-500/25 via-violet-500/15 to-fuchsia-500/10 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <img src={image} alt={course.title} className="h-20 w-20 rounded-3xl object-cover shadow-xl" />
        <div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            {course.level}
          </span>
          <h3 className="mt-3 text-lg font-semibold text-white">{course.title}</h3>
          <p className="mt-2 text-sm text-slate-300">{course.instructor}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-slate-300 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2 text-sm">
          <Star size={16} className="text-amber-300" /> {course.rating}
        </span>
        <span className="inline-flex items-center gap-2 text-sm">
          <Clock size={16} className="text-cyan-300" /> {course.duration}
        </span>
        <span className="inline-flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="text-green-300" /> {course.enrolled || 0} learners
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-slate-400">
          <Heart size={16} className={cn('transition', active ? 'text-rose-400' : 'text-slate-500')} />
          {active ? 'Wishlisted' : 'Add to Wishlist'}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onViewDetails}
          className="btn-secondary min-w-[130px]"
          type="button"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleWishlist(course.id))}
          className={cn(
            'btn-glow min-w-[140px] text-sm',
            active ? 'bg-white/10 text-white border border-cyan-400' : 'bg-cyan-500 text-slate-950',
          )}
        >
          {active ? 'Saved' : 'Add Wishlist'}
        </button>
      </div>
    </motion.article>
  )
}
