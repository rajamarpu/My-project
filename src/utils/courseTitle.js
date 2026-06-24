export function getCourseTitle(course, fallback = 'Course unavailable') {
  return (
    course?.title ||
    course?.courseTitle ||
    course?.name ||
    course?.course?.title ||
    course?.course?.courseTitle ||
    course?.course?.name ||
    course?.enrollment?.course?.title ||
    course?.enrollment?.courseTitle ||
    course?.enrollment?.title ||
    fallback
  )
}
