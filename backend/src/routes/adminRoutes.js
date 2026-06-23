import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { prisma } from '../config/prisma.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { publicUser, roleToDatabase } from '../utils/tokens.js'

const router = Router()
router.use(requireAuth, requireRole('admin'))

const userSelect = { id: true, name: true, email: true, phone: true, role: true, approvalStatus: true, avatarUrl: true, bio: true, expertise: true, socialLinks: true, isActive: true, createdAt: true }
const uploadDir = resolve(process.cwd(), 'public/uploads')
const uploadExtensionByMime = {
  'application/pdf': '.pdf',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/zip': '.zip',
  'text/plain': '.txt',
  'text/csv': '.csv',
}

function dateKey(value) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0
}

function slugify(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function safeFileBase(value) {
  return String(value || 'course-file')
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'course-file'
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function extensionForUpload(fileName, mimeType) {
  const ext = extname(fileName || '').toLowerCase()
  if (ext && ext.length <= 8) return ext
  if (mimeType?.startsWith('video/')) return '.mp4'
  if (mimeType?.startsWith('image/')) return '.png'
  return uploadExtensionByMime[mimeType] || '.bin'
}

async function findCategoryForCourse(category) {
  const cleanCategory = String(category || '').trim()
  if (!cleanCategory) return null
  const cleanSlug = slugify(cleanCategory)
  return prisma.category.findFirst({
    where: {
      OR: [
        { id: cleanCategory },
        { name: { equals: cleanCategory, mode: 'insensitive' } },
        { slug: { equals: cleanSlug, mode: 'insensitive' } },
      ],
    },
  })
}

async function updateUserModeration(req, { approvalStatus, isActive, action }) {
  const userId = Number(req.params.id)
  if (!Number.isInteger(userId)) {
    const error = new Error('A valid user id is required.')
    error.statusCode = 400
    throw error
  }
  if (Number(req.user.id) === userId && isActive === false) {
    const error = new Error('You cannot suspend or reject your own admin account.')
    error.statusCode = 400
    throw error
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { approvalStatus, isActive },
  })

  if (isActive === false) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  await prisma.activityLog.create({
    data: {
      userId: req.user.id,
      action,
      entityType: 'user',
      entityId: String(userId),
      metadata: {
        targetUserId: userId,
        targetEmail: user.email,
        approvalStatus,
        isActive,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  })

  return publicUser(user)
}

router.get('/overview', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      totalLearners,
      totalAdmins,
      totalInstructors,
      pendingUsers,
      rejectedUsers,
      suspendedUsers,
      activeSessions,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalEnrollments,
      completedCourses,
      messages,
      totalCategories,
      totalCertificates,
      totalNotifications,
      totalPayments,
      revenue,
      paidPayments,
      pendingPayments,
      totalProgress,
      activeProgress,
      totalHoursStudied,
      totalWatchSeconds,
      popularCourses,
      categoryDemand,
      recentUsers,
      recentRegistrations,
      recentActivity,
      recentEnrollments,
      recentCompletions,
      recentPayments,
      recentUserActions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.user.count({ where: { approvalStatus: 'REJECTED' } }),
      prisma.user.count({ where: { OR: [{ approvalStatus: 'SUSPENDED' }, { isActive: false }] } }),
      prisma.session.findMany({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.course.count({ where: { isPublished: false } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { OR: [{ completionPct: { gte: 100 } }, { completedAt: { not: null } }] } }),
      prisma.chatMessage.count({ where: { isDeleted: false } }),
      prisma.category.count(),
      prisma.certificate.count(),
      prisma.notification.count(),
      prisma.payment.count(),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amountCents: true } }),
      prisma.payment.count({ where: { status: 'PAID' } }),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.progress.count(),
      prisma.progress.count({ where: { lastAccessedAt: { gte: thirtyDaysAgo } } }),
      prisma.enrollment.aggregate({ _sum: { hoursStudied: true } }),
      prisma.progress.aggregate({ _sum: { watchedSeconds: true } }),
      prisma.course.findMany({
        include: { _count: { select: { enrollments: true, lessons: true, certificates: true } } },
        orderBy: [{ enrollments: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 5,
      }),
      prisma.course.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: userSelect }),
      prisma.user.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: userSelect } } }),
      prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } }),
      prisma.enrollment.findMany({ where: { completedAt: { gte: thirtyDaysAgo } }, select: { completedAt: true } }),
      prisma.payment.findMany({ where: { status: 'PAID', createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, amountCents: true } }),
      prisma.activityLog.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          action: { in: ['user_created', 'intern_created', 'instructor_created', 'user_approved', 'user_rejected', 'user_suspended', 'user_deleted'] },
        },
        select: { action: true, createdAt: true },
      }),
    ])

    const daily = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(thirtyDaysAgo)
      date.setDate(thirtyDaysAgo.getDate() + index)
      const key = dateKey(date)
      return { date: key, registrations: 0, enrollments: 0, completions: 0, revenueCents: 0, userApprovals: 0, userRejections: 0, userSuspensions: 0, userDeletions: 0, userCreations: 0 }
    })
    const dailyByDate = new Map(daily.map((item) => [item.date, item]))
    recentRegistrations.forEach((user) => {
      const bucket = dailyByDate.get(dateKey(user.createdAt))
      if (bucket) bucket.registrations += 1
    })
    recentEnrollments.forEach((enrollment) => {
      const bucket = dailyByDate.get(dateKey(enrollment.enrolledAt))
      if (bucket) bucket.enrollments += 1
    })
    recentCompletions.forEach((enrollment) => {
      if (!enrollment.completedAt) return
      const bucket = dailyByDate.get(dateKey(enrollment.completedAt))
      if (bucket) bucket.completions += 1
    })
    recentPayments.forEach((payment) => {
      const bucket = dailyByDate.get(dateKey(payment.createdAt))
      if (bucket) bucket.revenueCents += payment.amountCents || 0
    })
    recentUserActions.forEach((log) => {
      const bucket = dailyByDate.get(dateKey(log.createdAt))
      if (!bucket) return
      if (['user_created', 'intern_created', 'instructor_created'].includes(log.action)) bucket.userCreations += 1
      if (log.action === 'user_approved') bucket.userApprovals += 1
      if (log.action === 'user_rejected') bucket.userRejections += 1
      if (log.action === 'user_suspended') bucket.userSuspensions += 1
      if (log.action === 'user_deleted') bucket.userDeletions += 1
    })

    const completionRate = pct(completedCourses, totalEnrollments)
    const publishRate = pct(publishedCourses, totalCourses)
    const paidPaymentRate = pct(paidPayments, totalPayments)
    const averageProgressPct = totalEnrollments ? Math.round((completedCourses / totalEnrollments) * 100) : 0

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalLearners,
        totalAdmins,
        totalInstructors,
        pendingUsers,
        rejectedUsers,
        suspendedUsers,
        activeUsers: activeSessions.length,
        totalCourses,
        publishedCourses,
        pendingApprovals: pendingUsers,
        pendingCourses,
        totalEnrollments,
        completedCourses,
        messages,
        totalCategories,
        totalCertificates,
        totalNotifications,
        totalPayments,
        paidPayments,
        pendingPayments,
        revenueCents: revenue._sum.amountCents || 0,
        totalHoursStudied: Number(totalHoursStudied._sum.hoursStudied || 0),
        totalWatchHours: Math.round(Number(totalWatchSeconds._sum.watchedSeconds || 0) / 3600),
        totalProgress,
        activeProgress,
        completionRate,
        publishRate,
        paidPaymentRate,
        averageProgressPct,
        popularCourses: popularCourses.map((course) => ({
          id: course.id,
          title: course.title,
          category: course.category,
          enrollments: course._count.enrollments,
          lessons: course._count.lessons,
          certificates: course._count.certificates,
        })),
        categoryDemand: categoryDemand.map((item) => ({ category: item.category || 'Uncategorized', courses: item._count.id })),
        recentUsers: recentUsers.map(publicUser),
        recentActivity,
        growth: daily,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, select: userSelect })
    res.json({ success: true, users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/learners', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, select: userSelect })
    res.json({ success: true, learners: users.map(publicUser), users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/instructors', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' }, orderBy: { createdAt: 'desc' }, select: userSelect })
    res.json({ success: true, instructors: users.map(publicUser), users: users.map(publicUser) })
  } catch (error) {
    next(error)
  }
})

router.get('/courses', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim()
    const courses = await prisma.course.findMany({
      where: search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { category: { contains: search, mode: 'insensitive' } }] } : {},
      include: {
        lessons: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: userSelect },
        _count: { select: { enrollments: true, lessons: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, courses })
  } catch (error) {
    next(error)
  }
})

router.post('/uploads', async (req, res, next) => {
  try {
    const { fileName, mimeType, dataUrl } = req.body || {}
    const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/)
    if (!fileName || !match) {
      return res.status(400).json({ success: false, message: 'A file name and base64 dataUrl are required.' })
    }

    const detectedMime = mimeType || match[1]
    const buffer = Buffer.from(match[2], 'base64')
    if (!buffer.length) return res.status(400).json({ success: false, message: 'Uploaded file is empty.' })
    if (buffer.length > 60 * 1024 * 1024) return res.status(413).json({ success: false, message: 'File must be 60 MB or smaller.' })

    await mkdir(uploadDir, { recursive: true })
    const storedName = `${Date.now()}-${safeFileBase(fileName)}${extensionForUpload(fileName, detectedMime)}`
    await writeFile(resolve(uploadDir, storedName), buffer)

    res.status(201).json({
      success: true,
      asset: {
        name: fileName,
        url: `/uploads/${storedName}`,
        mimeType: detectedMime,
        size: buffer.length,
      },
    })
  } catch (error) {
    next(error)
  }
})

const licensedAvatars = [
  {
    id: 'uptoskills-studio-female',
    name: 'UptoSkills Studio Instructor',
    style: 'Professional studio',
    license: 'Company-owned voice/video profile',
    thumbnailUrl: '/favicon.svg',
  },
  {
    id: 'uptoskills-boardroom-male',
    name: 'UptoSkills Boardroom Instructor',
    style: 'Enterprise trainer',
    license: 'Licensed voice/video profile',
    thumbnailUrl: '/favicon.svg',
  },
  {
    id: 'custom-consented-avatar',
    name: 'Custom Consented Profile',
    style: 'Uploaded instructor identity',
    license: 'User-consented media only',
    thumbnailUrl: '/favicon.svg',
  },
]

const authorizedVoices = [
  { id: 'en-in-professional-female', name: 'Professional Female', language: 'English India', license: 'Authorized voice model' },
  { id: 'en-in-clear-male', name: 'Clear Male Narrator', language: 'English India', license: 'Authorized voice model' },
  { id: 'en-us-training-neutral', name: 'Training Neutral', language: 'English US', license: 'Authorized voice model' },
]

router.get('/ai-content/options', async (_req, res) => {
  res.json({ success: true, avatars: licensedAvatars, voices: authorizedVoices })
})

function animatedLessonHtml({ title, script, imageUrl, voiceSampleUrl, pdfUrl, captionsUrl, generationId, instructorName, targetDurationSeconds, sourceVideoUrl }) {
  const safeTitle = escapeHtml(title)
  const safeInstructorName = escapeHtml(instructorName)
  const safeSourceVideoUrl = escapeHtml(sourceVideoUrl)
  const payload = JSON.stringify({
    title,
    script,
    imageUrl,
    voiceSampleUrl,
    pdfUrl,
    captionsUrl,
    generationId,
    instructorName,
    targetDurationSeconds,
    sourceVideoUrl,
  }).replace(/</g, '\\u003c')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; background: #020617; color: white; display: grid; place-items: center; }
    .stage { width: min(100vw, 1280px); aspect-ratio: 16 / 9; overflow: hidden; background: #020617; display: grid; grid-template-rows: minmax(0, 1fr) auto; }
    .videoArea { position: relative; min-height: 0; background: #020617; }
    video { width: 100%; height: 100%; object-fit: contain; background: #020617; display: block; }
    .emptyVideo { position: absolute; inset: 0; display: ${safeSourceVideoUrl ? 'none' : 'grid'}; place-items: center; padding: 32px; text-align: center; color: rgba(255,255,255,.82); background: radial-gradient(circle at 20% 10%, #1d4ed8 0, transparent 26%), linear-gradient(135deg, #020617, #111827 70%); }
    .controls { min-height: 54px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid rgba(255,255,255,.12); background: rgba(2,6,23,.96); padding: 8px 14px; }
    .meta { min-width: 0; }
    .eyebrow { color: #38bdf8; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 800; }
    h1 { margin: 3px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; line-height: 1.2; }
    .actions { display: flex; flex-shrink: 0; gap: 8px; }
    button, a { border: 0; border-radius: 12px; background: white; color: #020617; padding: 10px 14px; font-weight: 800; text-decoration: none; cursor: pointer; }
    .status { color: rgba(255,255,255,.68); font-size: 12px; }
  </style>
</head>
<body>
  <main class="stage">
    <section class="videoArea">
      ${safeSourceVideoUrl ? `<video id="sourceVideo" controls playsinline preload="metadata" src="${safeSourceVideoUrl}"></video>` : ''}
      <div class="emptyVideo">
        <div>
          <h1>Source video missing</h1>
          <p>Upload a lesson video before generating the AI narration lesson.</p>
        </div>
      </div>
    </section>
    <section class="controls">
      <div class="meta">
        <div class="eyebrow" id="eyebrow">${safeInstructorName ? `${safeInstructorName} narration` : 'Generated narration'}</div>
        <h1 id="title">${safeTitle}</h1>
      </div>
      <span class="status" id="status">Voice sample stored. Provider rendering required for replica voice.</span>
      <div class="actions">
        <button type="button" id="play">Preview narration</button>
        ${pdfUrl ? '<a id="pdf" target="_blank" rel="noreferrer">PDF</a>' : ''}
      </div>
    </section>
  </main>
  <script>
    const lesson = ${payload};
    document.getElementById('title').textContent = lesson.title;
    document.getElementById('eyebrow').textContent = lesson.instructorName ? lesson.instructorName + ' narration' : 'Generated narration';
    if (lesson.pdfUrl && document.getElementById('pdf')) document.getElementById('pdf').href = lesson.pdfUrl;
    document.getElementById('play').addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const video = document.getElementById('sourceVideo');
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
      const utterance = new SpeechSynthesisUtterance(lesson.script);
      const words = lesson.script.trim().split(/\\s+/).filter(Boolean).length || 1;
      const targetMinutes = Math.max(1, Number(lesson.targetDurationSeconds || 0) / 60);
      const estimatedRate = Math.min(1.6, Math.max(0.65, (words / targetMinutes) / 150));
      utterance.rate = estimatedRate;
      utterance.pitch = 1.02;
      document.getElementById('status').textContent = 'Preview narration playing. This is not a cloned voice.';
      window.speechSynthesis.speak(utterance);
    });
  </script>
</body>
</html>`
}

router.post('/ai-content/generate', async (req, res) => {
  const {
    title,
    script,
    avatarId,
    voiceId,
    slideUrl,
    imageUrl = '',
    voiceSampleUrl = '',
    pdfUrl = '',
    captionsUrl = '',
    captions = true,
    branding = true,
    instructorId = '',
    instructorName = '',
    targetDurationSeconds = 0,
    sourceVideoUrl = '',
  } = req.body || {}
  const avatar = licensedAvatars.find((item) => item.id === avatarId)
  const voice = authorizedVoices.find((item) => item.id === voiceId)
  if (!title || !script || !avatar || !voice) {
    return res.status(400).json({
      success: false,
      message: 'Title, script, voice/video profile, and authorized voice are required.',
    })
  }

  const wordCount = String(script).trim().split(/\s+/).filter(Boolean).length
  const requestedDurationSeconds = Math.max(0, Number(targetDurationSeconds || 0))
  const durationMin = requestedDurationSeconds
    ? Math.max(1, Math.ceil(requestedDurationSeconds / 60))
    : Math.min(10, Math.max(8, Math.ceil(wordCount / 120) || 8))
  const generationId = `ai-video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  let generatedVideoUrl = slideUrl || ''

  if (imageUrl) {
    await mkdir(uploadDir, { recursive: true })
    const storedName = `${generationId}-${safeFileBase(title)}.html`
    await writeFile(resolve(uploadDir, storedName), animatedLessonHtml({ title, script, imageUrl, voiceSampleUrl, pdfUrl, captionsUrl, generationId, instructorName, targetDurationSeconds: requestedDurationSeconds, sourceVideoUrl }), 'utf8')
    generatedVideoUrl = `/uploads/${storedName}`
  }

  res.status(201).json({
    success: true,
    generation: {
      id: generationId,
      status: imageUrl ? 'ANIMATED_LINK_READY' : 'READY_FOR_PROVIDER',
      providerStatus: imageUrl
        ? 'Animated instructor lesson link generated. Paste this URL into the course lesson Video URL box.'
        : 'AI video draft prepared. Upload the rendered MP4 or paste the final video URL when it is ready.',
      lesson: {
        type: 'AI_AVATAR_VIDEO',
        title,
        description: String(script).slice(0, 220),
        durationMin,
        videoUrl: generatedVideoUrl,
        resources: [
          ...(pdfUrl ? [{ name: 'Lesson PDF', url: pdfUrl, mimeType: 'application/pdf' }] : []),
          ...(voiceSampleUrl ? [{ name: 'Voice reference sample', url: voiceSampleUrl, mimeType: 'audio/reference' }] : []),
        ],
        metadata: {
          aiGenerated: true,
          generationId,
          instructorId: String(instructorId || ''),
          instructorName: String(instructorName || ''),
          avatar,
          voice,
          script,
          slideUrl: slideUrl || '',
          sourceVideoUrl: String(sourceVideoUrl || ''),
          imageUrl,
          voiceSampleUrl,
          pdfUrl,
          captionsUrl,
          targetDurationSeconds: requestedDurationSeconds,
          captions,
          branding,
          compliance: 'This creates a generated narration lesson page from the uploaded video and script. Final custom voice rendering requires a licensed voice provider.',
        },
      },
    },
  })
})

router.patch('/courses/:id', async (req, res, next) => {
  try {
    const category = req.body.category
    const categoryRecord = category !== undefined ? await findCategoryForCourse(category) : null
    const lessons = Array.isArray(req.body.lessons)
      ? req.body.lessons
        .map((lesson, index) => ({
          ...(typeof lesson.id === 'string' && lesson.id.trim() ? { id: lesson.id } : {}),
          title: String(lesson.title || '').trim(),
          description: String(lesson.description || '').trim() || null,
          videoUrl: String(lesson.videoUrl || '').trim() || null,
          durationMin: Number(lesson.durationMin || 0),
          sortOrder: index,
          type: lesson.type || 'ARTICLE',
          quizJson: lesson.quizJson || null,
        }))
        .filter((lesson) => lesson.title)
      : null

    const course = await prisma.$transaction(async (tx) => {
      const updatedCourse = await tx.course.update({
        where: { id: req.params.id },
        data: {
          title: req.body.title,
          description: req.body.description,
          category,
          categoryId: category !== undefined ? categoryRecord?.id || null : undefined,
          level: req.body.level,
          priceCents: typeof req.body.priceCents === 'number' ? req.body.priceCents : undefined,
          isPublished: typeof req.body.isPublished === 'boolean' ? req.body.isPublished : undefined,
          thumbnailUrl: req.body.thumbnailUrl,
          videoPreviewUrl: req.body.videoPreviewUrl,
        },
      })

      if (lessons) {
        await tx.lesson.deleteMany({ where: { courseId: req.params.id } })
        if (lessons.length) {
          await tx.lesson.createMany({
            data: lessons.map((lesson) => ({ ...lesson, courseId: req.params.id })),
          })
        }
      }

      return tx.course.findUnique({
        where: { id: updatedCourse.id },
        include: {
          lessons: { orderBy: { sortOrder: 'asc' } },
          createdBy: { select: userSelect },
          _count: { select: { enrollments: true, lessons: true, certificates: true } },
        },
      })
    })
    res.json({ success: true, course })
  } catch (error) {
    next(error)
  }
})

router.delete('/courses/:id', async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.get('/categories', async (_req, res, next) => {
  try {
    const [categories, coursesByCategory] = await Promise.all([
      prisma.category.findMany({ include: { _count: { select: { courses: true } } }, orderBy: { name: 'asc' } }),
      prisma.course.groupBy({ by: ['category'], _count: { id: true } }),
    ])
    const courseCountByCategory = new Map(
      coursesByCategory.map((item) => [slugify(item.category), item._count.id]),
    )
    const enrichedCategories = categories.map((category) => {
      const relationCount = category._count?.courses || 0
      const textCount = courseCountByCategory.get(slugify(category.name)) || courseCountByCategory.get(category.slug) || 0
      return {
        ...category,
        _count: {
          ...category._count,
          courses: Math.max(relationCount, textCount),
        },
      }
    })
    res.json({ success: true, categories: enrichedCategories })
  } catch (error) {
    next(error)
  }
})

router.post('/categories', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' })
    const slug = String(req.body.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: req.body.description || null,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : true,
      },
    })
    res.status(201).json({ success: true, category })
  } catch (error) {
    next(error)
  }
})

router.patch('/categories/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        slug: req.body.slug ? String(req.body.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined,
        description: req.body.description,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
      },
    })
    res.json({ success: true, category })
  } catch (error) {
    next(error)
  }
})

router.get('/enrollments', async (_req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        user: { select: userSelect },
        course: true,
        personality: true,
        currentInstructor: { select: userSelect },
        instructorChanges: {
          include: { fromInstructor: { select: userSelect }, toInstructor: { select: userSelect }, changedBy: { select: userSelect } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })
    res.json({ success: true, enrollments })
  } catch (error) {
    next(error)
  }
})

router.get('/instructor-changes', async (_req, res, next) => {
  try {
    const changes = await prisma.instructorChangeHistory.findMany({
      include: {
        learner: { select: userSelect },
        course: true,
        fromInstructor: { select: userSelect },
        toInstructor: { select: userSelect },
        changedBy: { select: userSelect },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, changes })
  } catch (error) {
    next(error)
  }
})

router.get('/certificates', async (_req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      include: {
        user: { select: userSelect },
        course: { include: { createdBy: { select: { id: true, name: true, email: true } } } },
        issuedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { issuedAt: 'desc' },
    })
    res.json({ success: true, certificates })
  } catch (error) {
    next(error)
  }
})

router.delete('/certificates/:id', async (req, res, next) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    })
    if (!certificate) return res.status(404).json({ success: false, message: 'Certificate not found.' })

    await prisma.certificate.delete({ where: { id: req.params.id } })
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'certificate.deleted',
        entityType: 'certificate',
        entityId: certificate.id,
        metadata: {
          certificateNo: certificate.certificateNo,
          learnerId: certificate.userId,
          learnerEmail: certificate.user?.email,
          courseId: certificate.courseId,
          courseTitle: certificate.course?.title,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.get('/notifications', async (_req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({ include: { user: { select: userSelect } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, notifications })
  } catch (error) {
    next(error)
  }
})

router.get('/activity-logs', async (_req, res, next) => {
  try {
    const activityLogs = await prisma.activityLog.findMany({ include: { user: { select: userSelect } }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, activityLogs })
  } catch (error) {
    next(error)
  }
})

router.get('/payments', async (_req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({ include: { user: { select: userSelect }, course: true }, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, payments })
  } catch (error) {
    next(error)
  }
})

router.post('/users', async (req, res, next) => {
  try {
    const {
      name,
      email,
      password = 'Password123',
      role = 'learner',
      avatarUrl,
      bio,
      expertise,
      assignCourseId,
      autoAssignCourse,
    } = req.body || {}
    const cleanName = String(name || '').trim()
    const cleanEmail = String(email || '').trim().toLowerCase()
    if (!cleanName || !cleanEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' })
    }

    const requestedRole = String(role || '').trim().toLowerCase()
    const databaseRole = requestedRole === 'intern' ? 'USER' : roleToDatabase(role)
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: databaseRole,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
        expertise: expertise || (requestedRole === 'intern' ? 'Intern' : undefined),
      },
    })

    let assignedCourse = null
    if (databaseRole === 'INSTRUCTOR' && (assignCourseId || autoAssignCourse)) {
      const course = assignCourseId
        ? await prisma.course.findUnique({ where: { id: String(assignCourseId) } })
        : await prisma.course.findFirst({ where: { createdById: null }, orderBy: { createdAt: 'desc' } })
          || await prisma.course.findFirst({ orderBy: { createdAt: 'desc' } })

      if (course) {
        assignedCourse = await prisma.course.update({
          where: { id: course.id },
          data: { createdById: user.id },
          include: { createdBy: { select: userSelect } },
        })
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: databaseRole === 'INSTRUCTOR' ? 'instructor_created' : requestedRole === 'intern' ? 'intern_created' : 'user_created',
        entityType: 'user',
        entityId: String(user.id),
        metadata: {
          targetEmail: user.email,
          targetRole: databaseRole,
          assignedCourseId: assignedCourse?.id || null,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    })

    res.status(201).json({ success: true, user: publicUser(user), assignedCourse })
  } catch (error) {
    next(error)
  }
})

router.patch('/users/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ success: false, message: 'A valid user id is required.' })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: req.body.name,
        role: req.body.role ? roleToDatabase(req.body.role) : undefined,
        approvalStatus: req.body.approvalStatus ? String(req.body.approvalStatus).toUpperCase() : undefined,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
      },
    })
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'user_updated',
        entityType: 'user',
        entityId: String(user.id),
        metadata: {
          targetEmail: user.email,
          targetRole: user.role,
          approvalStatus: user.approvalStatus,
          isActive: user.isActive,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/approve', async (req, res, next) => {
  try {
    const user = await updateUserModeration(req, {
      approvalStatus: 'APPROVED',
      isActive: true,
      action: 'user_approved',
    })
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/reject', async (req, res, next) => {
  try {
    const user = await updateUserModeration(req, {
      approvalStatus: 'REJECTED',
      isActive: false,
      action: 'user_rejected',
    })
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await updateUserModeration(req, {
      approvalStatus: 'SUSPENDED',
      isActive: false,
      action: 'user_suspended',
    })
    res.json({ success: true, user })
  } catch (error) {
    next(error)
  }
})

router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ success: false, message: 'A valid user id is required.' })
    }
    if (Number(req.user.id) === userId) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' })
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect })
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' })

    await prisma.$transaction([
      prisma.user.delete({ where: { id: userId } }),
      prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'user_deleted',
          entityType: 'user',
          entityId: String(userId),
          metadata: {
            targetEmail: user.email,
            targetRole: user.role,
            approvalStatus: user.approvalStatus,
            isActive: user.isActive,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      }),
    ])
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
