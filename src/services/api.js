import axios from 'axios'

const BACKEND_URL = 'http://localhost:4001/api'

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 8000,
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// AUTH APIs
export const authAPI = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (payload) => api.post('/auth/verify-otp', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  getCurrentUser: () => api.get('/users/me'),
}

// COURSE APIs
export const courseAPI = {
  getAllCourses: () => api.get('/courses'),
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

export default api
