const api = process.env.API_URL || 'http://localhost:5000/api'
const adminEmail = process.env.ADMIN_EMAIL || 'admin@uptoskills.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'UptoSkills@Admin2026'
const unique = Date.now()
const email = `codex-production-smoke-${unique}@example.com`
const password = 'ProductionSmoke@2026'

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path} failed (${response.status}): ${payload.message || 'Unknown error'}`)
  return payload
}

const checks = []
let learner
let adminToken

try {
  learner = await request('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Production Smoke Learner', email, password, confirmPassword: password, role: 'learner' }) })
  checks.push('learner registration')

  const token = learner.token
  const preferences = await request('/portal/preferences', { method: 'PUT', token, body: JSON.stringify({ language: 'English', timezone: 'Asia/Kolkata', emailNotifications: true }) })
  if (preferences.settings?.language !== 'English') throw new Error('Preferences did not persist')
  checks.push('persisted preferences')

  const catalog = await request('/courses', { token })
  if (catalog.courses?.length) {
    const courseId = catalog.courses[0].id
    await request(`/portal/saved-courses/${courseId}`, { method: 'POST', token })
    const saved = await request('/portal/saved-courses', { token })
    if (!saved.savedCourses?.some((course) => course.id === courseId)) throw new Error('Saved course did not persist')
    await request(`/portal/saved-courses/${courseId}`, { method: 'DELETE', token })
    checks.push('saved-course round trip')
  } else checks.push('saved-course round trip (catalog empty)')

  await request('/portal/learner-report', { token })
  await request('/portal/notifications', { token })
  await request('/portal/live-sessions', { token })
  checks.push('learner report, notifications, and live sessions')

  const admin = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: adminEmail, password: adminPassword, role: 'admin' }) })
  adminToken = admin.token
  await request('/portal/admin/settings', { token: adminToken })
  await request('/admin/overview', { token: adminToken })
  await request('/admin/activity-logs', { token: adminToken })
  checks.push('admin settings and reporting access')

  const instructorEmail = process.env.INSTRUCTOR_EMAIL || 'rohitsharma@gmail.com'
  const instructorPassword = process.env.INSTRUCTOR_PASSWORD || `${instructorEmail}:UptoSkills2026!`
  const instructor = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email: instructorEmail, password: instructorPassword, role: 'instructor' }) })
  await request('/portal/instructor/courses', { token: instructor.token })
  await request('/portal/live-sessions', { token: instructor.token })
  await request('/portal/notifications', { token: instructor.token })
  checks.push('instructor courses, sessions, and notifications')

  console.log(`Production readiness smoke passed: ${checks.join('; ')}`)
} finally {
  if (learner?.user?.id && adminToken) {
    await request(`/admin/users/${learner.user.id}`, { method: 'DELETE', token: adminToken }).catch(() => {})
  }
}
