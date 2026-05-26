import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import PersonalityCard from '../../components/ui/TeacherSwitcher/PersonalityCard.jsx'
import { aiPersonalities } from '../../constants/aiPersonalities.js'

const categories = ['All', 'Actor', 'Cricketer']

export default function PersonalityShowcasePage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedPersonality, setSelectedPersonality] = useState(null)
  const [personalities, setPersonalities] = useState([])
  const [loading, setLoading] = useState(true)

   async function loadPersonalities() {
     try {
       setLoading(true)
       // Temporarily disable API call to use local data
       // const response = await fetchPersonalities()
       // if (response.data.success && response.data.personalities) {
       //   setPersonalities(response.data.personalities)
       // } else {
       //   setPersonalities(aiPersonalities)
       // }
       setPersonalities(aiPersonalities)
     } catch (error) {
       console.error('Failed to load personalities:', error)
       setPersonalities(aiPersonalities)
     } finally {
       setLoading(false)
     }
   }

  useEffect(() => {
    void Promise.resolve().then(loadPersonalities)
  }, [])

  const filteredPersonalities = activeCategory === 'All' 
    ? personalities 
    : personalities.filter(p => p.category === activeCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-slate-300">Loading personalities...</div>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-16"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">Indian Celebrity AI Teachers</h1>
        <p className="text-slate-300 max-w-2xl">
          Meet AI-generated virtual teachers inspired by Indian actors and cricketers. Each brings a unique teaching style, voice tone, and personality flow that you can switch anytime during your course.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === category
                ? 'bg-cyan-500 text-slate-950'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredPersonalities.map((personality, index) => (
          <motion.div
            key={personality.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PersonalityCard
              personality={personality}
              onSelect={setSelectedPersonality}
            />
          </motion.div>
        ))}
      </div>

      {selectedPersonality && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 border border-cyan-500/30"
        >
          <div className="flex items-start gap-6">
            <img
              src={selectedPersonality.avatar || 'https://via.placeholder.com/150'}
              alt={selectedPersonality.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div>
              <h3 className="text-2xl font-semibold text-white">{selectedPersonality.name}</h3>
              <p className="text-cyan-300">{selectedPersonality.category}</p>
              <p className="mt-3 text-slate-300">{selectedPersonality.bio || selectedPersonality.personalityBio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPersonality.traits?.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-orange-500/20 to-teal-500/20 text-cyan-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  )
}


