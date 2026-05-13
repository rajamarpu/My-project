import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 8000,
})

export const fetchCourses = async () => api.get('/courses')
export const fetchCourseById = async (id) => api.get(`/courses/${id}`)
export const loginRequest = async (payload) => api.post('/auth/login', payload)
export const registerRequest = async (payload) => api.post('/auth/register', payload)
export default api
