import api from './api.js'
import { fetchAuthCaptcha } from './api.js'

async function attachCaptcha(payload = {}) {
  if (payload.captchaId && payload.captchaAnswer !== undefined) return payload
  const response = await fetchAuthCaptcha()
  return {
    ...payload,
    captchaId: response.data.captcha.captchaId,
    captchaAnswer: String(response.data.captcha.left + response.data.captcha.right),
  }
}

export const adminLoginRequest = async (payload) => api.post('/auth/login', await attachCaptcha(payload))
export const adminRegisterRequest = async (payload) => api.post('/admin/users', payload)
export const fetchAdminLearners = async (token) => 
  api.get('/admin/learners', { headers: { Authorization: `Bearer ${token}` }})
export const fetchAdminInstructors = async (token) => 
  api.get('/admin/instructors', { headers: { Authorization: `Bearer ${token}` }})

export const learnerLoginRequest = async (payload) => api.post('/auth/login', await attachCaptcha(payload))
export const learnerRegisterRequest = async (payload) => api.post('/auth/register', await attachCaptcha(payload))
export const fetchLearnerDashboard = async (token) => 
  api.get('/learner/dashboard', { headers: { Authorization: `Bearer ${token}` }})
export const updateLearnerProgress = async (token, payload) => 
  api.post('/learner/progress', payload, { headers: { Authorization: `Bearer ${token}` }})
