export function isAssignmentLesson(lesson) {
  return lesson?.quizJson?.kind === 'assessment'
}

export function getCourseLessons(course) {
  return (course?.lessons || []).filter((lesson) => !isAssignmentLesson(lesson))
}

export function getCourseAssignments(course) {
  return (course?.lessons || []).filter(isAssignmentLesson)
}

export function lessonMeta(lesson) {
  return lesson?.quizJson || {}
}

export function getLessonKind(lesson) {
  return lessonMeta(lesson).lessonKind || (lesson?.type === 'VIDEO' ? 'UPLOADED_VIDEO' : 'DOWNLOADABLE_MATERIAL')
}

export function getLessonResources(lesson) {
  return lessonMeta(lesson).resources || []
}

export function getLessonOutcomes(lesson) {
  const outcomes = lessonMeta(lesson).learningOutcomes
  return Array.isArray(outcomes) ? outcomes : []
}

export function getCourseModules(course) {
  const modules = []
  getCourseLessons(course).forEach((lesson) => {
    const title = lessonMeta(lesson).moduleTitle || 'Module 1'
    let module = modules.find((item) => item.title === title)
    if (!module) {
      module = { title, lessons: [] }
      modules.push(module)
    }
    module.lessons.push(lesson)
  })
  return modules
}
