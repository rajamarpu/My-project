/**
 * CELEBRITY ACADEMY - BACKEND SERVER
 * Production-grade Node.js/Express backend
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'mongo-sanitize'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

dotenv.config()

// SECURITY MIDDLEWARE
const app = express()

// Helmet for security headers
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Data sanitization
app.use(mongoSanitize())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit login attempts
  skipSuccessfulRequests: true,
})

app.use('/api/', limiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/forgot-password', authLimiter)

// ============================================
// IN-MEMORY DATABASE (FOR DEVELOPMENT)
// ============================================
// In production, replace with MongoDB Atlas connection

const inMemoryDB = {
  users: [
    {
      id: '1',
      email: 'student@example.com',
      username: 'student_user',
      password: await bcrypt.hash('password123', 10),
      role: 'learner',
      fullName: 'Student User',
      avatar: null,
      phone: '',
      bio: '',
      createdAt: new Date(),
      profile: {
        rollNumber: 'ROLL001',
        branch: 'Computer Science',
        education: 'B.Tech',
      },
    },
    {
      id: '2',
      email: 'instructor@example.com',
      username: 'instructor_user',
      password: await bcrypt.hash('password123', 10),
      role: 'instructor',
      fullName: 'Instructor User',
      avatar: null,
      phone: '',
      bio: 'Expert instructor',
      createdAt: new Date(),
    },
    {
      id: '3',
      email: 'admin@example.com',
      username: 'admin_user',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
      fullName: 'Admin User',
      avatar: null,
      phone: '',
      bio: 'Platform admin',
      createdAt: new Date(),
    },
  ],
  courses: [
    {
      id: '1',
      title: 'React Mastery',
      description: 'Learn React from scratch to advanced',
      instructor: '2',
      category: 'Programming',
      level: 'Beginner',
      thumbnail: '',
      duration: 40,
      studentsEnrolled: [],
      modules: [],
      status: 'published',
      createdAt: new Date(),
    },
  ],
  enrollments: [],
  progress: [],
  otps: [],
  notifications: [],
}

// ============================================
// UTILITIES
// ============================================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

const generateJWT = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' },
  )
}

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
  } catch {
    return null
  }
}

const sendEmail = async (email, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

// ============================================
// MIDDLEWARE
// ============================================

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const decoded = verifyJWT(token)
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }

  req.user = decoded
  next()
}

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }
    next()
  }
}

// ============================================
// AUTH ROUTES
// ============================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, fullName, role = 'learner' } = req.body

    // Validate input
    if (!email || !password || !username || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      })
    }

    // Check if user exists
    if (inMemoryDB.users.find((u) => u.email === email)) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const newUser = {
      id: Date.now().toString(),
      email,
      username,
      password: hashedPassword,
      role,
      fullName,
      avatar: null,
      phone: '',
      bio: '',
      createdAt: new Date(),
    }

    inMemoryDB.users.push(newUser)

    const token = generateJWT(newUser.id, role)

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
      })
    }

    const user = inMemoryDB.users.find((u) => u.email === email)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const token = generateJWT(user.id, user.role)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// Forgot Password - Send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    const user = inMemoryDB.users.find((u) => u.email === email)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Generate OTP
    const otp = generateOTP()
    const hashedOTP = hashOTP(otp)

    // Store OTP with expiration
    inMemoryDB.otps.push({
      email,
      otp: hashedOTP,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0,
    })

    // Send email with OTP
    const emailSent = await sendEmail(
      email,
      'Celebrity Academy - Password Reset OTP',
      `
        <div style="font-family: Arial; max-width: 500px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #00d4ff; text-align: center; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    )

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email',
      })
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body

    const hashedOTP = hashOTP(otp)
    const otpRecord = inMemoryDB.otps.find((o) => o.email === email && o.otp === hashedOTP)

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      })
    }

    if (Date.now() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired',
      })
    }

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many attempts',
      })
    }

    // Remove OTP
    inMemoryDB.otps = inMemoryDB.otps.filter((o) => o.email !== email)

    res.json({
      success: true,
      message: 'OTP verified',
      resetToken: jwt.sign({ email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '15m' }),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    const decoded = verifyJWT(resetToken)
    if (!decoded || !decoded.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token',
      })
    }

    const user = inMemoryDB.users.find((u) => u.email === decoded.email)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    user.password = await bcrypt.hash(newPassword, 10)

    res.json({
      success: true,
      message: 'Password reset successful',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// ============================================
// COURSE ROUTES
// ============================================

// Get All Courses
app.get('/api/courses', (req, res) => {
  res.json({
    success: true,
    courses: inMemoryDB.courses,
  })
})

// Get Course by ID
app.get('/api/courses/:courseId', (req, res) => {
  const course = inMemoryDB.courses.find((c) => c.id === req.params.courseId)
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' })
  }

  res.json({
    success: true,
    course,
  })
})

// Create Course (Instructor/Admin only)
app.post('/api/courses', authenticate, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const { title, description, category, level } = req.body

    const newCourse = {
      id: Date.now().toString(),
      title,
      description,
      category,
      level,
      instructor: req.user.userId,
      thumbnail: '',
      duration: 0,
      studentsEnrolled: [],
      modules: [],
      status: 'draft',
      createdAt: new Date(),
    }

    inMemoryDB.courses.push(newCourse)

    res.status(201).json({
      success: true,
      message: 'Course created',
      course: newCourse,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// ============================================
// USER ROUTES
// ============================================

// Get Current User
app.get('/api/users/me', authenticate, (req, res) => {
  const user = inMemoryDB.users.find((u) => u.id === req.user.userId)
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' })
  }

  const { password, ...userWithoutPassword } = user
  res.json({
    success: true,
    user: userWithoutPassword,
  })
})

// Update Profile
app.put('/api/users/profile', authenticate, async (req, res) => {
  try {
    const { fullName, phone, bio, avatar } = req.body
    const user = inMemoryDB.users.find((u) => u.id === req.user.userId)

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.fullName = fullName || user.fullName
    user.phone = phone || user.phone
    user.bio = bio || user.bio
    user.avatar = avatar || user.avatar

    const { password, ...userWithoutPassword } = user
    res.json({
      success: true,
      message: 'Profile updated',
      user: userWithoutPassword,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// ============================================
// ENROLLMENT ROUTES
// ============================================

// Enroll in Course
app.post('/api/enrollments/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params
    const course = inMemoryDB.courses.find((c) => c.id === courseId)

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' })
    }

    const enrollment = {
      id: Date.now().toString(),
      userId: req.user.userId,
      courseId,
      enrolledAt: new Date(),
      progress: 0,
    }

    inMemoryDB.enrollments.push(enrollment)
    course.studentsEnrolled.push(req.user.userId)

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      enrollment,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message })
  }
})

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Backend is running' })
})

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
  console.log(`✅ Celebrity Academy Backend running on http://localhost:${PORT}`)
})

export default app
