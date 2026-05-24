import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { celebCourses } from '../../data/dummyData.js'
import { aiPersonalities } from '../../data/aiPersonalities.js'
import Button from '../../components/ui/Button.jsx'
import PersonalityCard from '../../components/personality/PersonalityCard.jsx'
import { Star, Heart, Users, Clock, BarChart3 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleWishlist, enrollCourse } from '../../redux/slices/authSlice.js'
import { setSelectedPersonality } from '../../redux/slices/personalitySlice.js'
import { motion } from 'framer-motion'
import { enrollCourseRequest } from '../../services/api.js'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const wishlist = useSelector((state) => state.auth.wishlist)
  const selectedPersonality = useSelector((state) => state.personality.selectedPersonality)
  
     const course = useMemo(
     () => celebCourses.find((item) => item.id === courseId) || celebCourses[0],
     [courseId],
   )
  
  const [activeTab, setActiveTab] = useState('overview')
  const [showPersonalitySelector, setShowPersonalitySelector] = useState(false)
  const isSaved = wishlist.includes(course.id)
  const isLogoImage = course.image?.includes('.svg')

  useEffect(() => {
    if (!selectedPersonality && aiPersonalities.length > 0) {
      const defaultPersonality = aiPersonalities.find(p => p.name === course.instructor) || aiPersonalities[0]
      dispatch(setSelectedPersonality(defaultPersonality))
    }
  }, [selectedPersonality, dispatch, course.instructor])

  const handleEnroll = async () => {
    if (!auth.user) {
      navigate('/login')
      return
    }
    try {
      await enrollCourseRequest(course.id, {
        personalitySlug: selectedPersonality?.slug,
      })
    } catch (error) {
      console.warn('Database enrollment skipped, keeping local enrollment:', error.message)
    }
    dispatch(enrollCourse(course.id))
    navigate(`/player/${course.id}`)
  }

  const availablePersonalities = useMemo(() => aiPersonalities, [])

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card overflow-hidden border-white/10 p-8 shadow-glow bg-slate-950/80">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Course detail</p>
            <h1 className="text-4xl font-semibold text-slate-100">{course.title}</h1>
            <p className="max-w-2xl text-slate-300">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Star size={16} className="text-amber-300" /> {course.rating}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Clock size={16} className="text-cyan-300" /> {course.duration}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <BarChart3 size={16} className="text-purple-300" /> {course.level}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Users size={16} className="text-green-300" /> {course.enrolled} learners
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-slate-900 relative">
              <img
                src={course.image}
                alt={course.title}
                className={`h-full w-full ${isLogoImage ? 'object-contain p-10' : 'object-cover'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <img
                  src={selectedPersonality?.avatar || course.image}
                  alt={selectedPersonality?.name}
                  className="w-12 h-12 rounded-full border-2 border-cyan-400"
                />
                <span className="text-white font-semibold">
                  with {selectedPersonality?.name || course.instructor}
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              <Button onClick={handleEnroll} size="lg">{auth.user ? 'Start Learning' : 'Enroll Now'}</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => dispatch(toggleWishlist(course.id))} className="flex-1">
                  <Heart size={16} className="mr-2" /> {isSaved ? 'Saved' : 'Add Wishlist'}
                </Button>
                <Button variant="secondary" onClick={() => setShowPersonalitySelector(true)} className="flex-1">
                  Switch Instructor
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Selector Modal */}
      {showPersonalitySelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPersonalitySelector(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="glass-card rounded-3xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-2">Choose Any Celebrity AI Instructor</h3>
            <p className="mb-4 text-sm text-slate-400">All 8 teachers can teach this course. Switch anytime before learning.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availablePersonalities.map((personality) => (
                <PersonalityCard
                  key={personality.id}
                  personality={personality}
                  onSelect={() => {
                    dispatch(setSelectedPersonality(personality))
                    setShowPersonalitySelector(false)
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            {['Overview', 'Lessons', 'Reviews', 'Discussion'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === tab.toLowerCase()
                    ? 'bg-cyan-500 text-slate-950 shadow-glow'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-5 text-slate-300">
              <h2 className="text-2xl font-semibold text-slate-100">What you will learn</h2>
              <p>{course.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/80 p-5 border border-white/5">
                  Premium cinematic lessons with upskilling-focused production value.
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-5 border border-white/5">
                  AI-generated summaries, quizzes, and resource bundles.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-100">Curriculum</h2>
              <div className="space-y-3">
                {course.curriculum.map((lesson) => (
                  <div
                    key={lesson.title}
                    className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{lesson.title}</span>
                      <span>{lesson.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-100">Student reviews</h2>
              <div className="grid gap-4">
                {course.reviews.map((review) => (
                  <div
                    key={review.name}
                    className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"
                  >
                    <p className="font-semibold text-slate-100">{review.name}</p>
                    <p className="mt-2 text-slate-300">"{review.feedback}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-300">
              <p className="text-lg font-semibold text-slate-100">Course community</p>
              <p className="mt-3">
                Join the upskilling discussion board, ask questions, and follow mentor updates.
              </p>
            </div>
          )}
        </div>

        <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Course summary</p>
            <ul className="mt-5 space-y-3 text-slate-300">
              <li>Category: {course.category}</li>
              <li>Level: {course.level}</li>
              <li>Duration: {course.duration}</li>
              <li>Certificate: Premium verified</li>
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-900/80 p-5 border border-white/10">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">AI Instructor</p>
            <div className="mt-4 flex items-center gap-4">
              <img 
                src={selectedPersonality?.avatar || course.image} 
                alt={selectedPersonality?.name || course.instructor} 
                className="h-16 w-16 rounded-2xl object-cover" 
              />
              <div>
                <p className="font-semibold text-slate-100">
                  {selectedPersonality?.name || course.instructor}
                </p>
                <p className="text-sm text-slate-400">
                  {selectedPersonality?.teachingStyle || 'Celebrity mentor & industry leader'}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
