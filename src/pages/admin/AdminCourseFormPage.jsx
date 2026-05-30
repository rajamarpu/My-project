import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createCourseRequest, fetchAdminCourses, updateAdminCourse, uploadAdminCourseAsset } from '../../api/api.js'
import { AdminLoadingState, AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'
import { formatRupeesFromPaise } from '../../utils/money.js'

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024
const MAX_COURSE_FILE_SIZE = 60 * 1024 * 1024
const COURSE_ASSET_ACCEPT = [
  'video/*',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/*',
  'text/plain',
  'text/csv',
  '.zip',
].join(',')

const ASSESSMENT_QUESTION_TYPES = [
  { value: 'MCQ_SINGLE', label: 'MCQ - Single correct option' },
  { value: 'MCQ_MULTIPLE', label: 'MCQ - Multiple correct answers' },
  { value: 'FILL_BLANK', label: 'Fill in the blank' },
  { value: 'DESCRIPTIVE', label: 'Descriptive answer' },
]
const OPTION_BASED_TYPES = ['MCQ_SINGLE', 'MCQ_MULTIPLE']
const MAX_ASSESSMENT_OPTIONS = 5

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createAssessmentQuestion(type = 'MCQ_SINGLE') {
  return {
    id: makeId('q'),
    type,
    text: '',
    options: OPTION_BASED_TYPES.includes(type)
      ? [
          { id: makeId('o'), text: '' },
          { id: makeId('o'), text: '' },
        ]
      : [],
    correctAnswers: [],
    correctAnswer: '',
  }
}

function createAssessmentDraft() {
  return { title: '', prompt: '', durationMin: 0, questionsText: '', questions: [createAssessmentQuestion()], resources: [] }
}

const initialForm = {
  title: '',
  description: '',
  category: '',
  level: 'BEGINNER',
  priceCents: 0,
  thumbnailUrl: '',
  videoPreviewUrl: '',
  isPublished: true,
  lessons: [
    { title: '', description: '', type: 'ARTICLE', durationMin: 0, videoUrl: '', resources: [] },
  ],
  assessments: [
    createAssessmentDraft(),
  ],
}

export default function AdminCourseFormPage({ mode = 'create' }) {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [uploadingKey, setUploadingKey] = useState('')

  useEffect(() => {
    if (mode !== 'edit' || !courseId) return
    async function loadCourse() {
      try {
        setLoading(true)
        const response = await fetchAdminCourses()
        const course = response.data.courses.find((item) => item.id === courseId)
        if (!course) throw new Error('Course not found.')
        setForm({
          title: course.title || '',
          description: course.description || '',
          category: course.category || '',
          level: course.level || 'BEGINNER',
          priceCents: course.priceCents || 0,
          thumbnailUrl: course.thumbnailUrl || '',
          videoPreviewUrl: course.videoPreviewUrl || '',
          isPublished: Boolean(course.isPublished),
          lessons: normalizeLessons(course.lessons),
          assessments: normalizeAssessments(course.lessons),
        })
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load course.')
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [courseId, mode])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const updateLesson = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, lessonIndex) => (
        lessonIndex === index ? { ...lesson, [key]: value } : lesson
      )),
    }))
  }

  const addLesson = () => {
    setForm((prev) => ({
      ...prev,
      lessons: [...prev.lessons, { title: '', description: '', type: 'ARTICLE', durationMin: 0, videoUrl: '', resources: [] }],
    }))
  }

  const removeLesson = (index) => {
    setForm((prev) => ({
      ...prev,
      lessons: prev.lessons.length > 1 ? prev.lessons.filter((_, lessonIndex) => lessonIndex !== index) : prev.lessons,
    }))
  }

  const updateAssessment = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, assessmentIndex) => (
        assessmentIndex === index ? { ...assessment, [key]: value } : assessment
      )),
    }))
  }

  const addAssessment = () => {
    setForm((prev) => ({
      ...prev,
      assessments: [...prev.assessments, createAssessmentDraft()],
    }))
  }

  const removeAssessment = (index) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.length > 1 ? prev.assessments.filter((_, assessmentIndex) => assessmentIndex !== index) : prev.assessments,
    }))
  }

  const updateAssessmentQuestion = (assessmentIndex, questionIndex, updates) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => {
        if (currentAssessmentIndex !== assessmentIndex) return assessment
        return {
          ...assessment,
          questions: (assessment.questions || []).map((question, currentQuestionIndex) => (
            currentQuestionIndex === questionIndex ? { ...question, ...updates } : question
          )),
        }
      }),
    }))
  }

  const changeAssessmentQuestionType = (assessmentIndex, questionIndex, type) => {
    updateAssessmentQuestion(assessmentIndex, questionIndex, createAssessmentQuestion(type))
  }

  const addAssessmentQuestion = (assessmentIndex) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => (
        currentAssessmentIndex === assessmentIndex
          ? { ...assessment, questions: [...(assessment.questions || []), createAssessmentQuestion()] }
          : assessment
      )),
    }))
  }

  const removeAssessmentQuestion = (assessmentIndex, questionIndex) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => {
        if (currentAssessmentIndex !== assessmentIndex) return assessment
        const questions = assessment.questions || []
        return {
          ...assessment,
          questions: questions.length > 1 ? questions.filter((_, index) => index !== questionIndex) : questions,
        }
      }),
    }))
  }

  const addAssessmentOption = (assessmentIndex, questionIndex) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => {
        if (currentAssessmentIndex !== assessmentIndex) return assessment
        return {
          ...assessment,
          questions: (assessment.questions || []).map((question, currentQuestionIndex) => {
            if (currentQuestionIndex !== questionIndex) return question
            const options = question.options || []
            if (options.length >= MAX_ASSESSMENT_OPTIONS) return question
            return { ...question, options: [...options, { id: makeId('o'), text: '' }] }
          }),
        }
      }),
    }))
  }

  const updateAssessmentOption = (assessmentIndex, questionIndex, optionIndex, value) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => {
        if (currentAssessmentIndex !== assessmentIndex) return assessment
        return {
          ...assessment,
          questions: (assessment.questions || []).map((question, currentQuestionIndex) => (
            currentQuestionIndex === questionIndex
              ? {
                  ...question,
                  options: (question.options || []).map((option, currentOptionIndex) => (
                    currentOptionIndex === optionIndex ? { ...option, text: value } : option
                  )),
                }
              : question
          )),
        }
      }),
    }))
  }

  const removeAssessmentOption = (assessmentIndex, questionIndex, optionIndex) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => {
        if (currentAssessmentIndex !== assessmentIndex) return assessment
        return {
          ...assessment,
          questions: (assessment.questions || []).map((question, currentQuestionIndex) => {
            if (currentQuestionIndex !== questionIndex) return question
            const removedOption = question.options?.[optionIndex]
            const options = (question.options || []).filter((_, index) => index !== optionIndex)
            return {
              ...question,
              options,
              correctAnswers: (question.correctAnswers || []).filter((id) => id !== removedOption?.id),
            }
          }),
        }
      }),
    }))
  }

  const toggleCorrectAnswer = (assessmentIndex, questionIndex, optionId, multiple) => {
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, currentAssessmentIndex) => {
        if (currentAssessmentIndex !== assessmentIndex) return assessment
        return {
          ...assessment,
          questions: (assessment.questions || []).map((question, currentQuestionIndex) => {
            if (currentQuestionIndex !== questionIndex) return question
            if (!multiple) return { ...question, correctAnswers: [optionId] }
            const answers = question.correctAnswers || []
            return {
              ...question,
              correctAnswers: answers.includes(optionId) ? answers.filter((id) => id !== optionId) : [...answers, optionId],
            }
          }),
        }
      }),
    }))
  }

  async function uploadCourseFile(file, { section, index }) {
    if (!file) return
    if (file.size > MAX_COURSE_FILE_SIZE) {
      setError('Course files must be 60 MB or smaller.')
      return
    }

    const key = `${section}:${index}`
    try {
      setUploadingKey(key)
      setError('')
      const dataUrl = await readFileAsDataUrl(file)
      const response = await uploadAdminCourseAsset({ fileName: file.name, mimeType: file.type, dataUrl })
      const asset = response.data.asset
      if (section === 'lesson') {
        setForm((prev) => ({
          ...prev,
          lessons: prev.lessons.map((lesson, lessonIndex) => {
            if (lessonIndex !== index) return lesson
            const resources = [...(lesson.resources || []), asset]
            return {
              ...lesson,
              resources,
              type: file.type.startsWith('video/') ? 'VIDEO' : lesson.type,
              videoUrl: file.type.startsWith('video/') ? asset.url : lesson.videoUrl,
            }
          }),
        }))
      } else {
        setForm((prev) => ({
          ...prev,
          assessments: prev.assessments.map((assessment, assessmentIndex) => (
            assessmentIndex === index
              ? { ...assessment, resources: [...(assessment.resources || []), asset] }
              : assessment
          )),
        }))
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not upload the selected file.')
    } finally {
      setUploadingKey('')
    }
  }

  function removeResource({ section, index, resourceIndex }) {
    if (section === 'lesson') {
      setForm((prev) => ({
        ...prev,
        lessons: prev.lessons.map((lesson, lessonIndex) => (
          lessonIndex === index
            ? { ...lesson, resources: (lesson.resources || []).filter((_, itemIndex) => itemIndex !== resourceIndex) }
            : lesson
        )),
      }))
      return
    }
    setForm((prev) => ({
      ...prev,
      assessments: prev.assessments.map((assessment, assessmentIndex) => (
        assessmentIndex === index
          ? { ...assessment, resources: (assessment.resources || []).filter((_, itemIndex) => itemIndex !== resourceIndex) }
          : assessment
      )),
    }))
  }

  function chooseThumbnail(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file for the course thumbnail.')
      event.target.value = ''
      return
    }
    if (file.size > MAX_THUMBNAIL_SIZE) {
      setError('Thumbnail image must be smaller than 2 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      update('thumbnailUrl', String(reader.result || ''))
      setError('')
    }
    reader.onerror = () => setError('Could not read the selected thumbnail image.')
    reader.readAsDataURL(file)
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Course title is required.'
    if (!form.description.trim()) nextErrors.description = 'Course description is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required.'
    if (Number(form.priceCents || 0) < 0) nextErrors.priceCents = 'Price cannot be negative.'
    const lessons = form.lessons
      .map((lesson) => ({
        ...lesson,
        title: lesson.title.trim(),
        description: lesson.description.trim(),
        videoUrl: lesson.videoUrl.trim(),
        durationMin: Number(lesson.durationMin || 0),
        quizJson: { resources: lesson.resources || [] },
      }))
      .filter((lesson) => lesson.title || lesson.description || lesson.videoUrl || lesson.resources?.length)
    lessons.forEach((lesson, index) => {
      if (!lesson.title) nextErrors[`lesson-${index}-title`] = 'Lesson title is required when adding lesson content.'
      if (lesson.durationMin < 0) nextErrors[`lesson-${index}-duration`] = 'Duration cannot be negative.'
    })
    const assessments = form.assessments
      .map((assessment) => ({
        ...assessment,
        title: assessment.title.trim(),
        prompt: assessment.prompt.trim(),
        questionsText: assessment.questionsText.trim(),
        questions: normalizeAssessmentQuestions(assessment.questions || []).filter(questionHasContent),
        durationMin: Number(assessment.durationMin || 0),
      }))
      .filter((assessment) => assessment.title || assessment.prompt || assessment.questionsText || assessment.questions?.length || assessment.resources?.length)
    assessments.forEach((assessment, index) => {
      if (!assessment.title) nextErrors[`assessment-${index}-title`] = 'Assessment title is required.'
      if (!assessment.prompt) nextErrors[`assessment-${index}-prompt`] = 'Assessment prompt is required.'
      if (assessment.durationMin < 0) nextErrors[`assessment-${index}-duration`] = 'Duration cannot be negative.'
      assessment.questions.forEach((question, questionIndex) => {
        const key = `assessment-${index}-question-${questionIndex}`
        if (!question.text) nextErrors[`${key}-text`] = 'Question text is required.'
        if (OPTION_BASED_TYPES.includes(question.type)) {
          if (question.options.length < 2) nextErrors[`${key}-options`] = 'Add at least 2 options.'
          if (question.options.length > MAX_ASSESSMENT_OPTIONS) nextErrors[`${key}-options`] = 'You can add up to 5 options.'
          question.options.forEach((option, optionIndex) => {
            if (!option.text) nextErrors[`${key}-option-${optionIndex}`] = 'Option text is required.'
          })
          if (question.type === 'MCQ_SINGLE' && question.correctAnswers.length !== 1) {
            nextErrors[`${key}-answer`] = 'Select one correct option.'
          }
          if (question.type === 'MCQ_MULTIPLE' && !question.correctAnswers.length) {
            nextErrors[`${key}-answer`] = 'Select at least one correct option.'
          }
        }
        if (question.type === 'FILL_BLANK' && !question.correctAnswer) {
          nextErrors[`${key}-answer`] = 'Correct answer is required.'
        }
      })
    })
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setError('Please fix the highlighted fields before saving.')
      return
    }
    try {
      setSaving(true)
      const assessmentLessons = assessments.map((assessment) => ({
        title: assessment.title,
        description: assessment.prompt,
        type: 'QUIZ',
        durationMin: assessment.durationMin,
        videoUrl: '',
        quizJson: {
          kind: 'assessment',
          prompt: assessment.prompt,
          questionsText: assessment.questionsText,
          questions: assessment.questions,
          resources: assessment.resources || [],
        },
      }))
      const payload = { ...form, lessons: [...lessons, ...assessmentLessons], priceCents: Number(form.priceCents || 0) }
      if (mode === 'edit') await updateAdminCourse(courseId, payload)
      else await createCourseRequest(payload)
      setSuccess('Course saved successfully.')
      navigate('/admin/courses')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Course save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-6 pb-16">
      <AdminPageHeader eyebrow="Course catalog" title={mode === 'edit' ? 'Edit course' : 'Upload course'} description="Save course details, publication state, preview media, and catalog metadata." />

      <form onSubmit={submit} className="admin-panel p-5 sm:p-6">
        {loading ? <AdminLoadingState label="Loading course..." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Title" value={form.title} error={fieldErrors.title} onChange={(value) => update('title', value)} />
            <Field label="Category" value={form.category} error={fieldErrors.category} onChange={(value) => update('category', value)} />
            <label className="admin-label">
              Level
              <select value={form.level} onChange={(event) => update('level', event.target.value)} className="admin-input">
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </label>
            <Field
              label="Price in rupees"
              type="number"
              step="0.01"
              value={Number(form.priceCents || 0) / 100}
              error={fieldErrors.priceCents}
              helper={`Learners will see ${formatRupeesFromPaise(form.priceCents)}. Stored as ${Number(form.priceCents || 0)} paise.`}
              onChange={(value) => update('priceCents', Math.round(Number(value || 0) * 100))}
            />
            <label className="admin-label">
              Thumbnail image
              <input
                type="file"
                accept="image/*"
                onChange={chooseThumbnail}
                className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
              />
              <span className="text-xs text-[var(--text-muted)]">Choose a 1200 x 360 course thumbnail from your computer. Maximum file size: 2 MB.</span>
            </label>
            <Field label="Preview video URL" value={form.videoPreviewUrl} onChange={(value) => update('videoPreviewUrl', value)} />
            {form.thumbnailUrl ? (
              <div className="lg:col-span-2">
                <p className="mb-2 text-sm text-[var(--text-secondary)]">Thumbnail preview</p>
                <img src={form.thumbnailUrl} alt="Course thumbnail preview" className="h-48 w-full rounded-lg border border-[var(--border-color)] object-cover" />
              </div>
            ) : null}
            <label className="admin-label lg:col-span-2">
              Description
              <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={5} className="admin-input" />
              <FieldError>{fieldErrors.description}</FieldError>
            </label>
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Course lessons and content</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Add lesson titles, upload videos/PDFs/PPTs, paste notes, and attach hosted links.</p>
                </div>
                <Button type="button" variant="secondary" onClick={addLesson}>Add Lesson</Button>
              </div>
              <div className="mt-4 grid gap-4">
                {form.lessons.map((lesson, index) => (
                  <div key={index} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Lesson {index + 1}</p>
                      <Button type="button" variant="secondary" onClick={() => removeLesson(index)} disabled={form.lessons.length === 1}>Remove</Button>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <Field
                        label="Lesson title"
                        value={lesson.title}
                        error={fieldErrors[`lesson-${index}-title`]}
                        onChange={(value) => updateLesson(index, 'title', value)}
                      />
                      <label className="admin-label">
                        Lesson type
                        <select value={lesson.type} onChange={(event) => updateLesson(index, 'type', event.target.value)} className="admin-input">
                          <option value="ARTICLE">Article</option>
                          <option value="VIDEO">Video</option>
                        </select>
                      </label>
                      <Field
                        label="Duration in minutes"
                        type="number"
                        value={lesson.durationMin}
                        error={fieldErrors[`lesson-${index}-duration`]}
                        onChange={(value) => updateLesson(index, 'durationMin', value)}
                      />
                      <Field label="Video URL" value={lesson.videoUrl} onChange={(value) => updateLesson(index, 'videoUrl', value)} />
                      <label className="admin-label lg:col-span-2">
                        Upload lesson file
                        <input
                          type="file"
                          accept={COURSE_ASSET_ACCEPT}
                          onChange={(event) => {
                            void uploadCourseFile(event.target.files?.[0], { section: 'lesson', index })
                            event.target.value = ''
                          }}
                          className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
                        />
                        <span className="text-xs text-[var(--text-muted)]">
                          Supports video, PDF, PPT/PPTX, Word, images, text, CSV, and ZIP files up to 60 MB.
                          {uploadingKey === `lesson:${index}` ? ' Uploading...' : ''}
                        </span>
                      </label>
                      <ResourceList resources={lesson.resources || []} onRemove={(resourceIndex) => removeResource({ section: 'lesson', index, resourceIndex })} />
                      <label className="admin-label lg:col-span-2">
                        Lesson content
                        <textarea
                          value={lesson.description}
                          onChange={(event) => updateLesson(index, 'description', event.target.value)}
                          rows={6}
                          className="admin-input"
                          placeholder="Paste your lesson content, notes, instructions, resources, or quiz prompt here."
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Assessments and quizzes</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Create assessments separately from lesson content. These save as quiz modules in the course.</p>
                </div>
                <Button type="button" variant="secondary" onClick={addAssessment}>Create Assessment</Button>
              </div>
              <div className="mt-4 grid gap-4">
                {form.assessments.map((assessment, index) => (
                  <div key={index} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Assessment {index + 1}</p>
                      <Button type="button" variant="secondary" onClick={() => removeAssessment(index)} disabled={form.assessments.length === 1}>Remove</Button>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <Field
                        label="Assessment title"
                        value={assessment.title}
                        error={fieldErrors[`assessment-${index}-title`]}
                        onChange={(value) => updateAssessment(index, 'title', value)}
                      />
                      <Field
                        label="Duration in minutes"
                        type="number"
                        value={assessment.durationMin}
                        error={fieldErrors[`assessment-${index}-duration`]}
                        onChange={(value) => updateAssessment(index, 'durationMin', value)}
                      />
                      <label className="admin-label lg:col-span-2">
                        Prompt / instructions
                        <textarea
                          value={assessment.prompt}
                          onChange={(event) => updateAssessment(index, 'prompt', event.target.value)}
                          rows={4}
                          className="admin-input"
                          placeholder="Describe what the learner should submit or answer."
                        />
                        <FieldError>{fieldErrors[`assessment-${index}-prompt`]}</FieldError>
                      </label>
                      <label className="admin-label lg:col-span-2">
                        Rubric / extra instructions
                        <textarea
                          value={assessment.questionsText}
                          onChange={(event) => updateAssessment(index, 'questionsText', event.target.value)}
                          rows={3}
                          className="admin-input"
                          placeholder="Optional marking rubric, answer format, or extra instructions."
                        />
                      </label>
                      <div className="lg:col-span-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">Assessment questions</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Choose MCQ or descriptive. MCQ supports single answer, multiple answer, and fill in the blank.</p>
                          </div>
                          <Button type="button" variant="secondary" onClick={() => addAssessmentQuestion(index)}>Add Question</Button>
                        </div>
                        <div className="mt-4 grid gap-4">
                          {(assessment.questions || []).map((question, questionIndex) => {
                            const questionKey = `assessment-${index}-question-${questionIndex}`
                            const isOptionBased = OPTION_BASED_TYPES.includes(question.type)
                            const isMultiple = question.type === 'MCQ_MULTIPLE'
                            return (
                              <div key={question.id || questionIndex} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-subtle)] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-[var(--text-primary)]">Question {questionIndex + 1}</p>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => removeAssessmentQuestion(index, questionIndex)}
                                    disabled={(assessment.questions || []).length === 1}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                  <label className="admin-label">
                                    Question type
                                    <select
                                      value={question.type}
                                      onChange={(event) => changeAssessmentQuestionType(index, questionIndex, event.target.value)}
                                      className="admin-input"
                                    >
                                      {ASSESSMENT_QUESTION_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                      ))}
                                    </select>
                                  </label>
                                  {question.type === 'FILL_BLANK' ? (
                                    <Field
                                      label="Correct answer"
                                      value={question.correctAnswer || ''}
                                      error={fieldErrors[`${questionKey}-answer`]}
                                      onChange={(value) => updateAssessmentQuestion(index, questionIndex, { correctAnswer: value })}
                                    />
                                  ) : null}
                                  <label className="admin-label lg:col-span-2">
                                    Question text
                                    <textarea
                                      value={question.text || ''}
                                      onChange={(event) => updateAssessmentQuestion(index, questionIndex, { text: event.target.value })}
                                      rows={3}
                                      className="admin-input"
                                      placeholder={question.type === 'FILL_BLANK' ? 'Example: React is a ____ library.' : 'Write the question learners will answer.'}
                                    />
                                    <FieldError>{fieldErrors[`${questionKey}-text`]}</FieldError>
                                  </label>
                                  {isOptionBased ? (
                                    <div className="lg:col-span-2 space-y-3">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                          Options ({(question.options || []).length}/{MAX_ASSESSMENT_OPTIONS})
                                        </p>
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          onClick={() => addAssessmentOption(index, questionIndex)}
                                          disabled={(question.options || []).length >= MAX_ASSESSMENT_OPTIONS}
                                        >
                                          Add Option
                                        </Button>
                                      </div>
                                      {(question.options || []).map((option, optionIndex) => (
                                        <div key={option.id || optionIndex} className="grid gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 md:grid-cols-[auto_1fr_auto] md:items-start">
                                          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                                            <input
                                              type={isMultiple ? 'checkbox' : 'radio'}
                                              name={`correct-${index}-${questionIndex}`}
                                              checked={(question.correctAnswers || []).includes(option.id)}
                                              onChange={() => toggleCorrectAnswer(index, questionIndex, option.id, isMultiple)}
                                              className="h-4 w-4 accent-indigo-500"
                                            />
                                            Correct
                                          </label>
                                          <label className="admin-label">
                                            Option {optionIndex + 1}
                                            <input
                                              value={option.text || ''}
                                              onChange={(event) => updateAssessmentOption(index, questionIndex, optionIndex, event.target.value)}
                                              className="admin-input"
                                              placeholder="Option text"
                                            />
                                            <FieldError>{fieldErrors[`${questionKey}-option-${optionIndex}`]}</FieldError>
                                          </label>
                                          <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => removeAssessmentOption(index, questionIndex, optionIndex)}
                                            disabled={(question.options || []).length <= 2}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ))}
                                      <FieldError>{fieldErrors[`${questionKey}-options`] || fieldErrors[`${questionKey}-answer`]}</FieldError>
                                    </div>
                                  ) : null}
                                  {question.type === 'DESCRIPTIVE' ? (
                                    <div className="lg:col-span-2 rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-4 text-sm text-indigo-900 dark:text-indigo-100">
                                      Learners will see a large text box for a multi-line written answer.
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <label className="admin-label lg:col-span-2">
                        Upload assessment file
                        <input
                          type="file"
                          accept={COURSE_ASSET_ACCEPT}
                          onChange={(event) => {
                            void uploadCourseFile(event.target.files?.[0], { section: 'assessment', index })
                            event.target.value = ''
                          }}
                          className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
                        />
                        <span className="text-xs text-[var(--text-muted)]">
                          Attach question papers, PDFs, PPTs, datasets, or reference files.
                          {uploadingKey === `assessment:${index}` ? ' Uploading...' : ''}
                        </span>
                      </label>
                      <ResourceList resources={assessment.resources || []} onRemove={(resourceIndex) => removeResource({ section: 'assessment', index, resourceIndex })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {mode === 'create' ? (
              <div className="rounded-lg border border-cyan-300/25 bg-cyan-400/10 p-4 text-sm text-cyan-800 dark:text-cyan-100">
                A celebrity instructor will be assigned automatically at random when this course is saved.
              </div>
            ) : null}
            <label className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
              Published
            </label>
          </div>
        )}

        <AdminNotice type="error">{error}</AdminNotice>
        <AdminNotice type="success">{success}</AdminNotice>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Course'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button>
        </div>
      </form>
    </section>
  )
}

function normalizeLessons(lessons = []) {
  const normalized = lessons.filter((lesson) => lesson.quizJson?.kind !== 'assessment').map((lesson) => ({
    title: lesson.title || '',
    description: lesson.description || '',
    type: lesson.type || 'ARTICLE',
    durationMin: lesson.durationMin || 0,
    videoUrl: lesson.videoUrl || '',
    resources: lesson.quizJson?.resources || [],
  }))
  return normalized.length ? normalized : initialForm.lessons
}

function normalizeAssessments(lessons = []) {
  const normalized = lessons.filter((lesson) => lesson.quizJson?.kind === 'assessment').map((lesson) => ({
    title: lesson.title || '',
    prompt: lesson.quizJson?.prompt || lesson.description || '',
    durationMin: lesson.durationMin || 0,
    questionsText: lesson.quizJson?.questionsText || '',
    questions: normalizeAssessmentQuestions(lesson.quizJson?.questions || []),
    resources: lesson.quizJson?.resources || [],
  }))
  return normalized.length ? normalized : initialForm.assessments
}

function normalizeAssessmentQuestions(questions = []) {
  const normalized = questions.map((question) => {
    const type = question.type || 'MCQ_SINGLE'
    const options = OPTION_BASED_TYPES.includes(type)
      ? (question.options || []).slice(0, MAX_ASSESSMENT_OPTIONS).map((option) => ({
          id: option.id || makeId('o'),
          text: String(option.text || '').trim(),
        }))
      : []
    return {
      id: question.id || makeId('q'),
      type,
      text: String(question.text || '').trim(),
      options,
      correctAnswers: OPTION_BASED_TYPES.includes(type)
        ? (question.correctAnswers || []).filter((id) => options.some((option) => option.id === id))
        : [],
      correctAnswer: type === 'FILL_BLANK' ? String(question.correctAnswer || '').trim() : '',
    }
  })
  return normalized.length ? normalized : [createAssessmentQuestion()]
}

function questionHasContent(question) {
  return Boolean(
    question.text
    || question.correctAnswer
    || question.correctAnswers?.length
    || question.options?.some((option) => option.text)
  )
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.readAsDataURL(file)
  })
}

function ResourceList({ resources, onRemove }) {
  if (!resources.length) return null
  return (
    <div className="lg:col-span-2 rounded-lg border border-[var(--border-color)] bg-white/70 p-3 dark:bg-slate-950/30">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Uploaded files</p>
      <div className="mt-3 grid gap-2">
        {resources.map((resource, index) => (
          <div key={`${resource.url}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm">
            <a href={resource.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-medium text-cyan-700 hover:underline dark:text-cyan-200">
              {resource.name || resource.url}
            </a>
            <span className="text-xs text-[var(--text-muted)]">{resource.mimeType || 'file'}</span>
            <button type="button" onClick={() => onRemove(index)} className="rounded-lg border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-200">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', error, helper, step }) {
  return (
    <label className="admin-label">
      {label}
      <input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="admin-input" aria-invalid={Boolean(error)} />
      {helper ? <span className="text-xs text-[var(--text-muted)]">{helper}</span> : null}
      <FieldError>{error}</FieldError>
    </label>
  )
}
