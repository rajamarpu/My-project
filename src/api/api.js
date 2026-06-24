import api from '../api/client.js'

const responseCache = new Map()

function cacheKey(key) {
  return `uptoskills:cache:${key}`
}

function readCachedValue(key) {
  const inMemory = responseCache.get(key)
  if (inMemory && inMemory.expiresAt > Date.now()) return inMemory.data
  if (inMemory) responseCache.delete(key)
  if (typeof window === 'undefined' || !window.sessionStorage) return null
  try {
    const raw = window.sessionStorage.getItem(cacheKey(key))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(cacheKey(key))
      return null
    }
    responseCache.set(key, parsed)
    return parsed.data
  } catch {
    return null
  }
}

function writeCachedValue(key, data, ttlMs = 15000) {
  const record = { data, expiresAt: Date.now() + ttlMs }
  responseCache.set(key, record)
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    window.sessionStorage.setItem(cacheKey(key), JSON.stringify(record))
  } catch {
    // Ignore storage quota or privacy errors.
  }
}

function invalidateCachedValue(key) {
  responseCache.delete(key)
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    window.sessionStorage.removeItem(cacheKey(key))
  } catch {
    // Ignore storage quota or privacy errors.
  }
}

function invalidateCachedPrefix(prefix) {
  const inMemoryKeys = [...responseCache.keys()].filter((key) => key === prefix || key.startsWith(`${prefix}:`))
  inMemoryKeys.forEach((key) => responseCache.delete(key))
  if (typeof window === 'undefined' || !window.sessionStorage) return
  try {
    const keysToRemove = []
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index)
      if (key && key.startsWith('uptoskills:cache:')) {
        const resourceKey = key.slice('uptoskills:cache:'.length)
        if (resourceKey === prefix || resourceKey.startsWith(`${prefix}:`)) keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key))
  } catch {
    // Ignore storage quota or privacy errors.
  }
}

async function cachedGet(key, request, ttlMs = 15000) {
  const cached = readCachedValue(key)
  if (cached !== null) return { data: cached, cached: true }
  const response = await request()
  writeCachedValue(key, response.data, ttlMs)
  return response
}

export const readApiCache = readCachedValue
export const invalidateApiCache = invalidateCachedValue
export const invalidateApiCachePrefix = invalidateCachedPrefix

export const fetchCourses = async () => cachedGet('courses', () => api.get('/courses'))
export const fetchCourseById = async (id) => cachedGet(`course:${id}`, () => api.get(`/courses/${id}`))
export const fetchPlatformSummary = async () => api.get('/stats/summary')
export const fetchInstructors = async () => api.get('/instructors')
export const enrollCourseRequest = async (id, payload = {}) => api.post(`/courses/${id}/enroll`, payload)
export const unenrollCourseRequest = async (id) => api.delete(`/courses/${id}/enroll`)
export const fetchCourseInstructors = async (id) => cachedGet(`course-instructors:${id}`, () => api.get(`/courses/${id}/instructors`))
export const switchCourseInstructor = async (id, payload) => api.post(`/courses/${id}/instructor`, payload)
export const fetchLearnerDashboard = async () => cachedGet('learner-dashboard', () => api.get('/learner/dashboard'))
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
export const fetchPreferences = async () => cachedGet('portal-preferences', () => api.get('/portal/preferences'))
export const savePreferences = async (payload) => api.put('/portal/preferences', payload)
export const fetchSavedCourses = async () => cachedGet('saved-courses', () => api.get('/portal/saved-courses'))
export const saveCourseRequest = async (courseId) => api.post(`/portal/saved-courses/${courseId}`)
export const removeSavedCourseRequest = async (courseId) => api.delete(`/portal/saved-courses/${courseId}`)
export const fetchPortalNotifications = async (params = {}) => cachedGet(`portal-notifications:${JSON.stringify(params)}`, () => api.get('/portal/notifications', { params }))
export const markPortalNotificationRead = async (id) => api.patch(`/portal/notifications/${id}/read`)
export const fetchLiveSessions = async () => cachedGet('live-sessions', () => api.get('/portal/live-sessions'))
export const createLiveSession = async (payload) => api.post('/portal/live-sessions', payload)
export const fetchLearnerReport = async () => cachedGet('learner-report', () => api.get('/portal/learner-report'))
export const fetchInstructorCourses = async () => cachedGet('instructor-courses', () => api.get('/portal/instructor/courses'))
export const fetchCommunityTopics = async () => cachedGet('community-topics', () => api.get('/portal/community/topics'))
export const createCommunityTopic = async (payload) => api.post('/portal/community/topics', payload)
export const fetchCommunityPosts = async (topicId, params = {}) => cachedGet(`community-posts:${topicId}:${JSON.stringify(params)}`, () => api.get(`/portal/community/topics/${topicId}/posts`, { params }))
export const createCommunityPost = async (topicId, payload) => api.post(`/portal/community/topics/${topicId}/posts`, payload)
export const reportCommunityPost = async (postId, payload) => api.post(`/portal/community/posts/${postId}/report`, payload)
export const fetchPlatformSettings = async () => cachedGet('platform-settings', () => api.get('/portal/admin/settings'))
export const savePlatformSettings = async (payload) => api.put('/portal/admin/settings', payload)
export const createCheckout = async (payload, idempotencyKey) => api.post('/portal/payments/checkout', payload, { headers: { 'Idempotency-Key': idempotencyKey } })
export const verifyCheckout = async (payload) => api.post('/portal/payments/verify', payload)
export const fetchPaymentHistory = async () => cachedGet('payment-history', () => api.get('/portal/payments'))
export const updateAdminPaymentStatus = async (id, status) => api.patch(`/portal/admin/payments/${id}/status`, { status })
export const requestAdminPaymentRefund = async (id, payload = {}) => api.post(`/portal/admin/payments/${id}/refund`, payload)
export const fetchAdminOverview = async () => cachedGet('admin-overview', () => api.get('/admin/overview'))
export const fetchAdminUsers = async () => cachedGet('admin-users', () => api.get('/admin/users'))
export const fetchAdminLearners = async () => cachedGet('admin-learners', () => api.get('/admin/learners'))
export const fetchAdminInstructors = async () => cachedGet('admin-instructors', () => api.get('/admin/instructors'))
export const fetchAdminCourses = async (params = {}) => cachedGet(`admin-courses:${JSON.stringify(params)}`, () => api.get('/admin/courses', { params }))
export const fetchAdminCategories = async () => cachedGet('admin-categories', () => api.get('/admin/categories'))
export const fetchAdminEnrollments = async () => cachedGet('admin-enrollments', () => api.get('/admin/enrollments'))
export const fetchAdminInstructorChanges = async () => cachedGet('admin-instructor-changes', () => api.get('/admin/instructor-changes'))
export const fetchAdminCertificates = async () => cachedGet('admin-certificates', () => api.get('/admin/certificates'))
export const deleteAdminCertificate = async (id) => api.delete(`/admin/certificates/${id}`)
export const fetchCertificates = async () => cachedGet('certificates', () => api.get('/certificates'))
export const createCertificate = async (payload) => api.post('/certificates', payload)
export const fetchAdminNotifications = async () => cachedGet('admin-notifications', () => api.get('/admin/notifications'))
export const fetchAdminActivityLogs = async () => cachedGet('admin-activity-logs', () => api.get('/admin/activity-logs'))
export const fetchAdminPayments = async () => cachedGet('admin-payments', () => api.get('/admin/payments'))
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
export const fetchMyAssessmentSubmissions = async (params = {}) => cachedGet(`assessment-submissions:${JSON.stringify(params)}`, () => api.get('/assessments/submissions', { params }))
export const fetchAssessmentSubmission = async (id) => cachedGet(`assessment-submission:${id}`, () => api.get(`/assessments/submissions/${id}`))
export const fetchAdminAssessmentSubmissions = async (params = {}) => cachedGet(`admin-assessment-submissions:${JSON.stringify(params)}`, () => api.get('/assessments/admin/submissions', { params }))
export const evaluateAssessmentSubmission = async (id, evaluations) => api.patch(`/assessments/admin/submissions/${id}/evaluate`, { evaluations })
export const grantAssessmentRetake = async (payload) => api.post('/assessments/admin/retakes', payload)
export const downloadAssessmentSubmissionUrl = (id) => `${api.defaults.baseURL}/assessments/admin/submissions/${id}/download`
export const uploadContentRequest = async (payload) => api.post('/content/upload', payload)
export const createTaskRequest = async (payload) => api.post('/tasks', payload)
export const fetchContentLibrary = async () => cachedGet('content-library', () => api.get('/content'))

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
export const fetchUserProgress = (courseId) => cachedGet(`progress:${courseId}`, () => api.get(`/progress/${courseId}`))
export const updateUserProgress = (data) => api.post('/progress', data)
export const fetchUserAnalytics = () => cachedGet('user-analytics', () => api.get('/progress/analytics/user'))

// Chat APIs
export const fetchChatMessages = (courseId) => cachedGet(`chat-messages:${courseId}`, () => api.get(`/chat/rooms/${courseId}`))
export const sendMessage = (data) => api.post('/chat/message', data)
export const fetchOnlineUsers = () => cachedGet('online-users', () => api.get('/chat/online-users'))

// Personality APIs
export const fetchPersonalities = () => cachedGet('personalities', () => api.get('/personalities'))
export const fetchPersonalityBySlug = (slug) => cachedGet(`personality:${slug}`, () => api.get(`/personalities/slug/${slug}`))

export default api
