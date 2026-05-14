import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 8000,
  withCredentials: true,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest?._retry && localStorage.getItem('refreshToken')) {
      originalRequest._retry = true
      try {
        const response = await api.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') })
        localStorage.setItem('authToken', response.data.token)
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('authToken')
        localStorage.removeItem('refreshToken')
      }
    }
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// AUTH APIs
export const authAPI = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  googleLogin: (payload) => api.post('/auth/google', payload),
  refresh: (payload) => api.post('/auth/refresh', payload),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (payload) => api.post('/auth/verify-otp', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  getCurrentUser: () => api.get('/users/me'),
}

// COURSE APIs
export const courseAPI = {
  getAllCourses: (params = {}) => api.get('/courses', { params }),
  getSuggestions: (q) => api.get('/courses/search/suggest', { params: { q } }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (payload) => api.post('/courses', payload),
  updateCourse: (id, payload) => api.put(`/courses/${id}`, payload),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
}

// USER APIs
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (payload) => api.put('/users/profile', payload),
}

// ENROLLMENT APIs
export const enrollmentAPI = {
  enrollCourse: (courseId) => api.post(`/enrollments/${courseId}`),
  getMyEnrollments: () => api.get('/enrollments/me'),
}

export const progressAPI = {
  getCourseProgress: (courseId) => api.get(`/progress/${courseId}`),
  saveLessonProgress: (courseId, lessonId, payload) => api.post(`/progress/${courseId}/${lessonId}`, payload),
}

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getInstructorAnalytics: () => api.get('/instructor/analytics'),
  getAdminSummary: () => api.get('/admin/summary'),
}

export const discussionAPI = {
  getDiscussions: () => api.get('/discussions'),
  createDiscussion: (payload) => api.post('/discussions', payload),
  reply: (id, payload) => api.post(`/discussions/${id}/replies`, payload),
}

export const certificateAPI = {
  getCertificates: () => api.get('/certificates'),
}

export default api
