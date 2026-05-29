import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedPersonality } from '../../../store/slices/personalitySlice'
import { cn } from '../../../utils/classNames.js'

export default function PersonalitySelector({ personalities = [] }) {
  const dispatch = useDispatch()
  const selectedPersonality = useSelector((state) => state.personality.selectedPersonality)
  const favorites = useSelector((state) => state.personality.favorites)

  const handleSelectPersonality = (personality) => {
    dispatch(setSelectedPersonality(personality))
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Choose Your AI Instructor</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {personalities.map((personality) => (
          <motion.button
            key={personality.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelectPersonality(personality)}
            className={cn(
              'relative rounded-2xl p-4 border transition-all duration-300',
              selectedPersonality?.id === personality.id
                ? `border-transparent bg-gradient-to-br ${personality.colorTheme.primary} shadow-lg`
                : 'border-[var(--border-color)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card-hover)]'
            )}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <img
                  src={personality.avatar}
                  alt={personality.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
                />
                {favorites.includes(personality.id) && (
                  <span className="absolute -top-1 -right-1 text-xs text-amber-300">*</span>
                )}
              </div>
              <span className={cn(
                'text-sm font-medium text-center',
                selectedPersonality?.id === personality.id ? 'text-white' : 'text-[var(--text-secondary)]'
              )}>
                {personality.name}
              </span>
            </div>
            {selectedPersonality?.id === personality.id && (
              <motion.div
                layoutId="selectedIndicator"
                className="absolute inset-0 rounded-2xl border-2 border-white pointer-events-none"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

