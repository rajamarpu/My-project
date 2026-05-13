import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api.js'

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials)
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token)
        return {
          user: response.data.user,
          role: response.data.user.role,
          token: response.data.token,
        }
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  },
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData)
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token)
        return {
          user: response.data.user,
          role: response.data.user.role,
          token: response.data.token,
        }
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  },
)

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(email)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP')
    }
  },
)

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOTP(payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed')
    }
  },
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword(payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Password reset failed')
    }
  },
)

const initialState = {
  user: null,
  role: null,
  token: localStorage.getItem('authToken') || null,
  loading: false,
  error: null,
  success: false,
  wishlist: [],
  enrolledCourses: [],
  notifications: [],
  otpEmail: null,
  resetToken: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.role = null
      state.token = null
      state.wishlist = []
      state.enrolledCourses = []
      localStorage.removeItem('authToken')
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
    clearError(state) {
      state.error = null
    },
    clearSuccess(state) {
      state.success = false
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.role = action.payload.role
        state.token = action.payload.token
        state.success = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.role = action.payload.role
        state.token = action.payload.token
        state.success = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false
        state.success = true
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Verify OTP
    builder
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.loading = false
        state.resetToken = action.payload.resetToken
        state.success = true
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false
        state.resetToken = null
        state.success = true
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, toggleWishlist, enrollCourse, clearError, clearSuccess } = authSlice.actions
export default authSlice.reducer
