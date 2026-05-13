import { createServer } from 'node:http'
import { existsSync, readFileSync, writeFileSync, createReadStream, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const PORT = 4000

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const DB_FILE = new URL('./database.json', import.meta.url)
const DIST_DIR = new URL('./dist', import.meta.url)

const distPath = decodeURIComponent(DIST_DIR.pathname)

const getContentType = (ext) => {
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  }
  return types[ext] || 'text/plain'
}

const initialDb = {
  users: [
    { username: 'mylogindetails', password: 'mypassword', role: 'admin', profile: null },
  ],
  attendanceRecords: [],
}

let db = { ...initialDb }

const saveDatabase = () => {
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
  } catch (error) {
    db = { ...initialDb }
    saveDatabase()
  }
}

loadDatabase()

const sendJson = (res, payload, status = 200) => {
  res.writeHead(status, { ...defaultHeaders, 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

const server = createServer((req, res) => {
  const { method, url } = req

  if (method === 'OPTIONS') {
    res.writeHead(204, defaultHeaders)
    res.end()
    return
  }

  if (url === '/api/login' && method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}')
        const { username, password, captcha } = data

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

        return sendJson(res, { success: true, username: user.username, role: user.role, profile: user.profile || null })
      } catch (error) {
        return sendJson(res, { success: false, message: 'Invalid request body.' }, 400)
      }
    })
    return
  }

  if (url === '/api/register' && method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}')
        const { username, password } = data
        if (!username || !password) {
          return sendJson(res, { success: false, message: 'Both username and password are required.' }, 400)
        }

        if (db.users.length >= 500) {
          return sendJson(res, { success: false, message: 'Registration limit reached. Cannot store more users.' }, 400)
        }

        const exists = db.users.some((item) => item.username === username)
        if (exists) {
          return sendJson(res, { success: false, message: 'This username is already taken.' }, 409)
        }

        db.users.push({ username, password, role: 'user', profile: null })
        saveDatabase()
        return sendJson(res, { success: true, message: 'Registration successful.' })
      } catch (error) {
        return sendJson(res, { success: false, message: 'Invalid request body.' }, 400)
      }
    })
    return
  }

  if (url === '/api/profile/save' && method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}')
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
      } catch (error) {
        return sendJson(res, { success: false, message: 'Invalid request body.' }, 400)
      }
    })
    return
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
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}')
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
      } catch (error) {
        return sendJson(res, { success: false, message: 'Invalid request body.' }, 400)
      }
    })
    return
  }

  if (url === '/api/admin/manual-attendance' && method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}')
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
      } catch (error) {
        return sendJson(res, { success: false, message: 'Invalid request body.' }, 400)
      }
    })
    return
  }

  if (url === '/api/users' && method === 'GET') {
    return sendJson(res, { success: true, users: db.users.map((item) => ({ username: item.username, role: item.role })) })
  }

  if (url.startsWith('/api/attendance/list') && method === 'GET') {
    const query = new URL(req.url, `http://${req.headers.host}`).searchParams
    const username = query.get('username')
    const filteredRecords = username
      ? db.attendanceRecords.filter((item) => item.username === username)
      : db.attendanceRecords
    return sendJson(res, { success: true, attendance: filteredRecords })
  }

  // Serve static files for non-API routes
  if (!url.startsWith('/api')) {
    let filePath = join(distPath, url === '/' ? 'index.html' : url)
    if (filePath.startsWith('/') || filePath.startsWith('\\')) {
      filePath = filePath.slice(1)
    }
    try {
      const stat = statSync(filePath)
      if (stat.isFile()) {
        const ext = extname(filePath)
        const contentType = getContentType(ext)
        res.writeHead(200, { 'Content-Type': contentType })
        createReadStream(filePath).pipe(res)
        return
      }
    } catch (error) {
      // File not found, serve index.html for SPA routing
      let indexPath = join(distPath, 'index.html')
      if (indexPath.startsWith('/') || indexPath.startsWith('\\')) {
        indexPath = indexPath.slice(1)
      }
      if (existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        createReadStream(indexPath).pipe(res)
        return
      }
    }
  }

  return sendJson(res, { success: false, message: 'Route not found.' }, 404)
})

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`)
})
