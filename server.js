import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

/* global process */

const PORT = Number(process.env.PORT || 4000)
const DB_PATH = process.env.DB_PATH

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const DB_FILE = DB_PATH ? new URL(`file://${DB_PATH}`) : new URL('./database.json', import.meta.url)

const initialDb = {
  users: [
    { username: 'mylogindetails', password: 'mypassword', role: 'admin', approved: true, profile: null },
    { username: 'learner@example.com', password: 'password123', role: 'learner', approved: true, profile: null },
    { username: 'instructor@example.com', password: 'password123', role: 'instructor', approved: true, profile: null },
  ],
  attendanceRecords: [],
  courses: [],
  learningContent: [],
  tasks: [],
  assessments: [],
  assessmentSubmissions: [],
}

let db = { ...initialDb }

const saveDatabase = () => {
  if (DB_PATH) {
    mkdirSync(new URL('.', DB_FILE), { recursive: true })
  }
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
}

const loadDatabase = () => {
  try {
    if (existsSync(DB_FILE)) {
      const fileContent = readFileSync(DB_FILE, 'utf-8')
      db = JSON.parse(fileContent)
    } else {
      saveDatabase()
    }
  } catch {
    db = { ...initialDb }
    saveDatabase()
  }
}

loadDatabase()

// OTP storage for password reset (in-memory, keyed by email)
const otpStore = new Map()

// Ensure older database files get the new fields
const normalizeDb = () => {
  if (!db?.users) db.users = []
  if (!db?.attendanceRecords) db.attendanceRecords = []
  if (!db?.courses) db.courses = []
  if (!db?.learningContent) db.learningContent = []
  if (!db?.tasks) db.tasks = []
  if (!db?.assessments) db.assessments = []
  if (!db?.assessmentSubmissions) db.assessmentSubmissions = []

  db.users = db.users.map((u) => ({
    ...u,
    role: u.role === 'user' ? 'learner' : u.role,
    approved: typeof u.approved === 'boolean' ? u.approved : true,
    profile: u.profile ?? null,
    email: u.email ?? '',
  }))

  initialDb.users.forEach((seedUser) => {
    if (!db.users.some((u) => u.username === seedUser.username)) {
      db.users.push({ ...seedUser, email: '' })
    }
  })

  saveDatabase()
}

normalizeDb()

const sendJson = (res, payload, status = 200) => {
  res.writeHead(status, { ...defaultHeaders, 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

const readJsonBody = async (req) => {
  let body = ''
  for await (const chunk of req) body += chunk
  return JSON.parse(body || '{}')
}

const server = createServer(async (req, res) => {
  try {
    const { method, url } = req

    if (method === 'OPTIONS') {
      res.writeHead(204, defaultHeaders)
      res.end()
      return
    }

    if (url === '/api/login' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, password, captcha, role } = data

      if (!username || !password) {
        return sendJson(res, { success: false, message: 'Username and password are required.' }, 400)
      }
      if (!captcha) {
        return sendJson(res, { success: false, message: 'Please confirm you are not a robot.' }, 400)
      }

      const user = db.users.find((item) => item.username === username)
      if (!user || user.password !== password) {
        return sendJson(res, { success: false, message: 'Invalid username or password.' }, 401)
      }

      if (role && role !== 'user' && user.role !== role) {
        return sendJson(res, { success: false, message: `This account is registered as ${user.role}.` }, 403)
      }

      if (!user.approved) {
        return sendJson(res, { success: false, message: 'Login pending approval by admin.' }, 403)
      }

      return sendJson(res, {
        success: true,
        username: user.username,
        role: user.role,
        profile: user.profile || null,
      })
    }

if (url === '/api/register' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, password, email = '', role = 'learner' } = data

      if (!username || !password) {
        return sendJson(res, { success: false, message: 'Both username and password are required.' }, 400)
      }

      if (!['learner', 'instructor'].includes(role)) {
        return sendJson(res, { success: false, message: 'Only learner and instructor registration are allowed here.' }, 400)
      }

      if (db.users.length >= 500) {
        return sendJson(res, { success: false, message: 'Registration limit reached. Cannot store more users.' }, 400)
      }

      const exists = db.users.some((item) => item.username === username)
      if (exists) {
        return sendJson(res, { success: false, message: 'This username is already taken.' }, 409)
      }

      db.users.push({ username, password, email, role, approved: role === 'learner', profile: null })
      saveDatabase()
      return sendJson(res, {
        success: true,
        message: role === 'learner' ? 'Registration successful. You can login now.' : 'Registration successful. Awaiting admin approval.',
      })
    }

    if (url === '/api/courses' && method === 'GET') {
      return sendJson(res, { success: true, courses: db.courses })
    }

    if (url.startsWith('/api/courses/') && method === 'GET') {
      const courseId = decodeURIComponent(url.split('/').pop())
      const course = db.courses.find((item) => item.id === courseId)
      if (!course) {
        return sendJson(res, { success: false, message: 'Course not found.' }, 404)
      }
      return sendJson(res, { success: true, course })
    }

    if (url === '/api/courses/create' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, title, description, category, level, duration, price, videoUrl, resourceUrl } = data
      const user = db.users.find((item) => item.username === username)

      if (!user || !['instructor', 'admin'].includes(user.role)) {
        return sendJson(res, { success: false, message: 'Only instructors and admins can create courses.' }, 403)
      }
      if (!title || !description) {
        return sendJson(res, { success: false, message: 'Course title and description are required.' }, 400)
      }

      const course = {
        id: `course-${Date.now()}`,
        title,
        description,
        category: category || 'General',
        level: level || 'Beginner',
        duration: duration || 'Self paced',
        price: price || 'Free',
        instructor: username,
        videoUrl: videoUrl || null,
        resourceUrl: resourceUrl || null,
        status: user.role === 'admin' ? 'published' : 'pending-review',
        createdAt: new Date().toISOString(),
      }

      db.courses.unshift(course)
      saveDatabase()
      return sendJson(res, { success: true, course })
    }

    if (url === '/api/content/upload' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, courseId, title, type, videoUrl, body, fileName } = data
      const user = db.users.find((item) => item.username === username)

      if (!user || !['instructor', 'admin'].includes(user.role)) {
        return sendJson(res, { success: false, message: 'Only instructors and admins can upload content.' }, 403)
      }
      if (!title || !type) {
        return sendJson(res, { success: false, message: 'Content title and type are required.' }, 400)
      }

      const content = {
        id: `content-${Date.now()}`,
        username,
        courseId: courseId || null,
        title,
        type,
        videoUrl: videoUrl || null,
        body: body || '',
        fileName: fileName || null,
        createdAt: new Date().toISOString(),
      }

      db.learningContent.unshift(content)
      saveDatabase()
      return sendJson(res, { success: true, content })
    }

    if (url === '/api/tasks/create' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, courseId, title, instructions, dueDate } = data
      const user = db.users.find((item) => item.username === username)

      if (!user || !['instructor', 'admin'].includes(user.role)) {
        return sendJson(res, { success: false, message: 'Only instructors and admins can create tasks.' }, 403)
      }
      if (!title || !instructions) {
        return sendJson(res, { success: false, message: 'Task title and instructions are required.' }, 400)
      }

      const task = {
        id: `task-${Date.now()}`,
        username,
        courseId: courseId || null,
        title,
        instructions,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
      }

      db.tasks.unshift(task)
      saveDatabase()
      return sendJson(res, { success: true, task })
    }

    if (url === '/api/content' && method === 'GET') {
      return sendJson(res, { success: true, content: db.learningContent, tasks: db.tasks })
    }

    if (url === '/api/admin/users/pending' && method === 'GET') {
      const adminUsername = new URL(req.url, `http://${req.headers.host}`).searchParams.get('adminUsername')
      if (!adminUsername || adminUsername !== 'mylogindetails') {
        return sendJson(res, { success: false, message: 'Permission denied.' }, 403)
      }

      const pendingUsers = db.users
        .filter((u) => !u.approved)
        .map((u) => ({ username: u.username, role: u.role }))

      return sendJson(res, { success: true, users: pendingUsers })
    }

    if (url === '/api/admin/users/approve' && method === 'POST') {
      const data = await readJsonBody(req)
      const { adminUsername, username } = data

      if (!adminUsername || adminUsername !== 'mylogindetails') {
        return sendJson(res, { success: false, message: 'Permission denied.' }, 403)
      }
      if (!username) {
        return sendJson(res, { success: false, message: 'Username is required.' }, 400)
      }

      const user = db.users.find((u) => u.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      user.approved = true
      saveDatabase()

      return sendJson(res, { success: true, message: 'User approved.' })
    }

    // ===== Phase 4: Assessments =====

    // Instructor assigns assessment(s) for a course.
    // Body: { instructorUsername, courseId, title, prompt, dueDate? }
    if (url === '/api/assessments/assign' && method === 'POST') {
      const data = await readJsonBody(req)
      const { instructorUsername, courseId, title, prompt, dueDate } = data

      if (!instructorUsername || !courseId || !title || !prompt) {
        return sendJson(res, { success: false, message: 'instructorUsername, courseId, title, and prompt are required.' }, 400)
      }

      const instructor = db.users.find((u) => u.username === instructorUsername)
      if (!instructor || (instructor.role !== 'instructor' && instructor.role !== 'admin')) {
        return sendJson(res, { success: false, message: 'Only instructors (or admin) can assign assessments.' }, 403)
      }

      const assessment = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        instructorUsername,
        courseId,
        title,
        prompt,
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
      }

      db.assessments.unshift(assessment)
      saveDatabase()

      return sendJson(res, { success: true, assessment })
    }

    // Learner fetch assigned assessments for a course
    if (url === '/api/assessments/assigned' && method === 'GET') {
      const query = new URL(req.url, `http://${req.headers.host}`).searchParams
      const courseId = query.get('courseId')
      const username = query.get('username') // not strictly used; later we can tie to enrollments

      if (!courseId) {
        return sendJson(res, { success: false, message: 'courseId is required.' }, 400)
      }

      const assigned = db.assessments.filter((a) => a.courseId === courseId).slice(0, 50)
      const submissionsByAssessment = username
        ? db.assessmentSubmissions
            .filter((s) => s.courseId === courseId && s.username === username)
            .reduce((acc, s) => {
              acc[s.assessmentId] = s
              return acc
            }, {})
        : {}

      const payload = assigned.map((a) => ({
        ...a,
        submission: submissionsByAssessment[a.id] || null,
      }))

      return sendJson(res, { success: true, items: payload })
    }

    // Submit assessment
    // Body: { username, courseId, assessmentId, answerText, noteFileName?, fileData? (optional) }
    if (url === '/api/assessments/submit' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, courseId, assessmentId, answerText, noteFileName, fileData } = data

      if (!username || !courseId || !assessmentId || !answerText) {
        return sendJson(res, { success: false, message: 'username, courseId, assessmentId, and answerText are required.' }, 400)
      }

      const user = db.users.find((u) => u.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      if (!db.assessments.some((a) => a.id === assessmentId && a.courseId === courseId)) {
        return sendJson(res, { success: false, message: 'Assessment not found for this course.' }, 404)
      }

      const submission = {
        id: `${Date.now()}-${username}-${assessmentId}`,
        username,
        courseId,
        assessmentId,
        answerText,
        noteFileName: noteFileName || null,
        fileData: fileData || null,
        submittedAt: new Date().toISOString(),
      }

      // Upsert behavior: replace previous submission for same (username, courseId, assessmentId)
      db.assessmentSubmissions = db.assessmentSubmissions.filter(
        (s) => !(s.username === username && s.courseId === courseId && s.assessmentId === assessmentId),
      )
      db.assessmentSubmissions.unshift(submission)
      saveDatabase()

      return sendJson(res, { success: true, submission })
    }

    // Instructor views submissions for a course
    if (url === '/api/assessments/submissions/all' && method === 'GET') {
      const query = new URL(req.url, `http://${req.headers.host}`).searchParams
      const instructorUsername = query.get('instructorUsername')
      const courseId = query.get('courseId')

      if (!instructorUsername || !courseId) {
        return sendJson(res, { success: false, message: 'instructorUsername and courseId are required.' }, 400)
      }

      const instructor = db.users.find((u) => u.username === instructorUsername)
      if (!instructor || (instructor.role !== 'instructor' && instructor.role !== 'admin')) {
        return sendJson(res, { success: false, message: 'Only instructors (or admin) can view submissions.' }, 403)
      }

      const assessments = db.assessments.filter((a) => a.courseId === courseId && a.instructorUsername === instructorUsername)
      const assessmentIds = new Set(assessments.map((a) => a.id))

      const submissions = db.assessmentSubmissions
        .filter((s) => s.courseId === courseId && assessmentIds.has(s.assessmentId))
        .slice(0, 200)

      return sendJson(res, { success: true, submissions })
    }

    // default routes (existing)

    if (url === '/api/profile/save' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, rollNumber, branch, education } = data
      if (!username || !rollNumber || !branch || !education) {
        return sendJson(res, { success: false, message: 'Username, roll number, branch, and education are required.' }, 400)
      }

      const user = db.users.find((item) => item.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      user.profile = { rollNumber, branch, education }
      saveDatabase()
      return sendJson(res, { success: true, message: 'Profile saved.' })
    }

    if (url.startsWith('/api/profile') && method === 'GET') {
      const query = new URL(req.url, `http://${req.headers.host}`).searchParams
      const username = query.get('username')
      if (!username) {
        return sendJson(res, { success: false, message: 'Username is required.' }, 400)
      }

      const user = db.users.find((item) => item.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      return sendJson(res, { success: true, profile: user.profile || null })
    }

    if (url.startsWith('/api/attendance') && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, imageData } = data
      if (!username) {
        return sendJson(res, { success: false, message: 'Username is required.' }, 400)
      }

      const user = db.users.find((item) => item.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      db.attendanceRecords.unshift({
        id: `${Date.now()}-${username}`,
        username,
        method: 'Face scan',
        time: new Date().toISOString(),
        note: 'Face scan attendance',
        imageData: imageData || null,
      })
      saveDatabase()
      return sendJson(res, { success: true, message: 'Attendance recorded.' })
    }

    if (url === '/api/admin/manual-attendance' && method === 'POST') {
      const data = await readJsonBody(req)
      const { adminUsername, username, note } = data
      if (!adminUsername || adminUsername !== 'mylogindetails') {
        return sendJson(res, { success: false, message: 'Permission denied.' }, 403)
      }
      if (!username) {
        return sendJson(res, { success: false, message: 'Username is required.' }, 400)
      }
      const user = db.users.find((item) => item.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      db.attendanceRecords.unshift({
        id: `${Date.now()}-${username}`,
        username,
        method: 'Manual',
        time: new Date().toISOString(),
        note: note || 'Admin posted attendance',
      })
      saveDatabase()
      return sendJson(res, { success: true, message: 'Manual attendance posted.' })
    }

    if (url === '/api/users' && method === 'GET') {
      return sendJson(res, { success: true, users: db.users.map((item) => ({ username: item.username, role: item.role, approved: item.approved })) })
    }

    if (url.startsWith('/api/attendance/list') && method === 'GET') {
      const query = new URL(req.url, `http://${req.headers.host}`).searchParams
      const username = query.get('username')
      const filteredRecords = username ? db.attendanceRecords.filter((item) => item.username === username) : db.attendanceRecords
      return sendJson(res, { success: true, attendance: filteredRecords })
    }

    // ===== Phase 2: Google Login =====
    if (url === '/api/auth/google' && method === 'POST') {
      const data = await readJsonBody(req)
      const { idToken, role } = data

      if (!idToken) {
        return sendJson(res, { success: false, message: 'Google ID token is required.' }, 400)
      }

      // Simulated Google user verification (in production, verify with Google API)
      // For demo, accept any email format as valid Google auth
      const emailMatch = idToken.match(/email:(\S+)/)
      if (!emailMatch) {
        return sendJson(res, { success: false, message: 'Invalid Google token format.' }, 400)
      }
      const email = emailMatch[1]

      let user = db.users.find((u) => u.email === email)
      if (!user) {
        // Auto-create user for Google signup
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4)
        user = { username, password: '', email, role: role || 'learner', approved: true, profile: null }
        db.users.push(user)
        saveDatabase()
      }

      if (!user.approved) {
        return sendJson(res, { success: false, message: 'Account pending approval.' }, 403)
      }

      return sendJson(res, {
        success: true,
        username: user.username,
        role: user.role,
        profile: user.profile || null,
      })
    }

    // ===== OTP Login - Send OTP =====
    if (url === '/api/auth/otp/send' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username } = data

      if (!username) {
        return sendJson(res, { success: false, message: 'Username is required.' }, 400)
      }

      const user = db.users.find((u) => u.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      otpStore.set(username, { otp, expires: Date.now() + 5 * 60 * 1000 })

      return sendJson(res, {
        success: true,
        message: 'OTP sent successfully.',
        devOtp: otp,
      })
    }

    // ===== OTP Login - Verify OTP =====
    if (url === '/api/auth/otp/verify' && method === 'POST') {
      const data = await readJsonBody(req)
      const { username, otp } = data

      if (!username || !otp) {
        return sendJson(res, { success: false, message: 'Username and OTP are required.' }, 400)
      }

      const stored = otpStore.get(username)
      if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        return sendJson(res, { success: false, message: 'Invalid or expired OTP.' }, 400)
      }

      const user = db.users.find((u) => u.username === username)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      if (!user.approved) {
        return sendJson(res, { success: false, message: 'Account pending approval.' }, 403)
      }

      otpStore.delete(username)

      return sendJson(res, {
        success: true,
        username: user.username,
        role: user.role,
        profile: user.profile || null,
      })
    }

    // ===== Forgot Password - Send OTP =====
    if (url === '/api/auth/password/forgot' && method === 'POST') {
      const data = await readJsonBody(req)
      const { email } = data

      if (!email) {
        return sendJson(res, { success: false, message: 'Email is required.' }, 400)
      }

      const user = db.users.find((u) => u.email === email)
      if (!user) {
        return sendJson(res, { success: true, message: 'If email exists, OTP has been sent.' })
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      otpStore.set(`pwd:${email}`, { otp, expires: Date.now() + 10 * 60 * 1000, username: user.username })

      return sendJson(res, {
        success: true,
        message: 'If email exists, OTP has been sent.',
        devOtp: otp,
      })
    }

    // ===== Reset Password with OTP =====
    if (url === '/api/auth/password/reset' && method === 'POST') {
      const data = await readJsonBody(req)
      const { email, otp, newPassword } = data

      if (!email || !otp || !newPassword) {
        return sendJson(res, { success: false, message: 'Email, OTP, and new password are required.' }, 400)
      }

      const stored = otpStore.get(`pwd:${email}`)
      if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
        return sendJson(res, { success: false, message: 'Invalid or expired OTP.' }, 400)
      }

      const user = db.users.find((u) => u.email === email)
      if (!user) {
        return sendJson(res, { success: false, message: 'User not found.' }, 404)
      }

      user.password = newPassword
      otpStore.delete(`pwd:${email}`)
      saveDatabase()

      return sendJson(res, { success: true, message: 'Password reset successfully. You can now login.' })
    }

    return sendJson(res, { success: false, message: 'Route not found.' }, 404)
  } catch {
    return sendJson(res, { success: false, message: 'Invalid request body.' }, 400)
  }
})

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})
