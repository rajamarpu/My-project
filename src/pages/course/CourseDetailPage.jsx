import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { celebrityCourses } from '../../data/dummyData.js'
import Button from '../../components/ui/Button.jsx'
import { Star, Heart } from 'lucide-react'

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const course = useMemo(() => celebrityCourses.find((item) => item.id === courseId) || celebrityCourses[0], [courseId])
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <section className="space-y-10 pb-16">
      <div className="glass-card overflow-hidden border-white/10 p-8 shadow-glow">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Course detail</p>
            <h1 className="text-4xl font-semibold text-white">{course.title}</h1>
            <p className="max-w-2xl text-slate-300">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                <Star size={16} className="text-amber-300" /> {course.rating}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                {course.duration}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100">
                {course.badge}
              </span>
            </div>
          </div>
          <div className="space-y-4 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <div className="aspect-[16/9] overflow-hidden rounded-3xl bg-slate-900">
              <iframe
                className="h-full w-full"
                src={course.trailer}
                title="Course trailer"
                allow="autoplay; fullscreen"
              />
            </div>
            <div className="grid gap-3">
              <Button onClick={() => navigate('/login')}>Enroll Now</Button>
              <Button variant="secondary">
                <Heart size={16} className="mr-2" /> Add Wishlist
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <div className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-glow">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            {['Overview', 'Lessons', 'Reviews', 'Discussion'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`rounded-full px-4 py-2 transition ${activeTab === tab.toLowerCase() ? 'bg-cyan-500 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-5 text-slate-300">
              <h2 className="text-2xl font-semibold text-white">What you will learn</h2>
              <p>{course.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-900/80 p-5">Premium cinematic lessons with celebrity production value.</div>
                <div className="rounded-3xl bg-slate-900/80 p-5">AI-generated summaries, quizzes, and resource bundles.</div>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Curriculum</h2>
              <div className="space-y-3">
                {course.curriculum.map((lesson) => (
                  <div key={lesson.title} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between gap-3 text-slate-300">
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
              <h2 className="text-2xl font-semibold text-white">Student reviews</h2>
              <div className="grid gap-4">
                {course.reviews.map((review) => (
                  <div key={review.name} className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                    <p className="font-semibold text-white">{review.name}</p>
                    <p className="mt-2 text-slate-300">"{review.feedback}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-300">
              <p className="text-lg font-semibold text-white">Course community</p>
              <p className="mt-3">Join the celebrity discussion board, ask questions, and follow mentor updates.</p>
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
          <div className="rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Instructor</p>
            <div className="mt-4 flex items-center gap-4">
              <img src={course.image} alt={course.instructor} className="h-16 w-16 rounded-2xl object-cover" />
              <div>
                <p className="font-semibold text-white">{course.instructor}</p>
                <p className="text-sm text-slate-400">Celebrity mentor & industry leader</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
