import api from '../api/client.js'

export const fetchCourses = async () => api.get('/courses')
export const fetchCourseById = async (id) => api.get(`/courses/${id}`)
export const fetchPlatformSummary = async () => api.get('/stats/summary')
export const enrollCourseRequest = async (id, payload = {}) => api.post(`/courses/${id}/enroll`, payload)
export const fetchCourseInstructors = async (id) => api.get(`/courses/${id}/instructors`)
export const switchCourseInstructor = async (id, payload) => api.post(`/courses/${id}/instructor`, payload)
export const loginRequest = async (payload) => api.post('/auth/login', payload)
export const registerRequest = async (payload) => api.post('/auth/register', payload)
export const fetchMe = async () => api.get('/auth/me')
export const socialLoginUrl = (provider, role = 'learner', intent = 'login') => {
  const params = new URLSearchParams({ role, intent })
  return `${api.defaults.baseURL}/auth/${provider}/start?${params.toString()}`
}
export const updateProfileRequest = async (payload) => api.put('/profile', payload)
export const updateSettingsRequest = async (payload) => api.put('/settings', payload)
export const submitContactRequest = async (payload) => api.post('/contact', payload)
export const fetchAdminOverview = async () => api.get('/admin/overview')
export const fetchAdminUsers = async () => api.get('/admin/users')
export const fetchAdminLearners = async () => api.get('/admin/learners')
export const fetchAdminInstructors = async () => api.get('/admin/instructors')
export const fetchAdminCourses = async (params = {}) => api.get('/admin/courses', { params })
export const fetchAdminCategories = async () => api.get('/admin/categories')
export const fetchAdminEnrollments = async () => api.get('/admin/enrollments')
export const fetchAdminInstructorChanges = async () => api.get('/admin/instructor-changes')
export const fetchAdminCertificates = async () => api.get('/admin/certificates')
export const fetchAdminNotifications = async () => api.get('/admin/notifications')
export const fetchAdminActivityLogs = async () => api.get('/admin/activity-logs')
export const fetchAdminPayments = async () => api.get('/admin/payments')
export const createAdminUser = async (payload) => api.post('/admin/users', payload)
export const updateAdminUser = async (id, payload) => api.patch(`/admin/users/${id}`, payload)
export const approveAdminUser = async (id) => api.post(`/admin/users/${id}/approve`)
export const rejectAdminUser = async (id) => api.post(`/admin/users/${id}/reject`)
export const suspendAdminUser = async (id) => api.post(`/admin/users/${id}/suspend`)
export const deleteAdminUser = async (id) => api.delete(`/admin/users/${id}`)
export const updateAdminCourse = async (id, payload) => api.patch(`/admin/courses/${id}`, payload)
export const deleteAdminCourse = async (id) => api.delete(`/admin/courses/${id}`)
export const createAdminCategory = async (payload) => api.post('/admin/categories', payload)
export const updateAdminCategory = async (id, payload) => api.patch(`/admin/categories/${id}`, payload)
export const createCourseRequest = async (payload) => api.post('/courses', payload)
export const uploadContentRequest = async (payload) => api.post('/content/upload', payload)
export const createTaskRequest = async (payload) => api.post('/tasks', payload)
export const fetchContentLibrary = async () => api.get('/content')

// Phase 2: admin approval workflow
export const fetchPendingUsers = async (adminUsername) =>
  api.get(`/admin/users/pending`, { params: { adminUsername } })

export const approveUser = async (adminUsername, username) =>
  api.post('/admin/users/approve', { adminUsername, username })

// Phase 4: assessments workflow
export const assignAssessment = async ({ instructorUsername, courseId, title, prompt }) =>
  api.post('/assessments/assign', { instructorUsername, courseId, title, prompt })

export const fetchAssignedAssessments = async ({ courseId, username }) =>
  api.get('/assessments/assigned', { params: { courseId, username } })

export const submitAssessment = async ({ username, courseId, assessmentId, answerText, noteFileName }) =>
  api.post('/assessments/submit', { username, courseId, assessmentId, answerText, noteFileName })

// Authentication: Google/GitHub OAuth uses browser redirects.
export const googleLogin = () => {
  window.location.assign(socialLoginUrl('google'))
}
export const githubLogin = () => {
  window.location.assign(socialLoginUrl('github'))
}

// Authentication: OTP Login
export const sendOtp = async (username) => api.post('/auth/otp/send', { username })
export const verifyOtp = async ({ username, otp, role }) => api.post('/auth/otp/verify', { username, otp, role })

// Authentication: Forgot Password
export const forgotPassword = async (email) => api.post('/auth/password/forgot', { email })
export const resetPassword = async ({ email, otp, newPassword }) => api.post('/auth/password/reset', { email, otp, newPassword })

// Progress APIs
export const fetchUserProgress = (courseId) => api.get(`/progress/${courseId}`)
export const updateUserProgress = (data) => api.post('/progress', data)
export const fetchUserAnalytics = () => api.get('/progress/analytics/user')

// Chat APIs
export const fetchChatMessages = (courseId) => api.get(`/chat/rooms/${courseId}`)
export const sendMessage = (data) => api.post('/chat/message', data)
export const fetchOnlineUsers = () => api.get('/chat/online-users')

// Personality APIs
export const fetchPersonalities = () => api.get('/personalities')
export const fetchPersonalityBySlug = (slug) => api.get(`/personalities/slug/${slug}`)

export default api
