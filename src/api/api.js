import api from '../api/client.js'

export const fetchCourses = async () => api.get('/courses')
export const fetchCourseById = async (id) => api.get(`/courses/${id}`)
export const fetchPlatformSummary = async () => api.get('/stats/summary')
export const enrollCourseRequest = async (id, payload = {}) => api.post(`/courses/${id}/enroll`, payload)
export const unenrollCourseRequest = async (id) => api.delete(`/courses/${id}/enroll`)
export const fetchCourseInstructors = async (id) => api.get(`/courses/${id}/instructors`)
export const switchCourseInstructor = async (id, payload) => api.post(`/courses/${id}/instructor`, payload)
export const fetchLearnerDashboard = async () => api.get('/learner/dashboard')
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
export const fetchCertificates = async () => api.get('/certificates')
export const createCertificate = async (payload) => api.post('/certificates', payload)
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
export const uploadAdminCourseAsset = async (payload) => api.post('/admin/uploads', payload, { timeout: 120000 })
export const fetchAiContentOptions = async () => api.get('/admin/ai-content/options')
export const generateAiLessonVideo = async (payload) => api.post('/admin/ai-content/generate', payload)
export const createAdminCategory = async (payload) => api.post('/admin/categories', payload)
export const updateAdminCategory = async (id, payload) => api.patch(`/admin/categories/${id}`, payload)
export const createCourseRequest = async (payload) => api.post('/courses', payload)
export const fetchQuestions = async (params = {}) => api.get('/questions', { params })
export const createQuestion = async (payload) => api.post('/questions', payload)
export const updateQuestion = async (id, payload) => api.patch(`/questions/${id}`, payload)
export const deleteQuestion = async (id) => api.delete(`/questions/${id}`)
export const validateQuestionAnswer = async (id, answer) => api.post(`/questions/${id}/validate`, { answer })
export const bulkImportQuestions = async (questions) => api.post('/questions/bulk', { questions })
export const submitStructuredAssessment = async (payload) => api.post('/assessments/submit', payload)
export const fetchMyAssessmentSubmissions = async (params = {}) => api.get('/assessments/submissions', { params })
export const fetchAssessmentSubmission = async (id) => api.get(`/assessments/submissions/${id}`)
export const fetchAdminAssessmentSubmissions = async (params = {}) => api.get('/assessments/admin/submissions', { params })
export const evaluateAssessmentSubmission = async (id, evaluations) => api.patch(`/assessments/admin/submissions/${id}/evaluate`, { evaluations })
export const grantAssessmentRetake = async (payload) => api.post('/assessments/admin/retakes', payload)
export const downloadAssessmentSubmissionUrl = (id) => `${api.defaults.baseURL}/assessments/admin/submissions/${id}/download`
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
export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => api.post('/auth/password/change', { currentPassword, newPassword, confirmPassword })

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
