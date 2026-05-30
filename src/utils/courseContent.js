export function isAssignmentLesson(lesson) {
  return lesson?.quizJson?.kind === 'assessment'
}

export function getCourseLessons(course) {
  return (course?.lessons || []).filter((lesson) => !isAssignmentLesson(lesson))
}

export function getCourseAssignments(course) {
  return (course?.lessons || []).filter(isAssignmentLesson)
}
