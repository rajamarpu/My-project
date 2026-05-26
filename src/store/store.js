import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice.js'
import personalityReducer from './slices/personalitySlice.js'

const store = configureStore({
  reducer: {
    auth: authReducer,
    personality: personalityReducer,
  },
})

export default store
