import { prisma } from '../config/prisma.js'

export async function logActivity(req, { userId, action, entityType, entityId, metadata } = {}) {
  try {
    if (!action) return null
    return await prisma.activityLog.create({
      data: {
        userId: userId ?? req?.user?.id ?? null,
        action,
        entityType: entityType || null,
        entityId: entityId ? String(entityId) : null,
        metadata: metadata || undefined,
        ipAddress: req?.ip || null,
        userAgent: req?.get ? req.get('user-agent') : null,
      },
    })
  } catch (error) {
    console.warn('Activity log skipped:', error.message)
    return null
  }
}
