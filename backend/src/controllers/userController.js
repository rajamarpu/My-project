import {
  createContactSubmission,
  getAdminOverview,
  toSafeUser,
  updateUserProfile,
  updateUserSettings,
} from '../db/authSql.js'

function handleSqlError(res, error) {
  return res.status(503).json({
    success: false,
    message: error?.message || 'PostgreSQL is not reachable. Start PostgreSQL and check backend/.env.',
  })
}

export async function updateProfile(req, res) {
  try {
    const user = toSafeUser(await updateUserProfile(req.user.id, req.body))
    return res.json({ success: true, user })
  } catch (error) {
    return handleSqlError(res, error)
  }
}

export async function updateSettings(req, res) {
  try {
    const user = toSafeUser(await updateUserSettings(req.user.id, req.body))
    return res.json({ success: true, settings: user.settings })
  } catch (error) {
    return handleSqlError(res, error)
  }
}

export async function submitContact(req, res) {
  try {
    const { fullName, email, subject, message } = req.body
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All contact fields are required.' })
    }

    const submission = await createContactSubmission({ fullName, email, subject, message })
    return res.status(201).json({ success: true, submission })
  } catch (error) {
    return handleSqlError(res, error)
  }
}

export async function adminOverview(_req, res) {
  try {
    const overview = await getAdminOverview()
    return res.json({ success: true, ...overview })
  } catch (error) {
    return handleSqlError(res, error)
  }
}
