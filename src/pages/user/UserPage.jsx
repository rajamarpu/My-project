import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { pageTransition } from '../../animations/variants.js'

const userPermissions = [
  'Browse and enroll in celebrity and technical courses',
  'Save wishlist items and track progress',
  'Join community discussions',
  'Download certificates and review your achievements',
]

export default function UserPage() {
  const navigate = useNavigate()

  return (
    <motion.section className="space-y-10 pb-16" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">User page</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Your learner hub</h1>
        <p className="mt-4 text-slate-300">This page gives you a quick overview of your permissions, access, and available learner actions.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-card p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Learner permissions</p>
          <div className="mt-8 grid gap-3 text-slate-300">
            {userPermissions.map((item) => (
              <div key={item} className="rounded-3xl bg-slate-900/80 p-5 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Quick actions</p>
          <div className="mt-8 grid gap-4">
            <Button onClick={() => navigate('/explore')}>Explore Courses</Button>
            <Button variant="secondary" onClick={() => navigate('/certificates')}>View Certificates</Button>
            <Button variant="secondary" onClick={() => navigate('/community')}>Open Community</Button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
