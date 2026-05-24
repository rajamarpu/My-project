import api from '../api/client.js'

export const fetchCourses = async () => api.get('/courses')
export const fetchCourseById = async (id) => api.get(`/courses/${id}`)
export const enrollCourseRequest = async (id, payload = {}) => api.post(`/courses/${id}/enroll`, payload)
export const loginRequest = async (payload) => api.post('/auth/login', payload)
export const registerRequest = async (payload) => api.post('/auth/register', payload)
export const fetchMe = async () => api.get('/auth/me')
export const socialLoginUrl = (provider, role = 'learner') =>
  `${api.defaults.baseURL}/auth/${provider}/start?role=${encodeURIComponent(role)}`
export const updateProfileRequest = async (payload) => api.put('/profile', payload)
export const updateSettingsRequest = async (payload) => api.put('/settings', payload)
export const submitContactRequest = async (payload) => api.post('/contact', payload)
export const fetchAdminOverview = async () => api.get('/admin/overview')
export const createCourseRequest = async (payload) => api.post('/courses/create', payload)
export const uploadContentRequest = async (payload) => api.post('/content/upload', payload)
export const createTaskRequest = async (payload) => api.post('/tasks/create', payload)
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
