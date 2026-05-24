import jwt from 'jsonwebtoken'

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me'

export function normalizeRole(role) {
  const value = String(role || 'learner').toLowerCase()
  if (value === 'admin') return 'admin'
  return 'learner'
}

export function publicUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.full_name || user.name,
    fullName: user.full_name || user.name,
    email: user.email,
    phone: user.phone,
    role: String(user.role || 'learner').toLowerCase(),
    avatarUrl: user.profile_image || user.avatarUrl,
    bio: user.bio,
    isActive: user.is_active ?? user.isActive,
    createdAt: user.created_at || user.createdAt,
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: String(user.role).toLowerCase(),
      email: user.email,
    },
    secret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, secret())
}
