import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic2, RefreshCw, Sparkles, Star, Volume2, X } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { aiPersonalities } from '../../../constants/aiPersonalities.js'
import { setSelectedPersonality } from '../../../store/slices/personalitySlice.js'
import Button from '../../common/Button/Button.jsx'

const preferredTeachers = ['rohit', 'dhoni', 'srk', 'sachin', 'virat', 'deepika']

export default function TeacherSwitcher({ courseTeacherId = 'rohit' }) {
  const dispatch = useDispatch()
  const selected = useSelector((state) => state.personality.selectedPersonality)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  const teachers = useMemo(
    () => preferredTeachers
      .map((id) => aiPersonalities.find((teacher) => teacher.id === id))
      .filter(Boolean),
    [],
  )

  const activeTeacher = selected || teachers.find((teacher) => teacher.id === courseTeacherId) || teachers[0]

  const chooseTeacher = (teacher) => {
    setSwitching(true)
    dispatch(setSelectedPersonality(teacher))
    window.setTimeout(() => {
      setSwitching(false)
      setOpen(false)
    }, 420)
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={activeTeacher.avatar} alt={activeTeacher.name} className="h-14 w-14 rounded-xl object-cover ring-2 ring-cyan-300/40" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Active AI teacher</p>
            <h3 className="truncate text-lg font-semibold text-white">{activeTeacher.name}</h3>
            <p className="truncate text-sm text-slate-300">{activeTeacher.voiceStyle}</p>
          </div>
        </div>
        <Button type="button" onClick={() => setOpen(true)} className="shrink-0">
          <RefreshCw size={17} />
          Switch Teacher
        </Button>
      </div>

      <AnimatePresence>
        {switching ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl bg-cyan-400/10 text-sm font-semibold text-cyan-100 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Syncing avatar, voice, and personality...
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/82 px-4 py-8 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-slate-950 p-5 shadow-[0_30px_120px_rgba(34,211,238,0.18)] sm:p-7"
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">Teacher switcher</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Choose your AI lecture personality</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    The learning UI updates instantly with a new avatar, voice style, teaching tone, and mentor profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  aria-label="Close teacher switcher"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {teachers.map((teacher) => {
                  const active = activeTeacher.id === teacher.id
                  return (
                    <motion.button
                      key={teacher.id}
                      type="button"
                      onClick={() => chooseTeacher(teacher)}
                      className={[
                        'group relative overflow-hidden rounded-2xl border p-4 text-left transition',
                        active ? 'border-cyan-300/70 bg-cyan-400/10' : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/45 hover:bg-white/[0.07]',
                      ].join(' ')}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-70" />
                      <div className="flex items-start gap-4">
                        <img src={teacher.avatar} alt={teacher.name} className="h-20 w-20 rounded-xl object-cover ring-1 ring-white/15" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="truncate text-lg font-semibold text-white">{teacher.name}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/10 px-2 py-1 text-xs text-amber-200">
                              <Star size={13} fill="currentColor" />
                              {teacher.rating}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-cyan-100">{teacher.teachingTone}</p>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{teacher.specialty}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2"><Volume2 size={14} /> {teacher.voiceStyle}</span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-slate-900/80 px-3 py-2"><Mic2 size={14} /> {teacher.category}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {teacher.traits.map((trait) => (
                          <span key={trait} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                            {trait}
                          </span>
                        ))}
                      </div>
                      {active ? (
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                          <Sparkles size={15} /> Active now
                        </span>
                      ) : null}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

