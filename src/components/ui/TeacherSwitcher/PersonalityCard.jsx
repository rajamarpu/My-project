import { motion } from 'framer-motion'
import { Heart, Play } from 'lucide-react'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedPersonality, toggleFavorite } from '../../../store/slices/personalitySlice'
import { cn } from '../../../utils/classNames.js'

export default function PersonalityCard({ personality, onSelect, showPreview = true }) {
  const [previewing, setPreviewing] = useState(false)
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

  const handlePreview = (event) => {
    event.stopPropagation()
    setPreviewing(true)
    const previewLine = `${personality.name} style preview. ${personality.personalityBio} This lesson will use ${personality.teachingStyle}.`

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(previewLine)
      utterance.rate = personality.category === 'Cricketer' ? 1.04 : 0.98
      utterance.pitch = personality.category === 'Actor' ? 1.08 : 0.96
      utterance.onend = () => setPreviewing(false)
      window.speechSynthesis.speak(utterance)
    } else {
      window.setTimeout(() => setPreviewing(false), 2200)
    }
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
        className="absolute right-4 top-4 z-10 rounded-full bg-[var(--bg-subtle)] p-2 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
      >
        <Heart className={cn('h-5 w-5', isFavorite ? 'fill-orange-500 text-orange-500' : 'text-[var(--text-primary)]')} />
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
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">{personality.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">{personality.category}</p>
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

        {showPreview && personality.previewVideo && (
          <motion.button
            type="button"
            onClick={handlePreview}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 rounded-full bg-[var(--bg-subtle)] px-4 py-2 text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card-hover)]"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">{previewing ? 'Playing Preview' : 'Preview Style'}</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

