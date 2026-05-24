import api from './api.js'

export const adminLoginRequest = async (payload) => api.post('/auth/login', payload)
export const adminRegisterRequest = async (payload) => api.post('/admin/users', payload)
export const fetchAdminLearners = async (token) => 
  api.get('/admin/learners', { headers: { Authorization: `Bearer ${token}` }})
export const fetchAdminInstructors = async (token) => 
  api.get('/admin/instructors', { headers: { Authorization: `Bearer ${token}` }})

export const learnerLoginRequest = async (payload) => api.post('/auth/login', payload)
export const learnerRegisterRequest = async (payload) => api.post('/auth/register', payload)
export const fetchLearnerDashboard = async (token) => 
  api.get('/learner/dashboard', { headers: { Authorization: `Bearer ${token}` }})
export const updateLearnerProgress = async (token, payload) => 
  api.post('/learner/progress', payload, { headers: { Authorization: `Bearer ${token}` }})
