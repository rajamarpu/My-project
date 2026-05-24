import { motion } from 'framer-motion'
import { Heart, Play } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedPersonality, toggleFavorite } from '../../redux/slices/personalitySlice'
import { cn } from '../../utils/classNames.js'

export default function PersonalityCard({ personality, onSelect, showDemo = true }) {
  const dispatch = useDispatch()
  const selectedPersonality = useSelector((state) => state.personality.selectedPersonality)
  const favorites = useSelector((state) => state.personality.favorites)
  const isFavorite = favorites.includes(personality.id)
  const isSelected = selectedPersonality?.id === personality.id

  const handleSelect = () => {
    dispatch(setSelectedPersonality(personality))
    onSelect?.(personality)
  }

  const handleToggleFavorite = (e) => {
    e.stopPropagation()
    dispatch(toggleFavorite(personality.id))
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={handleSelect}
      className={cn(
        'glass-card relative cursor-pointer overflow-hidden rounded-3xl p-6',
        isSelected ? 'ring-2 ring-cyan-400' : ''
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-20', personality.colorTheme.bg)} />
      
      <button
        onClick={handleToggleFavorite}
        className="absolute top-4 right-4 z-10 rounded-full p-2 bg-white/10 hover:bg-white/20 transition-colors"
      >
        <Heart className={cn('w-5 h-5', isFavorite ? 'fill-rose-400 text-rose-400' : 'text-white')} />
      </button>

      <div className="relative flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <img
            src={personality.avatar}
            alt={personality.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
          />
          <span className={cn(
            'absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900',
            personality.isActive ? 'bg-green-400' : 'bg-slate-500'
          )} />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">{personality.name}</h3>
          <p className="text-sm text-slate-400">{personality.category}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {personality.traits?.slice(0, 3).map((trait) => (
            <span
              key={trait}
              className={cn(
                'px-3 py-1 rounded-full text-xs bg-gradient-to-r',
                personality.colorTheme.primary,
                'text-white'
              )}
            >
              {trait}
            </span>
          ))}
        </div>

        {showDemo && personality.demoPreview && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">Preview Style</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}