import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BookOpen, CheckCircle2, Heart, MessageCircle, Play, Star } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import { courseAPI, enrollmentAPI } from '../../services/api.js'

const tabs = ['overview', 'curriculum', 'reviews', 'discussion', 'faq']

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [course, setCourse] = useState(null)
  const [related, setRelated] = useState([])
  const [discussions, setDiscussions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const response = await courseAPI.getCourseById(courseId)
      setCourse(response.data.course)
      setRelated(response.data.related || [])
      setDiscussions(response.data.discussions || [])
      setLoading(false)
    }
    load()
  }, [courseId])

  const lessonCount = useMemo(() => course?.modules?.reduce((sum, module) => sum + module.lessons.length, 0) || 0, [course])

  const enroll = async () => {
    if (!auth.user) return navigate('/login')
    const response = await enrollmentAPI.enrollCourse(course.id)
    setMessage(response.data.message)
    navigate(`/player/${course.id}`)
  }

  if (loading) return <div className="h-[70vh] animate-pulse rounded-[2rem] bg-white/10" />
  if (!course) return <div className="text-white">Course not found.</div>

  return (
    <section className="space-y-8 pb-16">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-glow">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{course.category} / {course.level}</p>
            <h1 className="text-4xl font-semibold text-white">{course.title}</h1>
            <p className="max-w-2xl text-slate-300">{course.description}</p>
            <div className="flex flex-wrap gap-3">
              <Pill icon={<Star size={16} className="text-amber-300" />} text={`${course.rating} rating`} />
              <Pill icon={<BookOpen size={16} className="text-cyan-300" />} text={`${lessonCount} lessons`} />
              <Pill icon={<CheckCircle2 size={16} className="text-emerald-300" />} text={`${course.enrolled || 0} learners`} />
            </div>
            {message && <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</p>}
          </div>
          <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-5">
            <div className="aspect-video overflow-hidden rounded-[1.5rem] bg-slate-900">
              <iframe className="h-full w-full" src={course.trailer} title="Course trailer" allow="autoplay; fullscreen" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={enroll}><Play size={16} className="mr-2" /> {course.isEnrolled ? 'Continue Learning' : 'Enroll Now'}</Button>
              <Button variant="secondary"><Heart size={16} className="mr-2" /> Wishlist</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-glow">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm capitalize transition ${activeTab === tab ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-semibold text-white">Learning outcomes</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {course.outcomes.map((outcome) => <div key={outcome} className="rounded-3xl bg-slate-900/80 p-5 text-slate-300">{outcome}</div>)}
              </div>
            </div>
          )}

          {activeTab === 'curriculum' && (
            <div className="mt-8 space-y-5">
              {course.modules.map((module, moduleIndex) => (
                <div key={module.id} className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Module {moduleIndex + 1} / {module.level}</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{module.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{module.summary}</p>
                  <div className="mt-4 space-y-3">
                    {module.lessons.map((lesson, index) => (
                      <div key={lesson.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-950/80 p-4 text-slate-300">
                        <span>{index + 1}. {lesson.title}</span>
                        <span>{lesson.durationMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && <PanelList items={course.reviews.map((review) => `${review.name}: ${review.feedback}`)} />}
          {activeTab === 'discussion' && <PanelList icon={<MessageCircle size={16} />} items={discussions.map((thread) => `${thread.title}: ${thread.body}`)} />}
          {activeTab === 'faq' && <PanelList items={course.faq.map((item) => `${item.q} ${item.a}`)} />}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Instructor</p>
            <div className="mt-5 flex items-center gap-4">
              <img src={course.thumbnail} alt={course.instructor} className="h-16 w-16 rounded-2xl object-cover" />
              <div>
                <p className="font-semibold text-white">{course.instructor}</p>
                <p className="text-sm text-slate-400">{course.instructorBio}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Related courses</p>
            <div className="mt-5 space-y-3">
              {related.map((item) => (
                <button key={item.id} onClick={() => navigate(`/course/${item.id}`)} className="w-full rounded-3xl bg-white/5 p-4 text-left text-sm text-slate-300 hover:bg-white/10">
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="mt-1 block text-slate-500">{item.level}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function Pill({ icon, text }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">{icon}{text}</span>
}

function PanelList({ items, icon }) {
  return (
    <div className="mt-8 grid gap-4">
      {items.map((item) => <div key={item} className="flex gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-5 text-slate-300">{icon}{item}</div>)}
    </div>
  )
}
