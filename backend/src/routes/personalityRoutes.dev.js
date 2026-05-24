import { Router } from 'express'

const router = Router()

// Mock personalities while auth/profile data lives in PostgreSQL.
const mockPersonalities = [
  {
    _id: 'srk',
    name: 'Shah Rukh Khan',
    category: 'Bollywood',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    voiceStyle: 'energetic',
    teachingTone: 'motivational',
    gestureStyle: 'expressive',
    colorTheme: {
      primary: 'from-amber-500 to-orange-600',
      accent: 'text-amber-400',
      bg: 'from-amber-500/10 via-transparent to-orange-500/5'
    },
    personalityBio: 'The King of Bollywood brings his charismatic energy.',
    teachingStyle: 'Storytelling approach with real-life examples',
    traits: ['charismatic', 'motivational', 'storyteller', 'expressive']
  },
  {
    _id: 'ranveer',
    name: 'Ranveer Singh',
    category: 'Bollywood',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    voiceStyle: 'energetic',
    teachingTone: 'enthusiastic',
    gestureStyle: 'dynamic',
    colorTheme: {
      primary: 'from-pink-500 to-rose-600',
      accent: 'text-pink-400',
      bg: 'from-pink-500/10 via-transparent to-rose-500/5'
    },
    personalityBio: 'Ranveer\'s boundless energy makes learning fun.',
    teachingStyle: 'High-energy delivery with interactive elements',
    traits: ['energetic', 'fun', 'creative', 'interactive']
  }
]

router.get('/', (req, res) => {
  res.json(mockPersonalities)
})

router.get('/:id', (req, res) => {
  const personality = mockPersonalities.find(p => p._id === req.params.id)
  if (!personality) return res.status(404).json({ message: 'Personality not found' })
  res.json(personality)
})

router.get('/category/:category', (req, res) => {
  const filtered = mockPersonalities.filter(p => p.category === req.params.category)
  res.json(filtered)
})

export default router
