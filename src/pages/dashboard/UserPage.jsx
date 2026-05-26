import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Button from '../../components/common/Button/Button.jsx'
import { pageTransition } from '../../utils/animationVariants.js'

const userPermissions = [
  'Browse and enroll in upskilling and technical courses',
  'Save wishlist items and track progress',
  'Join community discussions',
  'Download certificates and review your achievements',
]

export default function UserPage() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  return (
    <motion.section className="space-y-10 pb-16" variants={pageTransition} initial="hidden" animate="enter" exit="exit">
      <div className="glass-card p-8 shadow-glow">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">Profile</p>
        <h1 className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">{user?.fullName || 'Your learner hub'}</h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{user?.email || 'This page gives you a quick overview of your permissions, access, and available learner actions.'}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-card p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Learner permissions</p>
          <div className="mt-8 grid gap-3 text-slate-700 dark:text-slate-300">
            {userPermissions.map((item) => (
              <div key={item} className="rounded-3xl bg-white p-5 text-sm shadow-soft dark:bg-slate-900/80">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8 shadow-glow">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Profile editor</p>
          <div className="mt-6 space-y-3">
            <input className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900" defaultValue={user?.fullName || ''} placeholder="Full name" />
            <input className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900" defaultValue={user?.phone || ''} placeholder="Phone" />
            <input className="w-full rounded-3xl border border-black/10 bg-white px-4 py-3 outline-none dark:border-white/10 dark:bg-slate-900" placeholder="Profile picture URL" />
            <Button variant="secondary">Save Profile</Button>
          </div>
          <p className="mt-8 text-sm uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Quick actions</p>
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


