import { celebCourses } from '../../data/dummyData.js'
import Button from '../../components/ui/Button.jsx'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

const learnerFeatures = [
  {
    icon: '🎓',
    title: 'Expert-Led Courses',
    description: 'Learn from industry professionals and AI-powered instructors'
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Real-time analytics of your learning journey'
  },
  {
    icon: '🏆',
    title: 'Achievements',
    description: 'Earn certificates and unlock achievements'
  }
]

function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 2
  }))
}

export default function LearnerDashboard() {
  const navigate = useNavigate()
  const particles = useMemo(() => generateParticles(15), [])

  return (
    <section className="space-y-10 pb-16">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 p-8 shadow-2xl"
      >
        <div className="absolute inset-0">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to Your Learning Journey
          </h1>
          <p className="text-slate-300 max-w-2xl mb-6">
            Continue learning with AI expert instructors. Track your progress and achieve your goals.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/explore')} size="lg">
              Browse Courses
            </Button>
            <Button variant="secondary" onClick={() => navigate('/my-courses')}>
              My Learning
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 text-center"
        >
          <div className="text-4xl font-bold text-cyan-400 mb-2">12</div>
          <div className="text-slate-300">Courses Enrolled</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 text-center"
        >
          <div className="text-4xl font-bold text-purple-400 mb-2">86%</div>
          <div className="text-slate-300">Average Progress</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 text-center"
        >
          <div className="text-4xl font-bold text-amber-400 mb-2">5</div>
          <div className="text-slate-300">Certificates</div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 text-center"
        >
          <div className="text-4xl font-bold text-green-400 mb-2">7</div>
          <div className="text-slate-300">Day Streak</div>
        </motion.div>
      </div>

      {/* Continue Learning Section */}
      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">Continue Learning</h2>
          <Button variant="secondary" onClick={() => navigate('/courses')}>
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {celebCourses.slice(0, 2).map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card rounded-3xl p-6 border border-white/10 bg-slate-950/50"
            >
              <div className="flex gap-4 mb-4">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-20 h-20 rounded-2xl object-cover" 
                />
                <div>
                  <h3 className="font-semibold text-white">{course.title}</h3>
                  <p className="text-sm text-slate-400">{course.instructor}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-300 mb-2">
                  <span>Progress</span>
                  <span>67%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-cyan-400 to-purple-500" />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/player/${course.id}`)}
                >
                  Resume
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  Details
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Your Learning Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {learnerFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-card rounded-3xl p-6 text-center border border-white/10 bg-slate-950/50"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}