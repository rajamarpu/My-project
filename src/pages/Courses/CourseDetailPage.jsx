import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Heart, Users, Clock, BarChart3, FileText } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import { enrollCourseRequest, fetchCourseById } from '../../api/api.js'
import { toggleWishlist, enrollCourse } from '../../store/slices/authSlice.js'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const auth = useSelector((state) => state.auth)
  const wishlist = useSelector((state) => state.auth.wishlist)
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')
        const response = await fetchCourseById(courseId)
        setCourse(response.data.course)
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load course.')
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [auth.user, courseId])

  const isSaved = wishlist.includes(course?.id)
  const lessons = course?.lessons || []
  const durationText = useMemo(() => `${lessons.length} lessons`, [lessons.length])

  const handleEnroll = async () => {
    if (!auth.user) {
      navigate('/login')
      return
    }
    try {
      const response = await enrollCourseRequest(course.id)
      dispatch(enrollCourse(response.data.enrollment.courseId))
      navigate(`/player/${course.id}`)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Enrollment failed.')
    }
  }

  if (loading) {
    return <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-slate-300">Loading course...</div>
  }

  if (error && !course) {
    return <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-red-100">{error}</div>
  }

  const instructor = course?.createdBy || {}
  const cover = course?.thumbnailUrl || instructor.avatarUrl || '/favicon.svg'

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card overflow-hidden border-white/10 p-8 shadow-glow bg-slate-950/80">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Course detail</p>
            <h1 className="text-4xl font-semibold text-slate-100">{course.title}</h1>
            <p className="max-w-2xl text-slate-300">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Star size={16} className="text-amber-300" /> {course.rating ?? '0.0'}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Clock size={16} className="text-cyan-300" /> {durationText}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <BarChart3 size={16} className="text-teal-300" /> {course.level}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Users size={16} className="text-green-300" /> {course.enrollments?.length || 0} learners
              </span>
            </div>
          </div>

          <div className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-slate-900 relative">
              <img src={cover} alt={course.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <img
                  src={instructor.avatarUrl || cover}
                  alt={instructor.name}
                  className="w-12 h-12 rounded-full border-2 border-cyan-400 object-cover"
                />
                <span className="text-white font-semibold">with {instructor.name || 'Instructor'}</span>
              </div>
            </div>
            <div className="grid gap-3">
              <Button onClick={handleEnroll} size="lg">{auth.user ? 'Start Learning' : 'Enroll Now'}</Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => dispatch(toggleWishlist(course.id))} className="flex-1">
                  <Heart size={16} className="mr-2" /> {isSaved ? 'Saved' : 'Add Wishlist'}
                </Button>
              </div>
            </div>
            {error ? <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">{error}</p> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            {['Overview', 'Lessons', 'Resources'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === tab.toLowerCase()
                    ? 'bg-cyan-500 text-white shadow-glow'
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
                  Real course rows, lessons, and instructor metadata are loaded from PostgreSQL.
                </div>
                <div className="rounded-3xl bg-slate-900/80 p-5 border border-white/5">
                  Progress is saved to the database through the protected enrollment and progress APIs.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-100">Curriculum</h2>
              <div className="space-y-3">
                {lessons.length ? lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{lesson.title}</span>
                      <span>{lesson.durationMin ? `${lesson.durationMin} min` : lesson.type}</span>
                    </div>
                    {lesson.description ? <p className="mt-2 text-sm text-slate-400">{lesson.description}</p> : null}
                  </div>
                )) : (
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-400">No lessons added yet.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-100">Resources</h2>
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  Course metadata and instructor profile are synced from the backend.
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/5 p-4">Category: {course.category}</div>
                  <div className="rounded-2xl bg-white/5 p-4">Instructor: {instructor.name || 'Instructor'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Course summary</p>
            <ul className="mt-5 space-y-3 text-slate-300">
              <li>Category: {course.category}</li>
              <li>Level: {course.level}</li>
              <li>Lessons: {lessons.length}</li>
              <li>Published: {course.isPublished ? 'Yes' : 'No'}</li>
            </ul>
          </div>

          <div className="rounded-3xl bg-slate-900/80 p-5 border border-white/10">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Instructor</p>
            <div className="mt-4 flex items-center gap-4">
              <img src={instructor.avatarUrl || cover} alt={instructor.name} className="h-16 w-16 rounded-2xl object-cover" />
              <div>
                <p className="font-semibold text-slate-100">{instructor.name || 'Instructor'}</p>
                <p className="text-sm text-slate-400">{instructor.bio || instructor.expertise || 'Backend-synced instructor profile'}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
