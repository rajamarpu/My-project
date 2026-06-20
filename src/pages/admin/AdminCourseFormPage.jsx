import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/Button/Button.jsx'
import { createCourseRequest, fetchAdminCourses, fetchAdminInstructors, fetchAiContentOptions, generateAiLessonVideo, updateAdminCourse, uploadAdminCourseAsset } from '../../api/api.js'
import { AdminLoadingState, AdminNotice, AdminPageHeader, FieldError } from '../../components/admin/AdminUI.jsx'
import { formatRupeesFromPaise } from '../../utils/money.js'

const MAX_THUMBNAIL_SIZE = 2 * 1024 * 1024
const MAX_COURSE_FILE_SIZE = 60 * 1024 * 1024
const COURSE_CATEGORY_OPTIONS = ['Development', 'Data Science', 'Artificial Intelligence', 'Design', 'Business', 'Marketing', 'Cloud Computing', 'Cybersecurity', 'Career Skills']
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
const LESSON_KIND_OPTIONS = [
  { value: 'UPLOADED_VIDEO', label: 'Uploaded Video' },
  { value: 'AI_AVATAR_VIDEO', label: 'AI Narrated Video' },
  { value: 'EXTERNAL_URL', label: 'External Course URL' },
  { value: 'PDF_RESOURCE', label: 'PDF Resource' },
  { value: 'DOWNLOADABLE_MATERIAL', label: 'Downloadable Material' },
]

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
    modelAnswer: '',
    evaluationNotes: '',
    marks: 1,
  }
}

function createAssessmentDraft() {
  return { title: '', prompt: '', durationMin: 0, questionsText: '', questions: [createAssessmentQuestion()], resources: [] }
}

function createLessonDraft(moduleTitle = 'Module 1') {
  return {
    moduleTitle,
    title: '',
    description: '',
    type: 'VIDEO',
    lessonKind: 'UPLOADED_VIDEO',
    durationMin: 8,
    videoUrl: '',
    courseUrl: '',
    thumbnailUrl: '',
    resources: [],
    learningOutcomes: '',
    captionsUrl: '',
    sourceVideoDurationSeconds: 0,
    preview: false,
    aiScript: '',
    aiAvatarId: '',
    aiVoiceId: '',
    aiSlideUrl: '',
    aiImageUrl: '',
    aiVoiceSampleUrl: '',
    aiPdfUrl: '',
    aiInstructorVideos: [],
    aiGenerationStatus: '',
  }
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
  lessons: [createLessonDraft()],
  assessments: [
    createAssessmentDraft(),
  ],
}

export default function AdminCourseFormPage({ mode = 'create' }) {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const draftKey = 'uptoskills-admin-course-draft'
  const [form, setForm] = useState(() => {
    if (mode !== 'create') return initialForm
    try { return { ...initialForm, ...JSON.parse(window.localStorage.getItem(draftKey) || '{}') } } catch { return initialForm }
  })
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(initialForm))
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [uploadingKey, setUploadingKey] = useState('')
  const [aiOptions, setAiOptions] = useState({ avatars: [], voices: [] })
  const [adminInstructors, setAdminInstructors] = useState([])
  const [generatingLessonIndex, setGeneratingLessonIndex] = useState(null)

  useEffect(() => {
    if (mode !== 'edit' || !courseId) return
    async function loadCourse() {
      try {
        setLoading(true)
        const response = await fetchAdminCourses()
        const course = response.data.courses.find((item) => item.id === courseId)
        if (!course) throw new Error('Course not found.')
        const loadedForm = {
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
        }
        setForm(loadedForm)
        setSavedSnapshot(JSON.stringify(loadedForm))
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load course.')
      } finally {
        setLoading(false)
      }
    }
    void loadCourse()
  }, [courseId, mode])

  const dirty = JSON.stringify(form) !== savedSnapshot
  useEffect(() => {
    if (mode !== 'create' || !dirty) return undefined
    const timer = window.setTimeout(() => window.localStorage.setItem(draftKey, JSON.stringify(form)), 600)
    return () => window.clearTimeout(timer)
  }, [dirty, form, mode])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    async function loadAiOptions() {
      try {
        const [optionsResponse, instructorsResponse] = await Promise.all([
          fetchAiContentOptions(),
          fetchAdminInstructors().catch(() => ({ data: { instructors: [] } })),
        ])
        setAiOptions({ avatars: optionsResponse.data.avatars || [], voices: optionsResponse.data.voices || [] })
        setAdminInstructors(instructorsResponse.data.instructors || [])
      } catch {
        setAiOptions({ avatars: [], voices: [] })
        setAdminInstructors([])
      }
    }
    void loadAiOptions()
  }, [])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const updateLesson = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      lessons: prev.lessons.map((lesson, lessonIndex) => (
        lessonIndex === index ? normalizeLessonUpdate(lesson, key, value) : lesson
      )),
    }))
  }

  const addLesson = () => {
    setForm((prev) => ({
      ...prev,
      lessons: [...prev.lessons, createLessonDraft(prev.lessons.at(-1)?.moduleTitle || `Module ${new Set(prev.lessons.map((lesson) => lesson.moduleTitle)).size + 1}`)],
    }))
  }

  const removeLesson = (index) => {
    setForm((prev) => ({
      ...prev,
      lessons: prev.lessons.length > 1 ? prev.lessons.filter((_, lessonIndex) => lessonIndex !== index) : prev.lessons,
    }))
  }

  const moveLesson = (index, direction) => {
    setForm((prev) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.lessons.length) return prev
      const lessons = [...prev.lessons]
      const [lesson] = lessons.splice(index, 1)
      lessons.splice(nextIndex, 0, lesson)
      return { ...prev, lessons }
    })
  }

  async function generateAiLesson(index) {
    const lesson = form.lessons[index]
    const fallbackAvatarId = lesson.aiAvatarId || aiOptions.avatars[0]?.id || 'custom-consented-avatar'
    const fallbackVoiceId = lesson.aiVoiceId || aiOptions.voices[0]?.id || 'en-in-clear-male'
    const targetInstructors = adminInstructors.length ? adminInstructors : []
    if (!lesson?.title || !lesson.videoUrl || !lesson.aiScript || !fallbackAvatarId || !fallbackVoiceId) {
      setError('AI narration lessons require a title, uploaded/source video, subtitle/script text, and an authorized voice model.')
      return
    }
    try {
      setGeneratingLessonIndex(index)
      setError('')
      const basePayload = {
        title: lesson.title,
        script: lesson.aiScript,
        avatarId: fallbackAvatarId,
        voiceId: fallbackVoiceId,
        slideUrl: lesson.aiSlideUrl,
        voiceSampleUrl: lesson.aiVoiceSampleUrl,
        pdfUrl: lesson.aiPdfUrl,
        captionsUrl: lesson.captionsUrl,
        captions: true,
        branding: true,
        sourceVideoUrl: lesson.videoUrl,
        targetDurationSeconds: Number(lesson.sourceVideoDurationSeconds || lesson.durationMin * 60 || 0),
      }
      const generationTargets = targetInstructors.length
        ? targetInstructors.map((instructor) => ({
            instructorId: String(instructor.id),
            instructorName: instructor.name || 'Instructor',
            imageUrl: instructor.avatarUrl || '',
          }))
        : [{
            instructorId: 'lesson-default',
            instructorName: 'Generated narrator',
            imageUrl: '',
          }]
      const responses = await Promise.all(generationTargets.map((target) => generateAiLessonVideo({ ...basePayload, ...target })))
      const generatedLessons = responses.map((response, targetIndex) => {
        const generated = response.data.generation.lesson
        const target = generationTargets[targetIndex]
        return {
          instructorId: target.instructorId,
          instructorName: target.instructorName,
          videoUrl: generated.videoUrl,
          imageUrl: target.imageUrl,
          durationMin: generated.durationMin,
          generationId: generated.metadata?.generationId || response.data.generation.id,
          voiceId: generated.metadata?.voice?.id || fallbackVoiceId,
          avatarId: generated.metadata?.avatar?.id || fallbackAvatarId,
        }
      })
      const primaryGenerated = responses[0].data.generation.lesson
      setForm((prev) => ({
        ...prev,
        lessons: prev.lessons.map((item, lessonIndex) => (
          lessonIndex === index
            ? {
                ...item,
                type: 'VIDEO',
                lessonKind: 'AI_AVATAR_VIDEO',
                description: item.description || primaryGenerated.description,
                durationMin: primaryGenerated.durationMin,
                videoUrl: generatedLessons[0]?.videoUrl || item.videoUrl,
                resources: [...(item.resources || []), ...(primaryGenerated.resources || [])],
                aiInstructorVideos: generatedLessons,
                aiGenerationStatus: `${generatedLessons.length} narrated lesson video${generatedLessons.length === 1 ? '' : 's'} generated automatically.`,
                aiAvatarId: primaryGenerated.metadata.avatar.id,
                aiVoiceId: primaryGenerated.metadata.voice.id,
              }
            : item
        )),
      }))
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not prepare AI video generation.')
    } finally {
      setGeneratingLessonIndex(null)
    }
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
      const sourceVideoDurationSeconds = file.type.startsWith('video/') ? await getVideoDurationSeconds(file).catch(() => 0) : 0
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
              lessonKind: file.type.startsWith('video/') ? 'UPLOADED_VIDEO' : lesson.lessonKind,
              videoUrl: file.type.startsWith('video/') ? asset.url : lesson.videoUrl,
              durationMin: sourceVideoDurationSeconds ? Math.max(1, Math.ceil(sourceVideoDurationSeconds / 60)) : lesson.durationMin,
              sourceVideoDurationSeconds: sourceVideoDurationSeconds || lesson.sourceVideoDurationSeconds || 0,
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

  async function uploadAiLessonAsset(file, index, key) {
    if (!file) return
    if (file.size > MAX_COURSE_FILE_SIZE) {
      setError('AI lesson files must be 60 MB or smaller.')
      return
    }

    const keyName = `ai:${key}:${index}`
    try {
      setUploadingKey(keyName)
      setError('')
      const dataUrl = await readFileAsDataUrl(file)
      const response = await uploadAdminCourseAsset({ fileName: file.name, mimeType: file.type, dataUrl })
      const asset = response.data.asset
      setForm((prev) => ({
        ...prev,
        lessons: prev.lessons.map((lesson, lessonIndex) => (
          lessonIndex === index
            ? {
                ...lesson,
                [key]: asset.url,
                resources: key === 'aiPdfUrl' ? [...(lesson.resources || []), asset] : lesson.resources,
              }
            : lesson
        )),
      }))
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not upload the selected AI lesson file.')
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
        type: lessonKindToDbType(lesson.lessonKind),
        title: lesson.title.trim(),
        description: lesson.description.trim(),
        videoUrl: lesson.videoUrl.trim(),
        durationMin: Number(lesson.durationMin || 0),
        quizJson: {
          resources: lesson.resources || [],
          moduleTitle: String(lesson.moduleTitle || 'Module 1').trim(),
          lessonKind: lesson.lessonKind || 'UPLOADED_VIDEO',
          thumbnailUrl: String(lesson.thumbnailUrl || '').trim(),
          courseUrl: String(lesson.courseUrl || '').trim(),
          learningOutcomes: splitLines(lesson.learningOutcomes),
          captionsUrl: String(lesson.captionsUrl || '').trim(),
          sourceVideoDurationSeconds: Number(lesson.sourceVideoDurationSeconds || 0),
          preview: Boolean(lesson.preview),
          aiVideo: lesson.lessonKind === 'AI_AVATAR_VIDEO' ? {
            script: String(lesson.aiScript || '').trim(),
            avatarId: String(lesson.aiAvatarId || '').trim(),
            voiceId: String(lesson.aiVoiceId || '').trim(),
            slideUrl: String(lesson.aiSlideUrl || '').trim(),
            imageUrl: String(lesson.aiImageUrl || '').trim(),
            voiceSampleUrl: String(lesson.aiVoiceSampleUrl || '').trim(),
            pdfUrl: String(lesson.aiPdfUrl || '').trim(),
            instructorVideos: lesson.aiInstructorVideos || [],
            generationStatus: String(lesson.aiGenerationStatus || '').trim(),
            compliance: 'Creates a narrated lesson video page from the uploaded video and provided subtitles/script. Connect a licensed voice provider for final custom voice audio.',
          } : null,
        },
      }))
      .filter((lesson) => lesson.title || lesson.description || lesson.videoUrl || lesson.resources?.length)
    lessons.forEach((lesson, index) => {
      if (!lesson.title) nextErrors[`lesson-${index}-title`] = 'Lesson title is required when adding lesson content.'
      if (lesson.durationMin < 0) nextErrors[`lesson-${index}-duration`] = 'Duration cannot be negative.'
      if (lesson.quizJson.lessonKind === 'EXTERNAL_URL' && !lesson.quizJson.courseUrl) {
        nextErrors[`lesson-${index}-url`] = 'External course URL is required.'
      }
      if (lesson.quizJson.lessonKind === 'AI_AVATAR_VIDEO' && (!lesson.videoUrl || !lesson.quizJson.aiVideo.script || !(lesson.quizJson.aiVideo.instructorVideos || []).length)) {
        nextErrors[`lesson-${index}-ai`] = 'Upload the lesson video and generate narrated AI videos before saving this lesson.'
      }
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
        if (question.type === 'DESCRIPTIVE' && !question.modelAnswer) {
          nextErrors[`${key}-answer`] = 'Model answer is required.'
        }
        if (Number(question.marks || 0) < 1) {
          nextErrors[`${key}-marks`] = 'Marks must be at least 1.'
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
        id: assessment.id,
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
      setSavedSnapshot(JSON.stringify(form))
      window.localStorage.removeItem(draftKey)
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

      {mode === 'create' && dirty ? <AdminNotice type="info">Draft changes are automatically saved on this device until the course is submitted.</AdminNotice> : null}

      <form onSubmit={submit} className="admin-panel p-5 sm:p-6">
        {loading ? <AdminLoadingState label="Loading course..." /> : (
          <div className="grid gap-5 lg:grid-cols-2">
            <Field label="Title" value={form.title} error={fieldErrors.title} onChange={(value) => update('title', value)} />
            <label className="admin-label">
              Category
              <select value={form.category} onChange={(event) => update('category', event.target.value)} className="admin-input" aria-invalid={Boolean(fieldErrors.category)}>
                <option value="">Select category</option>
                {form.category && !COURSE_CATEGORY_OPTIONS.includes(form.category) ? <option value={form.category}>{form.category}</option> : null}
                {COURSE_CATEGORY_OPTIONS.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <FieldError>{fieldErrors.category}</FieldError>
            </label>
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
                <div className="flex min-h-48 w-full items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3">
                  <img src={form.thumbnailUrl} alt="Course thumbnail preview" className="max-h-[70vh] w-full rounded-md object-contain" />
                </div>
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
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">Lesson {index + 1}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{lesson.moduleTitle || 'Module 1'} | {LESSON_KIND_OPTIONS.find((item) => item.value === lesson.lessonKind)?.label || 'Lesson'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => moveLesson(index, -1)} disabled={index === 0}>Move Up</Button>
                        <Button type="button" variant="secondary" onClick={() => moveLesson(index, 1)} disabled={index === form.lessons.length - 1}>Move Down</Button>
                        <Button type="button" variant="secondary" onClick={() => removeLesson(index)} disabled={form.lessons.length === 1}>Remove</Button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <Field label="Module" value={lesson.moduleTitle || ''} onChange={(value) => updateLesson(index, 'moduleTitle', value)} />
                      <Field
                        label="Lesson title"
                        value={lesson.title}
                        error={fieldErrors[`lesson-${index}-title`]}
                        onChange={(value) => updateLesson(index, 'title', value)}
                      />
                      <label className="admin-label">
                        Lesson type
                        <select value={lesson.lessonKind || 'UPLOADED_VIDEO'} onChange={(event) => updateLesson(index, 'lessonKind', event.target.value)} className="admin-input">
                          {LESSON_KIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </label>
                      <Field
                        label="Duration in minutes"
                        type="number"
                        value={lesson.durationMin}
                        error={fieldErrors[`lesson-${index}-duration`]}
                        onChange={(value) => updateLesson(index, 'durationMin', value)}
                      />
                      {lesson.lessonKind === 'EXTERNAL_URL' ? (
                        <Field label="External course URL" value={lesson.courseUrl || ''} error={fieldErrors[`lesson-${index}-url`]} onChange={(value) => updateLesson(index, 'courseUrl', value)} />
                      ) : (
                        <Field label="Video URL / hosted file URL" value={lesson.videoUrl} onChange={(value) => updateLesson(index, 'videoUrl', value)} />
                      )}
                      <Field label="Thumbnail URL" value={lesson.thumbnailUrl || ''} onChange={(value) => updateLesson(index, 'thumbnailUrl', value)} />
                      <Field label="Captions URL (VTT/SRT)" value={lesson.captionsUrl || ''} onChange={(value) => updateLesson(index, 'captionsUrl', value)} />
                      <label className="flex min-h-12 items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)]">
                        <input type="checkbox" checked={Boolean(lesson.preview)} onChange={(event) => updateLesson(index, 'preview', event.target.checked)} className="h-4 w-4 accent-cyan-400" />
                        Allow free preview
                      </label>
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
                      {lesson.lessonKind === 'AI_AVATAR_VIDEO' ? (
                        <div className="lg:col-span-2 rounded-lg border border-blue-400/25 bg-blue-500/10 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--text-primary)]">AI narrated video generation</p>
                              <p className="mt-1 text-xs text-[var(--text-muted)]">Uses the uploaded lesson video and provided subtitles/script. Replica voice audio requires a licensed voice provider connected to this flow.</p>
                            </div>
                            <Button type="button" onClick={() => generateAiLesson(index)} disabled={generatingLessonIndex === index}>
                              {generatingLessonIndex === index ? 'Generating...' : 'Generate AI Videos'}
                            </Button>
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <label className="admin-label">
                              Voice generation profile
                              <select value={lesson.aiAvatarId || ''} onChange={(event) => updateLesson(index, 'aiAvatarId', event.target.value)} className="admin-input">
                                <option value="">Use default licensed profile</option>
                                {aiOptions.avatars.map((avatar) => <option key={avatar.id} value={avatar.id}>{avatar.name} - {avatar.license}</option>)}
                              </select>
                            </label>
                            <label className="admin-label">
                              Authorized voice model
                              <select value={lesson.aiVoiceId || ''} onChange={(event) => updateLesson(index, 'aiVoiceId', event.target.value)} className="admin-input">
                                <option value="">Use default voice model</option>
                                {aiOptions.voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name} - {voice.language}</option>)}
                              </select>
                            </label>
                            <label className="admin-label">
                              Optional reference image
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => {
                                  void uploadAiLessonAsset(event.target.files?.[0], index, 'aiImageUrl')
                                  event.target.value = ''
                                }}
                                className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
                              />
                              <span className="text-xs text-[var(--text-muted)]">
                                {lesson.aiImageUrl ? 'Reference image uploaded.' : 'Optional. Avatar rendering is disabled for now.'}
                                {uploadingKey === `ai:aiImageUrl:${index}` ? ' Uploading...' : ''}
                              </span>
                            </label>
                            <label className="admin-label">
                              Voice reference sample
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(event) => {
                                  void uploadAiLessonAsset(event.target.files?.[0], index, 'aiVoiceSampleUrl')
                                  event.target.value = ''
                                }}
                                className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
                              />
                              <span className="text-xs text-[var(--text-muted)]">
                                Voice reference for provider rendering. Use only authorized samples; this app stores it but does not clone voices locally.
                                {uploadingKey === `ai:aiVoiceSampleUrl:${index}` ? ' Uploading...' : ''}
                              </span>
                            </label>
                            <label className="admin-label">
                              Lesson PDF
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={(event) => {
                                  void uploadAiLessonAsset(event.target.files?.[0], index, 'aiPdfUrl')
                                  event.target.value = ''
                                }}
                                className="admin-input file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 file:transition hover:file:bg-cyan-300"
                              />
                              <span className="text-xs text-[var(--text-muted)]">
                                Optional PDF shown in the generated lesson page.
                                {uploadingKey === `ai:aiPdfUrl:${index}` ? ' Uploading...' : ''}
                              </span>
                            </label>
                            <Field label="Slide deck / presentation URL" value={lesson.aiSlideUrl || ''} onChange={(value) => updateLesson(index, 'aiSlideUrl', value)} />
                            {lesson.aiInstructorVideos?.length ? (
                              <div className="lg:col-span-2 rounded-lg border border-blue-400/25 bg-white/70 p-3 text-sm text-blue-700 dark:bg-slate-950/30 dark:text-blue-100">
                                Generated narrated video for {lesson.aiInstructorVideos.length} instructor{lesson.aiInstructorVideos.length === 1 ? '' : 's'}:
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                  {lesson.aiInstructorVideos.map((item) => (
                                    <span key={`${item.instructorId}-${item.videoUrl}`} className="truncate rounded-md bg-blue-500/10 px-2 py-1">
                                      {item.instructorName}: {item.videoUrl}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : lesson.videoUrl ? (
                              <div className="rounded-lg border border-blue-400/25 bg-white/70 p-3 text-sm text-blue-700 dark:bg-slate-950/30 dark:text-blue-100">
                                Generated lesson link: <span className="font-semibold">{lesson.videoUrl}</span>
                              </div>
                            ) : null}
                            {lesson.aiGenerationStatus ? (
                              <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-100">{lesson.aiGenerationStatus}</div>
                            ) : null}
                            <label className="admin-label lg:col-span-2">
                              Lesson script
                              <textarea value={lesson.aiScript || ''} onChange={(event) => updateLesson(index, 'aiScript', event.target.value)} rows={6} className="admin-input" placeholder="Paste subtitles or narration script for the generated voice." />
                              <FieldError>{fieldErrors[`lesson-${index}-ai`]}</FieldError>
                            </label>
                          </div>
                        </div>
                      ) : null}
                      <label className="admin-label lg:col-span-2">
                        Learning outcomes
                        <textarea
                          value={lesson.learningOutcomes || ''}
                          onChange={(event) => updateLesson(index, 'learningOutcomes', event.target.value)}
                          rows={3}
                          className="admin-input"
                          placeholder="One outcome per line. Example: Build a reusable React component."
                        />
                      </label>
                      <label className="admin-label lg:col-span-2">
                        Lesson description
                        <textarea
                          value={lesson.description}
                          onChange={(event) => updateLesson(index, 'description', event.target.value)}
                          rows={6}
                          className="admin-input"
                          placeholder="Describe what the learner will watch, practice, or download in this lesson."
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
                                  <label className="admin-label">
                                    Marks
                                    <input
                                      type="number"
                                      min="1"
                                      value={question.marks || 1}
                                      onChange={(event) => updateAssessmentQuestion(index, questionIndex, { marks: event.target.value })}
                                      className="admin-input"
                                    />
                                    <FieldError>{fieldErrors[`${questionKey}-marks`]}</FieldError>
                                  </label>
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
                                    <div className="lg:col-span-2 grid gap-4 rounded-lg border border-indigo-400/20 bg-indigo-500/10 p-4">
                                      <label className="admin-label">
                                        Model answer / expected answer
                                        <textarea
                                          value={question.modelAnswer || ''}
                                          onChange={(event) => updateAssessmentQuestion(index, questionIndex, { modelAnswer: event.target.value })}
                                          rows={3}
                                          className="admin-input"
                                          placeholder="Write the answer admins can use while evaluating."
                                        />
                                        <FieldError>{fieldErrors[`${questionKey}-answer`]}</FieldError>
                                      </label>
                                      <label className="admin-label">
                                        Evaluation notes
                                        <textarea
                                          value={question.evaluationNotes || ''}
                                          onChange={(event) => updateAssessmentQuestion(index, questionIndex, { evaluationNotes: event.target.value })}
                                          rows={2}
                                          className="admin-input"
                                          placeholder="Optional rubric or marking guidance."
                                        />
                                      </label>
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
          <Button type="submit" disabled={loading} loading={saving} loadingLabel="Saving...">Save Course</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/courses')}>Cancel</Button>
        </div>
      </form>
    </section>
  )
}

function normalizeLessons(lessons = []) {
  const normalized = lessons.filter((lesson) => lesson.quizJson?.kind !== 'assessment').map((lesson) => ({
    id: lesson.id,
    moduleTitle: lesson.quizJson?.moduleTitle || 'Module 1',
    title: lesson.title || '',
    description: lesson.description || '',
    type: lesson.type || 'VIDEO',
    lessonKind: lesson.quizJson?.lessonKind || (lesson.type === 'VIDEO' ? 'UPLOADED_VIDEO' : 'DOWNLOADABLE_MATERIAL'),
    durationMin: lesson.durationMin || 0,
    videoUrl: lesson.videoUrl || '',
    courseUrl: lesson.quizJson?.courseUrl || '',
    thumbnailUrl: lesson.quizJson?.thumbnailUrl || '',
    resources: lesson.quizJson?.resources || [],
    learningOutcomes: Array.isArray(lesson.quizJson?.learningOutcomes) ? lesson.quizJson.learningOutcomes.join('\n') : '',
    captionsUrl: lesson.quizJson?.captionsUrl || '',
    sourceVideoDurationSeconds: Number(lesson.quizJson?.sourceVideoDurationSeconds || lesson.quizJson?.aiVideo?.targetDurationSeconds || 0),
    preview: Boolean(lesson.quizJson?.preview),
    aiScript: lesson.quizJson?.aiVideo?.script || '',
    aiAvatarId: lesson.quizJson?.aiVideo?.avatarId || '',
    aiVoiceId: lesson.quizJson?.aiVideo?.voiceId || '',
    aiSlideUrl: lesson.quizJson?.aiVideo?.slideUrl || '',
    aiImageUrl: lesson.quizJson?.aiVideo?.imageUrl || '',
    aiVoiceSampleUrl: lesson.quizJson?.aiVideo?.voiceSampleUrl || '',
    aiPdfUrl: lesson.quizJson?.aiVideo?.pdfUrl || '',
    aiInstructorVideos: Array.isArray(lesson.quizJson?.aiVideo?.instructorVideos) ? lesson.quizJson.aiVideo.instructorVideos : [],
    aiGenerationStatus: normalizeAiGenerationStatus(lesson.quizJson?.aiVideo?.generationStatus || ''),
  }))
  return normalized.length ? normalized : initialForm.lessons
}

function lessonKindToDbType(kind) {
  return ['UPLOADED_VIDEO', 'AI_AVATAR_VIDEO'].includes(kind) ? 'VIDEO' : 'ARTICLE'
}

function normalizeLessonUpdate(lesson, key, value) {
  if (key === 'lessonKind') {
    return {
      ...lesson,
      lessonKind: value,
      type: lessonKindToDbType(value),
      durationMin: ['UPLOADED_VIDEO', 'AI_AVATAR_VIDEO'].includes(value) && !lesson.durationMin ? 8 : lesson.durationMin,
    }
  }
  return { ...lesson, [key]: value }
}

function splitLines(value) {
  return String(value || '').split('\n').map((item) => item.trim()).filter(Boolean)
}

function getVideoDurationSeconds(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      URL.revokeObjectURL(url)
      resolve(Math.round(duration))
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read video duration.'))
    }
    video.src = url
  })
}

function normalizeAiGenerationStatus(status) {
  if (status === 'Connect a licensed avatar/video provider to render final MP4.') {
    return 'AI video draft prepared. Upload the rendered MP4 or paste the final video URL when it is ready.'
  }
  return status
}

function normalizeAssessments(lessons = []) {
  const normalized = lessons.filter((lesson) => lesson.quizJson?.kind === 'assessment').map((lesson) => ({
    id: lesson.id,
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
      modelAnswer: type === 'DESCRIPTIVE' ? String(question.modelAnswer || question.expectedAnswer || '').trim() : '',
      evaluationNotes: type === 'DESCRIPTIVE' ? String(question.evaluationNotes || '').trim() : '',
      marks: Math.max(1, Number.parseInt(question.marks, 10) || 1),
    }
  })
  return normalized.length ? normalized : [createAssessmentQuestion()]
}

function questionHasContent(question) {
  return Boolean(
    question.text
    || question.correctAnswer
    || question.modelAnswer
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
