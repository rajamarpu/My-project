import nodemailer from 'nodemailer'

const smtpPort = () => Number(process.env.SMTP_PORT || 587)

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function createTransporter() {
  if (!isEmailConfigured()) {
    const error = new Error('Email service is not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in backend/.env.')
    error.statusCode = 503
    throw error
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort(),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || smtpPort() === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

export async function sendOtpEmail({ to, otp, purpose = 'password reset' }) {
  const transporter = createTransporter()
  const from = process.env.SMTP_FROM || `"UptoSkills" <${process.env.SMTP_USER}>`
  const subject = purpose === 'login' ? 'Your UptoSkills login OTP' : 'Your UptoSkills password reset OTP'
  const intro = purpose === 'login'
    ? 'Use this OTP to complete your UptoSkills login.'
    : 'Use this OTP to reset your UptoSkills password.'

  await transporter.sendMail({
    from,
    to,
    subject,
    text: `${intro}\n\nOTP: ${otp}\n\nThis code expires in 10 minutes. If you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px;color:#0891b2">UptoSkills verification code</h2>
        <p>${intro}</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${otp}</p>
        <p>This code expires in 10 minutes.</p>
        <p style="color:#64748b;font-size:13px">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}
