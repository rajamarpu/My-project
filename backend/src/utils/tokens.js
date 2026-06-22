import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const secret = () => {
  const value = process.env.JWT_SECRET
  if (value) return value
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET is required in production.')
  return 'local-development-only-secret-change-before-deploying'
}

export function normalizeRole(role) {
  const value = String(role || 'USER').trim().toUpperCase()
  if (value === 'ADMIN') return 'ADMIN'
  if (['INSTRUCTOR', 'TEACHER'].includes(value)) return 'INSTRUCTOR'
  return 'USER'
}

export function roleToClient(role) {
  const normalized = normalizeRole(role)
  if (normalized === 'ADMIN') return 'admin'
  if (normalized === 'INSTRUCTOR') return 'instructor'
  return 'learner'
}

export function roleToDatabase(role) {
  const value = String(role || 'USER').trim().toUpperCase()
  if (['ADMIN'].includes(value)) return 'ADMIN'
  if (['INSTRUCTOR', 'TEACHER'].includes(value)) return 'INSTRUCTOR'
  if (['LEARNER', 'STUDENT', 'USER'].includes(value)) return 'USER'
  return normalizeRole(value)
}

export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.full_name || user.name,
    fullName: user.full_name || user.name,
    email: user.email,
    phone: user.phone,
    role: roleToClient(user.role),
    approvalStatus: String(user.approvalStatus || 'APPROVED').toUpperCase(),
    avatarUrl: user.profile_image || user.avatarUrl,
    bio: user.bio,
    expertise: user.expertise,
    socialLinks: user.socialLinks,
    isActive: user.is_active ?? user.isActive ?? true,
    createdAt: user.created_at || user.createdAt,
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: roleToDatabase(user.role),
      email: user.email,
      jti: crypto.randomUUID(),
    },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, secret())
}
