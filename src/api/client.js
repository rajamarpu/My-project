import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('lms-token') || window.sessionStorage.getItem('lms-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('lms-token')
      window.localStorage.removeItem('lms-user')
      window.localStorage.removeItem('lms-role')
      window.sessionStorage.removeItem('lms-token')
      window.sessionStorage.removeItem('lms-user')
      window.sessionStorage.removeItem('lms-role')
    }
    if (!error.response) {
      error.message = 'API server is not reachable. Start PostgreSQL, then run npm.cmd run backend.'
    }
    return Promise.reject(error)
  },
)

export default apiClient
