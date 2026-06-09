import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('lms-user') || window.sessionStorage.getItem('lms-user') || 'null') : null,
  role: typeof window !== 'undefined' ? window.localStorage.getItem('lms-role') || window.sessionStorage.getItem('lms-role') : null,
  token: typeof window !== 'undefined' ? window.localStorage.getItem('lms-token') || window.sessionStorage.getItem('lms-token') : null,
  theme: 'dark',
  wishlist: [],
  enrolledCourses: [],
  notifications: [],
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
        const storage = action.payload.rememberMe === false ? window.sessionStorage : window.localStorage
        const otherStorage = action.payload.rememberMe === false ? window.localStorage : window.sessionStorage
        otherStorage.removeItem('lms-user')
        otherStorage.removeItem('lms-role')
        otherStorage.removeItem('lms-token')
        storage.setItem('lms-user', JSON.stringify(action.payload.user))
        storage.setItem('lms-role', action.payload.role)
        window.localStorage.setItem('lms-last-online', new Date().toLocaleString())
        if (action.payload.token) storage.setItem('lms-token', action.payload.token)
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
        window.sessionStorage.removeItem('lms-user')
        window.sessionStorage.removeItem('lms-role')
        window.sessionStorage.removeItem('lms-token')
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
    unenrollCourse(state, action) {
      const courseId = action.payload
      state.enrolledCourses = state.enrolledCourses.filter((id) => id !== courseId)
    },
    markNotificationRead(state, action) {
      state.notifications = state.notifications.map((notification) =>
        notification.id === action.payload ? { ...notification, read: true } : notification,
      )
    },
    updateCurrentUser(state, action) {
      state.user = { ...(state.user || {}), ...(action.payload || {}) }
      if (typeof window !== 'undefined') {
        const payload = JSON.stringify(state.user)
        if (window.localStorage.getItem('lms-user')) window.localStorage.setItem('lms-user', payload)
        if (window.sessionStorage.getItem('lms-user')) window.sessionStorage.setItem('lms-user', payload)
      }
    },
    setTheme(state, action) {
      state.theme = action.payload
    },
  },
})

export const { login, logout, toggleWishlist, enrollCourse, unenrollCourse, markNotificationRead, updateCurrentUser, setTheme } = authSlice.actions
export default authSlice.reducer

