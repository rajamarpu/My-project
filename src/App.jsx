import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState(false)
  const [message, setMessage] = useState('')
  const [loggedUser, setLoggedUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [studentProfile, setStudentProfile] = useState({ rollNumber: '', branch: '', education: '' })
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [cameraError, setCameraError] = useState('')
  const [attRecords, setAttRecords] = useState([])
  const [users, setUsers] = useState([])
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [manualUser, setManualUser] = useState('')
  const [manualNote, setManualNote] = useState('')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (currentPage === 'admin') {
      loadAdminData()
    }
    if (currentPage === 'attendance') {
      loadAttendance()
    }
    return () => {
      stopCamera()
    }
  }, [currentPage])

  const loadAdminData = async () => {
    try {
      const userRes = await fetch('/api/users')
      const attendanceRes = await fetch('/api/attendance/list')
      const userData = await userRes.json()
      const attendanceData = await attendanceRes.json()
      if (userData.success) {
        setUsers(userData.users)
      }
      if (attendanceData.success) {
        setAttRecords(attendanceData.attendance)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const loadAttendance = async () => {
    if (!loggedUser) {
      return
    }
    try {
      const response = await fetch(`/api/attendance/list?username=${encodeURIComponent(loggedUser)}`)
      const data = await response.json()
      if (data.success) {
        setAttRecords(data.attendance)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const loadProfile = async (usernameToLoad) => {
    try {
      const response = await fetch(`/api/profile?username=${encodeURIComponent(usernameToLoad)}`)
      const data = await response.json()
      if (data.success) {
        setStudentProfile(data.profile || { rollNumber: '', branch: '', education: '' })
      }
      setProfileLoaded(true)
    } catch (error) {
      console.error(error)
      setProfileLoaded(true)
    }
  }

  const handleLogin = async () => {
    if (!captcha) {
      setMessage('Please confirm you are not a robot.')
      return
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, captcha }),
      })
      const data = await response.json()

      if (!response.ok) {
        setMessage(data.message || 'Login failed.')
        return
      }

      setLoggedUser(data.username)
      setUserRole(data.role)
      setStudentProfile(data.profile || { rollNumber: '', branch: '', education: '' })
      setProfileLoaded(true)
      setMessage('')
      if (data.role === 'admin') {
        setCurrentPage('admin')
      } else {
        setCurrentPage('attendance')
      }
    } catch (error) {
      setMessage('Unable to connect to the backend. Please try again.')
      console.error(error)
    }
  }

  const handleRegister = async () => {
    if (!newUsername || !newPassword) {
      setMessage('Please enter a username and password.')
      return
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Registration failed.')
        return
      }
      setMessage('Registration successful! You can now log in.')
      setCurrentPage('login')
      setNewUsername('')
      setNewPassword('')
    } catch (error) {
      setMessage('Unable to connect to the backend. Please try again.')
      console.error(error)
    }
  }

  const startCamera = async () => {
    setScanStatus('Starting camera...')
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanActive(true)
      setScanStatus('Camera is active. Position your face and scan.')
    } catch (error) {
      setCameraError('Unable to open camera. Please allow access and try again.')
      setScanStatus('')
      console.error(error)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setScanActive(false)
  }

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    setScanStatus('Scanning face...')

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedUser, imageData }),
      })
      const data = await response.json()
      if (!response.ok) {
        setScanStatus(data.message || 'Attendance scan failed.')
        return
      }
      setScanStatus('Face scan complete. Attendance recorded.')
      loadAttendance()
    } catch (error) {
      setScanStatus('Unable to record attendance. Please try again.')
      console.error(error)
    }
  }

  const grantManualAttendance = async () => {
    if (!manualUser) {
      setMessage('Enter a username to mark attendance manually.')
      return
    }
    try {
      const response = await fetch('/api/admin/manual-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUsername: loggedUser, username: manualUser, note: manualNote || 'Marked by admin' }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Manual attendance failed.')
        return
      }
      setMessage('Manual attendance recorded.')
      setManualUser('')
      setManualNote('')
      loadAdminData()
    } catch (error) {
      setMessage('Unable to submit manual attendance. Please try again.')
      console.error(error)
    }
  }

  const handleSaveProfile = async () => {
    if (!studentProfile.rollNumber || !studentProfile.branch || !studentProfile.education) {
      setMessage('Please fill in roll number, branch, and education details.')
      return
    }

    try {
      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedUser, ...studentProfile }),
      })
      const data = await response.json()
      if (!response.ok) {
        setMessage(data.message || 'Could not save profile details.')
        return
      }
      setMessage('Student details saved. You can now scan your face for attendance.')
      loadAttendance()
    } catch (error) {
      setMessage('Unable to save student details. Please try again.')
      console.error(error)
    }
  }

  const logout = () => {
    stopCamera()
    setLoggedUser(null)
    setUserRole(null)
    setCurrentPage('login')
    setUsername('')
    setPassword('')
    setCaptcha(false)
    setMessage('')
    setScanStatus('')
  }

  const renderLogin = () => (
    <div className="login-page">
      <div className="login-shell">
        <div className="brand-block">
          <div className="brand-mark">NC</div>
          <div className="brand-copy">
            <span>NovaCorp</span>
            <p>Secure workspace access</p>
          </div>
        </div>

        {message && <div className="alert-message">{message}</div>}

        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <div className="form-group captcha">
            <input
              type="checkbox"
              id="captcha"
              checked={captcha}
              onChange={(e) => setCaptcha(e.target.checked)}
            />
            <label htmlFor="captcha">Yes, I am not a robot</label>
          </div>

          <button type="submit" className="login-btn">Login</button>
        </form>

        <div className="bottom-row">
          <button type="button" className="link-btn" onClick={() => { setCurrentPage('register'); setMessage('') }}>Register</button>
        </div>
      </div>
    </div>
  )

  const renderRegister = () => (
    <div className="login-page">
      <div className="login-shell">
        <div className="brand-block">
          <div className="brand-mark">NC</div>
          <div className="brand-copy">
            <span>NovaCorp</span>
            <p>Create your user profile</p>
          </div>
        </div>

        <h1>Register now</h1>
        <p className="page-note">Join the system and scan your face for attendance tracking.</p>

        {message && <div className="alert-message">{message}</div>}

        <div className="form-group">
          <label htmlFor="newUsername">Username</label>
          <input
            type="text"
            id="newUsername"
            placeholder="Choose a username"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="newPassword">Password</label>
          <input
            type="password"
            id="newPassword"
            placeholder="Choose a password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <button type="button" className="login-btn" onClick={handleRegister}>Create account</button>

        <div className="bottom-row">
          <p>Already have access?</p>
          <button type="button" className="link-btn" onClick={() => { setCurrentPage('login'); setMessage('') }}>Back to login</button>
        </div>
      </div>
    </div>
  )

  const renderAttendance = () => {
    const profileComplete = studentProfile.rollNumber && studentProfile.branch && studentProfile.education

    return (
      <div className="app-shell">
        <header className="dashboard-header">
          <div>
            <p className="section-badge">Face Attendance</p>
            <h1>Hi, {loggedUser}</h1>
            <p className="subtext">Fill student details first, then use the face scanner to mark attendance.</p>
          </div>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </header>

        {!profileComplete ? (
          <section className="attendance-shell">
            <div className="attendance-card">
              <h2>Student details</h2>
              <p className="small-text">Enter your roll number, branch, and education details first.</p>
              {message && <div className="alert-message">{message}</div>}
              <div className="form-group">
                <label htmlFor="rollNumber">Roll number</label>
                <input
                  type="text"
                  id="rollNumber"
                  value={studentProfile.rollNumber}
                  onChange={(e) => setStudentProfile({ ...studentProfile, rollNumber: e.target.value })}
                  placeholder="Enter your roll number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="branch">Branch</label>
                <select
                  id="branch"
                  value={studentProfile.branch}
                  onChange={(e) => setStudentProfile({ ...studentProfile, branch: e.target.value })}
                >
                  <option value="">Select branch</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="MECH">MECH</option>
                  <option value="EEE">EEE</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="education">Education</label>
                <input
                  type="text"
                  id="education"
                  value={studentProfile.education}
                  onChange={(e) => setStudentProfile({ ...studentProfile, education: e.target.value })}
                  placeholder="e.g. B.Tech, Diploma, First year"
                />
              </div>
              <button className="login-btn" onClick={handleSaveProfile}>Save student details</button>
            </div>
          </section>
        ) : (
          <section className="attendance-shell">
            <div className="attendance-card">
              <h2>Face scanner</h2>
              <p className="small-text">Scan your face to mark attendance. We simulate recognition with a camera capture.</p>
              {cameraError && <div className="alert-message">{cameraError}</div>}
              <div className="video-wrapper">
                <video ref={videoRef} className="camera-view" muted playsInline />
                <canvas ref={canvasRef} className="hidden-canvas" />
              </div>
              <div className="scan-controls">
                {!scanActive && <button className="action-btn" onClick={startCamera}>Start camera</button>}
                {scanActive && <button className="action-btn" onClick={captureFace}>Scan face</button>}
                {scanActive && <button className="secondary-btn" onClick={stopCamera}>Stop camera</button>}
              </div>
              {scanStatus && <p className="status-text">{scanStatus}</p>}
            </div>

            <div className="attendance-card attendance-log-card">
              <h2>Attendance history</h2>
              {attRecords.length === 0 ? (
                <p className="small-text">No attendance has been recorded yet.</p>
              ) : (
                <div className="attendance-table">
                  <div className="table-row header-row">
                    <span>User</span>
                    <span>Method</span>
                    <span>Time</span>
                  </div>
                  {attRecords.map((item) => (
                    <div key={item.id} className="table-row">
                      <span>{item.username}</span>
                      <span>{item.method}</span>
                      <span>{new Date(item.time).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="footer-row">
          <button className="link-btn" onClick={() => setCurrentPage('login')}>Back to login</button>
        </div>
      </div>
    )
  }

  const renderAdmin = () => (
    <div className="app-shell">
      <header className="dashboard-header">
        <div>
          <p className="section-badge">Admin portal</p>
          <h1>Administrator Dashboard</h1>
          <p className="subtext">Manage users and mark manual attendance.</p>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </header>

      <section className="summary-grid">
        <div className="summary-card">
          <span className="card-title">Users</span>
          <strong>{users.length}</strong>
        </div>
        <div className="summary-card">
          <span className="card-title">Attendance records</span>
          <strong>{attRecords.length}</strong>
        </div>
        <div className="summary-card">
          <span className="card-title">Latest scan</span>
          <strong>{attRecords[0] ? new Date(attRecords[0].time).toLocaleTimeString() : '—'}</strong>
        </div>
      </section>

      <section className="admin-grid">
        <div className="admin-panel">
          <div className="panel-heading">
            <h2>Manual attendance</h2>
            <p className="small-text">Grant attendance permission if a user cannot scan.</p>
          </div>
          {message && <div className="alert-message">{message}</div>}
          <div className="form-group">
            <label htmlFor="manualUser">Username</label>
            <input
              type="text"
              id="manualUser"
              value={manualUser}
              onChange={(e) => setManualUser(e.target.value)}
              placeholder="Type a registered username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="manualNote">Note</label>
            <input
              type="text"
              id="manualNote"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
          <button className="login-btn" onClick={grantManualAttendance}>Post attendance</button>
        </div>

        <div className="admin-panel">
          <div className="panel-heading">
            <h2>Registered users</h2>
            <p className="small-text">View all accounts in the system.</p>
          </div>
          <div className="user-list">
            {users.map((user) => (
              <div key={user.username} className="user-item">
                <span>{user.username}</span>
                <strong>{user.role}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="attendance-card attendance-log-card">
        <h2>Attendance feed</h2>
        {attRecords.length === 0 ? (
          <p className="small-text">No records available yet.</p>
        ) : (
          <div className="attendance-table">
            <div className="table-row header-row">
              <span>User</span>
              <span>Method</span>
              <span>When</span>
            </div>
            {attRecords.map((item) => (
              <div key={item.id} className="table-row">
                <span>{item.username}</span>
                <span>{item.method}</span>
                <span>{new Date(item.time).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )

  return (
    <>
      {currentPage === 'login' && renderLogin()}
      {currentPage === 'register' && renderRegister()}
      {currentPage === 'attendance' && renderAttendance()}
      {currentPage === 'admin' && renderAdmin()}
    </>
  )
}

export default App
