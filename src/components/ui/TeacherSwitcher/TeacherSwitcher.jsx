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
      <div className="theme-subcard flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={activeTeacher.avatar} alt={activeTeacher.name} className="h-14 w-14 rounded-xl object-cover ring-2 ring-cyan-300/40" />
          <div className="min-w-0">
            <p className="theme-eyebrow text-xs uppercase tracking-[0.22em]">Active AI teacher</p>
            <h3 className="truncate text-lg font-semibold text-[var(--text-primary)]">{activeTeacher.name}</h3>
            <p className="truncate text-sm text-[var(--text-secondary)]">{activeTeacher.voiceStyle}</p>
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
            className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-2xl bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-primary)] backdrop-blur-sm"
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
            className="fixed inset-0 z-[80] overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-xl dark:bg-slate-950/82"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="theme-card mx-auto max-w-6xl rounded-2xl p-5 shadow-[0_30px_120px_rgba(34,211,238,0.18)] sm:p-7"
              initial={{ y: 24, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="theme-eyebrow text-sm uppercase tracking-[0.28em]">Teacher switcher</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Choose your AI lecture personality</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                    The learning UI updates instantly with a new avatar, voice style, teaching tone, and mentor profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-subtle)] text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
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
                        active ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-card-hover)]',
                      ].join(' ')}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="absolute inset-x-0 top-0 h-px bg-[var(--brand-gradient)] opacity-70" />
                      <div className="flex items-start gap-4">
                        <img src={teacher.avatar} alt={teacher.name} className="h-20 w-20 rounded-xl object-cover ring-1 ring-[var(--border-color)]" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="truncate text-lg font-semibold text-[var(--text-primary)]">{teacher.name}</h3>
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-orange)]/10 px-2 py-1 text-xs text-[var(--accent-orange)]">
                              <Star size={13} fill="currentColor" />
                              {teacher.rating}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[var(--accent-primary)]">{teacher.teachingTone}</p>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{teacher.specialty}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 text-xs text-[var(--text-secondary)] sm:grid-cols-2">
                        <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-3 py-2"><Volume2 size={14} /> {teacher.voiceStyle}</span>
                        <span className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-subtle)] px-3 py-2"><Mic2 size={14} /> {teacher.category}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {teacher.traits.map((trait) => (
                          <span key={trait} className="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                            {trait}
                          </span>
                        ))}
                      </div>
                      {active ? (
                        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-primary)]">
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

