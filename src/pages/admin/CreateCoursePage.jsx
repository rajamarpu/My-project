import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Button from '../../components/common/Button/Button.jsx'
import { createCourseRequest, createTaskRequest, uploadContentRequest } from '../../api/api.js'

const steps = ['Basic Info', 'Upload Thumbnail', 'Add Lessons', 'Resources', 'Quiz', 'Pricing', 'Publish']
const courseCategories = ['Development', 'Data Science', 'Artificial Intelligence', 'Design', 'Business', 'Marketing', 'Cloud Computing', 'Cybersecurity', 'Career Skills']

export default function CreateCoursePage() {
  const [activeStep, setActiveStep] = useState(1)
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth)
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    duration: '',
    price: '',
    category: '',
    level: 'Beginner',
    videoUrl: '',
    resourceUrl: '',
  })
  const [contentForm, setContentForm] = useState({
    courseId: '',
    title: '',
    type: 'video',
    videoUrl: '',
    fileName: '',
    body: '',
  })
  const [taskForm, setTaskForm] = useState({
    courseId: '',
    title: '',
    instructions: '',
    dueDate: '',
  })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const username = auth.user || 'mylogindetails'

  const updateCourse = (key, value) => setCourseForm((prev) => ({ ...prev, [key]: value }))
  const updateContent = (key, value) => setContentForm((prev) => ({ ...prev, [key]: value }))
  const updateTask = (key, value) => setTaskForm((prev) => ({ ...prev, [key]: value }))

  const saveCourse = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await createCourseRequest({ username, ...courseForm })
      setMessage(`Course saved: ${res.data.course.title} (${res.data.course.status})`)
      setCourseForm((prev) => ({ ...prev, title: '', description: '' }))
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not save course.')
    } finally {
      setBusy(false)
    }
  }

  const uploadContent = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await uploadContentRequest({ username, ...contentForm })
      setMessage(`Content uploaded: ${res.data.content.title}`)
      setContentForm((prev) => ({ ...prev, title: '', videoUrl: '', fileName: '', body: '' }))
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not upload content.')
    } finally {
      setBusy(false)
    }
  }

  const createTask = async () => {
    setBusy(true)
    setMessage('')
    try {
      const res = await createTaskRequest({ username, ...taskForm })
      setMessage(`Task created: ${res.data.task.title}`)
      setTaskForm((prev) => ({ ...prev, title: '', instructions: '', dueDate: '' }))
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not create task.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="pb-16">
      <div className="glass-card p-8 shadow-glow">
        <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Course builder</p>
        <h1 className="mt-3 text-4xl font-semibold text-[var(--text-primary)]">Create an upskilling course</h1>
        <p className="mt-4 text-[var(--text-secondary)]">A multi-step instructor workflow with drag-and-drop uploads, lesson ordering, and publishing tools.</p>
        <div className="mt-10 overflow-auto rounded-full bg-[var(--bg-subtle)] p-2">
          <div className="flex min-w-[720px] gap-3">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(index + 1)}
                className={`min-w-[120px] rounded-full px-5 py-3 text-sm transition ${activeStep === index + 1 ? 'bg-cyan-500 text-white shadow-soft' : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
        {message ? (
          <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
            {message}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <form className="theme-card space-y-5 rounded-[2rem] p-6">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Course title</label>
              <input value={courseForm.title} onChange={(e) => updateCourse('title', e.target.value)} className="mt-2 w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Cinematic brand storytelling" />
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Description</label>
              <textarea value={courseForm.description} onChange={(e) => updateCourse('description', e.target.value)} className="mt-2 h-32 w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Write a premium course summary..."></textarea>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={courseForm.duration} onChange={(e) => updateCourse('duration', e.target.value)} className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Duration" />
              <input value={courseForm.price} onChange={(e) => updateCourse('price', e.target.value)} className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Price" />
              <select value={courseForm.category} onChange={(e) => updateCourse('category', e.target.value)} className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" aria-label="Course category">
                <option value="">Select category</option>
                {courseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select value={courseForm.level} onChange={(e) => updateCourse('level', e.target.value)} className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <input value={courseForm.videoUrl} onChange={(e) => updateCourse('videoUrl', e.target.value)} className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Video URL" />
              <input value={courseForm.resourceUrl} onChange={(e) => updateCourse('resourceUrl', e.target.value)} className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Resource URL" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={saveCourse} disabled={busy}>Save draft</Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/course/c1')}>Preview</Button>
            </div>
          </form>
          <aside className="theme-card space-y-5 rounded-[2rem] p-6">
            <p className="theme-eyebrow text-sm uppercase tracking-[0.3em]">Pro tips</p>
            <ul className="space-y-3 text-[var(--text-secondary)]">
              <li>Use cinematic thumbnails and authentic mentor stories.</li>
              <li>Include AI-generated summaries for every lesson.</li>
              <li>Set milestones and live sessions for extra engagement.</li>
            </ul>
          </aside>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="theme-card space-y-4 rounded-[2rem] p-6">
            <p className="theme-eyebrow text-sm uppercase tracking-[0.25em]">Upload content</p>
            <input value={contentForm.courseId} onChange={(e) => updateContent('courseId', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Course ID (optional)" />
            <input value={contentForm.title} onChange={(e) => updateContent('title', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Content title" />
            <select value={contentForm.type} onChange={(e) => updateContent('type', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none">
              <option value="video">Video</option>
              <option value="article">Article</option>
              <option value="resource">Resource</option>
            </select>
            <input value={contentForm.videoUrl} onChange={(e) => updateContent('videoUrl', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Video URL or hosted file URL" />
            <input value={contentForm.fileName} onChange={(e) => updateContent('fileName', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="File name" />
            <textarea value={contentForm.body} onChange={(e) => updateContent('body', e.target.value)} className="h-28 w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Lesson notes or content body" />
            <Button type="button" onClick={uploadContent} disabled={busy}>Upload content</Button>
          </section>

          <section className="theme-card space-y-4 rounded-[2rem] p-6">
            <p className="theme-eyebrow text-sm uppercase tracking-[0.25em]">Create task</p>
            <input value={taskForm.courseId} onChange={(e) => updateTask('courseId', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Course ID (optional)" />
            <input value={taskForm.title} onChange={(e) => updateTask('title', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Task title" />
            <input type="date" value={taskForm.dueDate} onChange={(e) => updateTask('dueDate', e.target.value)} className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" aria-label="Task due date" />
            <textarea value={taskForm.instructions} onChange={(e) => updateTask('instructions', e.target.value)} className="h-40 w-full rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-[var(--text-primary)] outline-none" placeholder="Task instructions for learners" />
            <Button type="button" onClick={createTask} disabled={busy}>Create task</Button>
          </section>
        </div>
      </div>
    </section>
  )
}



