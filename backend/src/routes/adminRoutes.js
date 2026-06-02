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
  return value.toISOString().slice(0, 10)
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
      recentActivity,
      recentEnrollments,
      recentCompletions,
      recentPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
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
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: userSelect } } }),
      prisma.enrollment.findMany({ where: { enrolledAt: { gte: thirtyDaysAgo } }, select: { enrolledAt: true } }),
      prisma.enrollment.findMany({ where: { completedAt: { gte: thirtyDaysAgo } }, select: { completedAt: true } }),
      prisma.payment.findMany({ where: { status: 'PAID', createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, amountCents: true } }),
    ])

    const daily = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(thirtyDaysAgo)
      date.setDate(thirtyDaysAgo.getDate() + index)
      const key = dateKey(date)
      return { date: key, registrations: 0, enrollments: 0, completions: 0, revenueCents: 0 }
    })
    const dailyByDate = new Map(daily.map((item) => [item.date, item]))
    recentUsers.forEach((user) => {
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
        activeUsers: activeSessions.length,
        totalCourses,
        publishedCourses,
        pendingApprovals: pendingCourses,
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
    license: 'Company-owned avatar',
    thumbnailUrl: '/favicon.svg',
  },
  {
    id: 'uptoskills-boardroom-male',
    name: 'UptoSkills Boardroom Instructor',
    style: 'Enterprise trainer',
    license: 'Licensed avatar',
    thumbnailUrl: '/favicon.svg',
  },
  {
    id: 'custom-consented-avatar',
    name: 'Custom Consented Avatar',
    style: 'Uploaded instructor identity',
    license: 'User-consented avatar only',
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

function animatedLessonHtml({ title, script, imageUrl, voiceSampleUrl, pdfUrl, captionsUrl, generationId }) {
  const payload = JSON.stringify({
    title,
    script,
    imageUrl,
    voiceSampleUrl,
    pdfUrl,
    captionsUrl,
    generationId,
  }).replace(/</g, '\\u003c')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${String(title).replace(/[<>&"]/g, '')}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; background: #020617; color: white; display: grid; place-items: center; }
    .stage { position: relative; width: min(100vw, 1280px); aspect-ratio: 16 / 9; overflow: hidden; background: radial-gradient(circle at 20% 10%, #1d4ed8 0, transparent 26%), linear-gradient(135deg, #020617, #111827 70%); }
    .avatarWrap { position: absolute; inset: 8% 7% 18% auto; width: min(38%, 430px); aspect-ratio: 1; border-radius: 36% 44% 34% 42%; overflow: hidden; border: 6px solid rgba(255,255,255,.2); box-shadow: 0 30px 90px rgba(0,0,0,.45); animation: float 4s ease-in-out infinite; }
    .avatar { width: 100%; height: 100%; object-fit: cover; filter: saturate(1.22) contrast(1.08) hue-rotate(4deg); transform: scale(1.03); }
    .mouth { position: absolute; left: 50%; bottom: 22%; width: 54px; height: 14px; border-radius: 999px; transform: translateX(-50%); background: rgba(15,23,42,.82); animation: talk .34s ease-in-out infinite alternate; }
    .content { position: absolute; left: 6%; top: 10%; width: 50%; }
    .eyebrow { color: #38bdf8; font-size: clamp(12px, 1.4vw, 16px); letter-spacing: .22em; text-transform: uppercase; font-weight: 800; }
    h1 { margin: 18px 0 0; font-size: clamp(34px, 5vw, 70px); line-height: 1; }
    .caption { position: absolute; left: 6%; right: 6%; bottom: 7%; padding: 18px 22px; border-radius: 18px; background: rgba(2,6,23,.72); border: 1px solid rgba(255,255,255,.16); font-size: clamp(16px, 2vw, 27px); line-height: 1.35; }
    .controls { position: absolute; right: 22px; top: 20px; display: flex; gap: 10px; }
    button, a { border: 0; border-radius: 12px; background: white; color: #020617; padding: 10px 14px; font-weight: 800; text-decoration: none; cursor: pointer; }
    .note { margin-top: 24px; max-width: 560px; color: rgba(255,255,255,.76); line-height: 1.65; }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(-1deg); } 50% { transform: translateY(-12px) rotate(1deg); } }
    @keyframes talk { from { transform: translateX(-50%) scaleY(.55); } to { transform: translateX(-50%) scaleY(1.7); } }
  </style>
</head>
<body>
  <main class="stage">
    <div class="controls">
      <button type="button" id="play">Play narration</button>
      ${pdfUrl ? '<a id="pdf" target="_blank" rel="noreferrer">PDF</a>' : ''}
    </div>
    <section class="content">
      <div class="eyebrow">UptoSkills animated instructor</div>
      <h1 id="title"></h1>
      <p class="note">This is a stylized animated instructor lesson. It does not clone a real person's face or voice.</p>
    </section>
    <div class="avatarWrap">
      <img id="avatar" class="avatar" alt="Animated instructor" />
      <div class="mouth" aria-hidden="true"></div>
    </div>
    <div class="caption" id="caption"></div>
  </main>
  <script>
    const lesson = ${payload};
    document.getElementById('title').textContent = lesson.title;
    document.getElementById('avatar').src = lesson.imageUrl;
    document.getElementById('caption').textContent = lesson.script;
    if (lesson.pdfUrl && document.getElementById('pdf')) document.getElementById('pdf').href = lesson.pdfUrl;
    document.getElementById('play').addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(lesson.script);
      utterance.rate = 0.95;
      utterance.pitch = 1.02;
      window.speechSynthesis.speak(utterance);
    });
  </script>
</body>
</html>`
}

router.post('/ai-content/generate', async (req, res) => {
  const { title, script, avatarId, voiceId, slideUrl, imageUrl = '', voiceSampleUrl = '', pdfUrl = '', captionsUrl = '', captions = true, branding = true } = req.body || {}
  const avatar = licensedAvatars.find((item) => item.id === avatarId)
  const voice = authorizedVoices.find((item) => item.id === voiceId)
  if (!title || !script || !avatar || !voice) {
    return res.status(400).json({
      success: false,
      message: 'Title, script, licensed avatar, and authorized voice are required.',
    })
  }

  const wordCount = String(script).trim().split(/\s+/).filter(Boolean).length
  const durationMin = Math.min(10, Math.max(8, Math.ceil(wordCount / 120) || 8))
  const generationId = `ai-video-${Date.now()}`
  let generatedVideoUrl = slideUrl || ''

  if (imageUrl) {
    await mkdir(uploadDir, { recursive: true })
    const storedName = `${generationId}-${safeFileBase(title)}.html`
    await writeFile(resolve(uploadDir, storedName), animatedLessonHtml({ title, script, imageUrl, voiceSampleUrl, pdfUrl, captionsUrl, generationId }), 'utf8')
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
          avatar,
          voice,
          script,
          slideUrl: slideUrl || '',
          imageUrl,
          voiceSampleUrl,
          pdfUrl,
          captionsUrl,
          captions,
          branding,
          compliance: 'This creates a stylized animated instructor and browser narration. It does not clone a real face or voice.',
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
    const certificates = await prisma.certificate.findMany({ include: { user: { select: userSelect }, course: true }, orderBy: { issuedAt: 'desc' } })
    res.json({ success: true, certificates })
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
    const { name, email, password = 'Password123', role = 'learner' } = req.body
    const user = await prisma.user.create({
      data: { name, email: String(email).toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: roleToDatabase(role) },
    })
    res.status(201).json({ success: true, user: publicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.patch('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: {
        name: req.body.name,
        role: req.body.role ? roleToDatabase(req.body.role) : undefined,
        approvalStatus: req.body.approvalStatus ? String(req.body.approvalStatus).toUpperCase() : undefined,
        isActive: typeof req.body.isActive === 'boolean' ? req.body.isActive : undefined,
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
    await prisma.user.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
