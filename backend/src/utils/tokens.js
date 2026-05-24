import jwt from 'jsonwebtoken'

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me'

export function normalizeRole(role) {
  const value = String(role || 'learner').toUpperCase()
  if (value === 'ADMIN') return 'ADMIN'
  if (value === 'TEACHER') return 'TEACHER'
  return 'STUDENT'
}

export function publicUser(user) {
  if (!user) return null
  const roleMap = {
    STUDENT: 'learner',
    TEACHER: 'instructor',
    ADMIN: 'admin',
  }
  return {
    id: user.id,
    name: user.full_name || user.name,
    fullName: user.full_name || user.name,
    email: user.email,
    role: roleMap[user.role] || String(user.role).toLowerCase(),
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
