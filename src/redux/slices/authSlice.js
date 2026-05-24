import { createSlice } from '@reduxjs/toolkit'
import { celebCourses } from '../../data/dummyData.js'

const initialState = {
  user: typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('lms-user') || 'null') : null,
  role: typeof window !== 'undefined' ? window.localStorage.getItem('lms-role') : null,
  token: typeof window !== 'undefined' ? window.localStorage.getItem('lms-token') : null,
  theme: 'dark',
  wishlist: [],
  enrolledCourses: celebCourses.slice(0, 2).map((course) => course.id),
  notifications: [
    { id: 'n1', title: 'Live class starting soon', message: 'Join the celebrity masterclass at 6:00 PM.', read: false },
  ],
  preferences: {
    playbackSpeed: 1.25,
  },
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action) {
      state.user = action.payload.user
      state.role = action.payload.role
      state.token = action.payload.token || state.token
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lms-user', JSON.stringify(action.payload.user))
        window.localStorage.setItem('lms-role', action.payload.role)
        window.localStorage.setItem('lms-last-online', new Date().toLocaleString())
        if (action.payload.token) window.localStorage.setItem('lms-token', action.payload.token)
      }
    },
    logout(state) {
      state.user = null
      state.role = null
      state.token = null
      state.wishlist = []
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('lms-last-online', new Date().toLocaleString())
        window.localStorage.removeItem('lms-user')
        window.localStorage.removeItem('lms-role')
        window.localStorage.removeItem('lms-token')
      }
    },
    toggleWishlist(state, action) {
      const courseId = action.payload
      if (state.wishlist.includes(courseId)) {
        state.wishlist = state.wishlist.filter((id) => id !== courseId)
      } else {
        state.wishlist.push(courseId)
      }
    },
    enrollCourse(state, action) {
      const courseId = action.payload
      if (!state.enrolledCourses.includes(courseId)) {
        state.enrolledCourses.push(courseId)
      }
    },
    markNotificationRead(state, action) {
      state.notifications = state.notifications.map((notification) =>
        notification.id === action.payload ? { ...notification, read: true } : notification,
      )
    },
    setTheme(state, action) {
      state.theme = action.payload
    },
  },
})

export const { login, logout, toggleWishlist, enrollCourse, markNotificationRead, setTheme } = authSlice.actions
export default authSlice.reducer
