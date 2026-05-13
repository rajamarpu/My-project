import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login } from '../../redux/slices/authSlice.js'
import { motion } from 'framer-motion'
import Button from '../../components/ui/Button.jsx'
import { fadeInUp } from '../../animations/variants.js'

const roles = [
  { key: 'learner', label: 'Learner', color: 'from-cyan-400 to-sky-500' },
  { key: 'instructor', label: 'Instructor', color: 'from-violet-500 to-fuchsia-500' },
  { key: 'admin', label: 'Admin', color: 'from-amber-400 to-orange-500' },
]

export default function AuthPage() {
  const [role, setRole] = useState('learner')
  const [method, setMethod] = useState('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    dispatch(login({ user: email || 'student@celebrity.com', role }))
    navigate(role === 'admin' ? '/admin' : role === 'instructor' ? '/instructor' : '/dashboard')
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-12 rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-glow sm:grid-cols-[1.1fr_0.9fr] lg:p-12">
        <motion.section variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6 rounded-[2rem] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900/90 p-8 shadow-soft">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-300">Secure sign in</p>
            <h1 className="text-4xl font-semibold text-white">Welcome back to Celebrity Academy</h1>
            <p className="text-slate-400">Login with your role to continue your premium journey, access AI mentoring, and join celebrity-led courses.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {roles.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRole(item.key)}
                className={`rounded-3xl border px-4 py-4 text-left transition ${
                  role === item.key ? 'border-transparent bg-gradient-to-r text-slate-950 shadow-glow' : 'border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40'
                }`}
              >
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">{item.label}</p>
                <p className="mt-2 text-sm text-slate-200">{item.key === 'learner' ? 'Explore courses and join live sessions' : item.key === 'instructor' ? 'Create celebrity classes and track earnings' : 'Review platform operations and reports'}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Login method</h2>
              <div className="flex gap-2 rounded-full bg-slate-950/60 p-1 text-sm text-slate-300">
                <button onClick={() => setMethod('password')} className={`rounded-full px-4 py-2 transition ${method === 'password' ? 'bg-cyan-500 text-slate-950' : 'hover:bg-white/10'}`}>Password</button>
                <button onClick={() => setMethod('otp')} className={`rounded-full px-4 py-2 transition ${method === 'otp' ? 'bg-cyan-500 text-slate-950' : 'hover:bg-white/10'}`}>OTP</button>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block text-sm text-slate-300">Email address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@celebrityacademy.com"
                className="w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
              />
              {method === 'password' ? (
                <>
                  <label className="block text-sm text-slate-300">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter your secure password"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm text-slate-300">OTP code</label>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    type="text"
                    placeholder="123456"
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/75 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300"
                  />
                </>
              )}
              <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400" /> Remember me
                </label>
                <button type="button" className="text-cyan-300 hover:text-cyan-100">Forgot password?</button>
              </div>
              <Button type="submit">Continue as {role.charAt(0).toUpperCase() + role.slice(1)}</Button>
            </form>

            <div className="grid gap-3 text-center text-sm text-slate-400">
              <p>Or continue with</p>
              <div className="grid grid-cols-3 gap-3">
                <button className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">Google</button>
                <button className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">GitHub</button>
                <button className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">Magic Link</button>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.aside variants={fadeInUp} initial="hidden" animate="visible" className="rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-soft">
          <div className="mb-8 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Authentication</p>
            <h2 className="text-3xl font-semibold text-white">An immersive login experience for every role.</h2>
            <p className="text-slate-400">Learners, instructors, and admins each receive a connected onboarding page with tailored visuals, color accents, and motivational microcopy.</p>
          </div>
          <div className="grid gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <div className="space-y-2 rounded-3xl bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Security focus</p>
              <p className="text-slate-300">Animated CAPTCHA, role-aware theming, and passwordless login options keep the academy premium and safe.</p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">AI assistant</p>
                <p className="mt-2">One-click help for login and onboarding through our smart academy concierge.</p>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-slate-300">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Performance</p>
                <p className="mt-2">Lightning-fast connection with responsive animations across desktop and mobile.</p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  )
}
