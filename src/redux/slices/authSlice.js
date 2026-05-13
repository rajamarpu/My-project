import { createSlice } from '@reduxjs/toolkit'
import { celebrityCourses } from '../../data/dummyData.js'

const initialState = {
  user: null,
  role: null,
  theme: 'dark',
  wishlist: [],
  enrolledCourses: celebrityCourses.slice(0, 2).map((course) => course.id),
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
    },
    logout(state) {
      state.user = null
      state.role = null
      state.wishlist = []
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
