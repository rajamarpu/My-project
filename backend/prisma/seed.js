import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@uptoskills.com').toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || 'UptoSkills@Admin2026'

const instructors = [
  {
    name: 'Rohit Sharma',
    email: 'rohitsharma@gmail.com',
    avatarUrl: '/celebrities/rohit-sharma.jpg',
    bio: 'Calm execution coach focused on practical build, deploy, and ship workflows.',
    expertise: 'Project planning, frontend delivery, product execution',
    socialLinks: {
      instagram: 'https://www.instagram.com/rohitsharma45/',
      x: 'https://x.com/ImRo45',
      linkedin: 'https://www.linkedin.com/in/rohit-sharma/',
    },
  },
  {
    name: 'Virat Kohli',
    email: 'viratkohli@gmail.com',
    avatarUrl: '/celebrities/virat-kohli.jpg',
    bio: 'Performance coach who pushes for metrics, repetition, and disciplined practice.',
    expertise: 'Analytics, goal setting, Python, performance mindset',
    socialLinks: {
      instagram: 'https://www.instagram.com/virat.kohli/',
      x: 'https://x.com/imVkohli',
      linkedin: 'https://www.linkedin.com/in/virat-kohli/',
    },
  },
  {
    name: 'MS Dhoni',
    email: 'msdhoni@gmail.com',
    avatarUrl: '/celebrities/ms-dhoni.jpg',
    bio: 'Strategic mentor with a calm approach to systems thinking and decision making.',
    expertise: 'Architecture, microservices, operations, reliability',
    socialLinks: {
      instagram: 'https://www.instagram.com/msdhoni/',
      x: 'https://x.com/msdhoni',
      linkedin: 'https://www.linkedin.com/in/ms-dhoni/',
    },
  },
  {
    name: 'Shah Rukh Khan',
    email: 'shahrukhkhan@gmail.com',
    avatarUrl: '/celebrities/shah-rukh-khan.jpg',
    bio: 'Charismatic storyteller who turns technical lessons into memorable learning journeys.',
    expertise: 'Cloud delivery, storytelling, leadership, presentation',
    socialLinks: {
      instagram: 'https://www.instagram.com/iamsrk/',
      x: 'https://x.com/iamsrk',
      linkedin: 'https://www.linkedin.com/in/shah-rukh-khan/',
    },
  },
  {
    name: 'Allu Arjun',
    email: 'alluarjun@gmail.com',
    avatarUrl: '/celebrities/allu-arjun.jpg',
    bio: 'High-energy builder for modern UI and visual product experiences.',
    expertise: 'React, UI systems, animation, UX polish',
    socialLinks: {
      instagram: 'https://www.instagram.com/alluarjunonline/',
      x: 'https://x.com/AlluArjun',
      linkedin: 'https://www.linkedin.com/in/allu-arjun/',
    },
  },
  {
    name: 'Deepika Padukone',
    email: 'deepikapadukone@gmail.com',
    avatarUrl: '/celebrities/deepika-padukone.jpg',
    bio: 'Structured mentor for clean frontend engineering and stable delivery practices.',
    expertise: 'TypeScript, architecture, documentation, quality',
    socialLinks: {
      instagram: 'https://www.instagram.com/deepikapadukone/',
      x: 'https://x.com/deepikapadukone',
      linkedin: 'https://www.linkedin.com/in/deepika-padukone/',
    },
  },
  {
    name: 'Sachin Tendulkar',
    email: 'sachintendulkar@gmail.com',
    avatarUrl: '/celebrities/sachin-tendulkar.jpg',
    bio: 'Fundamentals-first teacher with patient, precise learning pathways.',
    expertise: 'SQL, fundamentals, debugging, mastery learning',
    socialLinks: {
      instagram: 'https://www.instagram.com/sachintendulkar/',
      x: 'https://x.com/sachin_rt',
      linkedin: 'https://www.linkedin.com/in/sachin-tendulkar/',
    },
  },
  {
    name: 'Alia Bhatt',
    email: 'aliabhatt@gmail.com',
    avatarUrl: '/celebrities/alia-bhatt.jpg',
    bio: 'Supportive creative coach who makes the first steps feel approachable.',
    expertise: 'C programming, basics, beginner-friendly explanations',
    socialLinks: {
      instagram: 'https://www.instagram.com/aliaabhatt/',
      x: 'https://x.com/aliaa08',
      linkedin: 'https://www.linkedin.com/in/alia-bhatt/',
    },
  },
  {
    name: 'Ranveer Singh',
    email: 'ranveersingh@gmail.com',
    avatarUrl: '/celebrities/ranveer-singh.jpg',
    bio: 'Energetic database mentor who turns SQL practice into confident product decisions.',
    expertise: 'PostgreSQL, SQL optimization, reporting, schema design',
    socialLinks: {
      instagram: 'https://www.instagram.com/ranveersingh/',
      x: 'https://x.com/RanveerOfficial',
      linkedin: 'https://www.linkedin.com/in/ranveer-singh/',
    },
  },
]

function courseThumbnail({ title, subtitle, level, category, accent = '#22d3ee', secondary = '#facc15' }) {
  const safe = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const lines = safe(title).split(' ')
  const firstLine = lines.slice(0, Math.ceil(lines.length / 2)).join(' ')
  const secondLine = lines.slice(Math.ceil(lines.length / 2)).join(' ')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-label="${safe(title)}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#071426"/>
          <stop offset="0.55" stop-color="#0d2440"/>
          <stop offset="1" stop-color="#030712"/>
        </linearGradient>
        <radialGradient id="glow" cx="78%" cy="28%" r="55%">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.45"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#020617" flood-opacity="0.55"/>
        </filter>
      </defs>
      <rect width="1200" height="675" rx="42" fill="url(#bg)"/>
      <rect width="1200" height="675" rx="42" fill="url(#glow)"/>
      <rect x="42" y="38" width="190" height="38" rx="12" fill="${secondary}" opacity="0.95"/>
      <text x="64" y="64" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="900">COMPLETE COURSE</text>
      <text x="64" y="196" fill="#e5e7eb" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="900">${firstLine}</text>
      <text x="64" y="284" fill="${secondary}" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="900">${secondLine || safe(subtitle)}</text>
      <text x="68" y="336" fill="#67e8f9" font-family="Inter, Arial, sans-serif" font-size="27" font-weight="800">${safe(subtitle || category)}</text>
      <g filter="url(#shadow)">
        <rect x="678" y="92" width="430" height="334" rx="34" fill="rgba(15,23,42,0.72)" stroke="rgba(125,211,252,0.35)" stroke-width="3"/>
        <rect x="720" y="140" width="250" height="22" rx="11" fill="#e5e7eb" opacity="0.88"/>
        <rect x="720" y="198" width="328" height="22" rx="11" fill="${accent}" opacity="0.85"/>
        <rect x="720" y="256" width="198" height="22" rx="11" fill="${secondary}" opacity="0.95"/>
        <circle cx="1018" cy="282" r="84" fill="none" stroke="${accent}" stroke-width="18" opacity="0.85"/>
        <path d="M744 356h294M744 392h214" stroke="#94a3b8" stroke-width="18" stroke-linecap="round" opacity="0.62"/>
      </g>
      <rect x="74" y="444" width="220" height="58" rx="29" fill="#111827" stroke="rgba(148,163,184,0.55)"/>
      <text x="116" y="482" fill="#dbeafe" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">${safe(level)}</text>
      <rect x="805" y="452" width="230" height="58" rx="29" fill="rgba(15,23,42,0.9)" stroke="rgba(148,163,184,0.5)"/>
      <text x="850" y="490" fill="#f8fafc" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="900">Published</text>
      <text x="72" y="594" fill="#94a3b8" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800">${safe(category)}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const courses = [
  {
    title: 'DATA SCIENCE',
    slug: 'data-science',
    category: 'AI/ML',
    level: 'BEGINNER',
    description: 'SQL, fundamentals, debugging, and mastery learning for data-driven decisions.',
    thumbnailUrl: courseThumbnail({ title: 'DATA SCIENCE', subtitle: 'TURNING DATA INTO INSIGHTS', category: 'AI/ML', level: 'BEGINNER', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'sachintendulkar@gmail.com',
    lessons: [
      { title: 'Data foundations', description: 'Understand datasets, fields, and analytical questions.', type: 'ARTICLE', durationMin: 20, sortOrder: 0 },
    ],
  },
  {
    title: 'DBMS',
    slug: 'dbms',
    category: 'DATABASE SYSTEMS',
    level: 'BEGINNER',
    description: 'SQL fundamentals, database models, normalization, relationships, and query practice.',
    thumbnailUrl: courseThumbnail({ title: 'DBMS', subtitle: 'DATABASE MANAGEMENT SYSTEM', category: 'DATABASE SYSTEMS', level: 'BEGINNER', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'sachintendulkar@gmail.com',
    lessons: [],
  },
  {
    title: 'C++ Programming',
    slug: 'c-plus-plus-programming',
    category: 'PROGRAMMING',
    level: 'ADVANCED',
    description: 'Cloud delivery, storytelling, leadership, and presentation through advanced C++ practice.',
    thumbnailUrl: courseThumbnail({ title: 'C++ Programming', subtitle: 'FROM BASICS TO ADVANCED', category: 'PROGRAMMING', level: 'ADVANCED', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'shahrukhkhan@gmail.com',
    lessons: [],
  },
  {
    title: 'C PROGRAMMING',
    slug: 'c-programming',
    category: 'PROGRAMMING',
    level: 'BEGINNER',
    description: 'Learn C syntax, functions, loops, arrays, pointers, and problem solving from the basics.',
    thumbnailUrl: courseThumbnail({ title: 'C PROGRAMMING', subtitle: 'FROM BASICS TO ADVANCED', category: 'PROGRAMMING', level: 'BEGINNER', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'aliabhatt@gmail.com',
    lessons: [],
  },
  {
    title: 'MongoDB',
    slug: 'mongodb',
    category: 'DATABASE SYSTEMS',
    level: 'ADVANCED',
    description: 'Analytics, goal setting, Python, and performance mindset for document database workflows.',
    thumbnailUrl: courseThumbnail({ title: 'MongoDB', subtitle: 'DOCUMENT DATABASES', category: 'DATABASE SYSTEMS', level: 'ADVANCED', accent: '#22c55e', secondary: '#d9f99d' }),
    createdByEmail: 'viratkohli@gmail.com',
    lessons: [],
  },
  {
    title: 'POSTGRE SQL',
    slug: 'postgre-sql',
    category: 'DATABASE SYSTEMS',
    level: 'INTERMEDIATE',
    description: 'Analytics, goal setting, Python, and performance mindset for PostgreSQL query skills.',
    thumbnailUrl: courseThumbnail({ title: 'POSTGRE SQL', subtitle: 'RELATIONAL DATABASES', category: 'DATABASE SYSTEMS', level: 'INTERMEDIATE', accent: '#38bdf8', secondary: '#bfdbfe' }),
    createdByEmail: 'viratkohli@gmail.com',
    lessons: [],
  },
  {
    title: 'BACK END DEVELOPMENT',
    slug: 'back-end-development',
    category: 'WEB DEVELOPMENT',
    level: 'INTERMEDIATE',
    description: 'Architecture, microservices, operations, reliability, and API development fundamentals.',
    thumbnailUrl: courseThumbnail({ title: 'BACK END DEVELOPMENT', subtitle: 'BUILD SERVER SCALE', category: 'WEB DEVELOPMENT', level: 'INTERMEDIATE', accent: '#0ea5e9', secondary: '#67e8f9' }),
    createdByEmail: 'msdhoni@gmail.com',
    lessons: [],
  },
  {
    title: 'FRONT END',
    slug: 'front-end',
    category: 'WEB DEVELOPMENT',
    level: 'BEGINNER',
    description: 'Cloud delivery, storytelling, leadership, and presentation for frontend product interfaces.',
    thumbnailUrl: courseThumbnail({ title: 'FRONT END', subtitle: 'DEVELOPMENT', category: 'WEB DEVELOPMENT', level: 'BEGINNER', accent: '#7c3aed', secondary: '#fb923c' }),
    createdByEmail: 'shahrukhkhan@gmail.com',
    lessons: [],
  },
  {
    title: 'FULL STACK',
    slug: 'full-stack',
    category: 'WEB DEVELOPMENT',
    level: 'ADVANCED',
    description: 'React, UI systems, animation, and UX polish for complete full-stack applications.',
    thumbnailUrl: courseThumbnail({ title: 'FULL STACK', subtitle: 'DEVELOPMENT', category: 'WEB DEVELOPMENT', level: 'ADVANCED', accent: '#7c3aed', secondary: '#22d3ee' }),
    createdByEmail: 'alluarjun@gmail.com',
    lessons: [],
  },
  {
    title: 'AWS CLOUD',
    slug: 'aws-cloud',
    category: 'CLOUD SERVICES',
    level: 'INTERMEDIATE',
    description: 'Plan, deploy, and manage cloud workloads on AWS with practical service patterns.',
    thumbnailUrl: courseThumbnail({ title: 'AWS CLOUD', subtitle: 'CLOUD SERVICES', category: 'CLOUD SERVICES', level: 'INTERMEDIATE', accent: '#f59e0b', secondary: '#facc15' }),
    createdByEmail: 'rohitsharma@gmail.com',
    lessons: [],
  },
  {
    title: 'CLOUD COMPUTING',
    slug: 'cloud-computing',
    category: 'CLOUD SERVICES',
    level: 'ADVANCED',
    description: 'Understand cloud platforms, distributed infrastructure, deployment, and scaling foundations.',
    thumbnailUrl: courseThumbnail({ title: 'CLOUD COMPUTING', subtitle: 'CLOUD SERVICES', category: 'CLOUD SERVICES', level: 'ADVANCED', accent: '#38bdf8', secondary: '#93c5fd' }),
    createdByEmail: 'shahrukhkhan@gmail.com',
    lessons: [],
  },
  {
    title: 'MACHINE LEARNING',
    slug: 'machine-learning',
    category: 'AI/ML',
    level: 'INTERMEDIATE',
    description: 'Learn model concepts, training workflows, evaluation, and practical AI/ML use cases.',
    thumbnailUrl: courseThumbnail({ title: 'MACHINE LEARNING', subtitle: 'AI/ML', category: 'AI/ML', level: 'INTERMEDIATE', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'viratkohli@gmail.com',
    lessons: [],
  },
  {
    title: 'ARTIFICIAL INTELLIGENCE',
    slug: 'artificial-intelligence',
    category: 'AI/ML',
    level: 'INTERMEDIATE',
    description: 'Explore intelligent systems, prompts, agents, model behavior, and applied AI workflows.',
    thumbnailUrl: courseThumbnail({ title: 'ARTIFICIAL INTELLIGENCE', subtitle: 'AI/ML', category: 'AI/ML', level: 'INTERMEDIATE', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'shahrukhkhan@gmail.com',
    lessons: [],
  },
  {
    title: 'SQL-STRUCTURED QUERY LANGUAGE',
    slug: 'sql-structured-query-language',
    category: 'DATABASE SYSTEMS',
    level: 'BEGINNER',
    description: 'Practice structured query language basics, filters, joins, grouping, and relational thinking.',
    thumbnailUrl: courseThumbnail({ title: 'SQL', subtitle: 'STRUCTURED QUERY LANGUAGE', category: 'DATABASE SYSTEMS', level: 'BEGINNER', accent: '#38bdf8', secondary: '#bfdbfe' }),
    createdByEmail: 'sachintendulkar@gmail.com',
    lessons: [],
  },
  {
    title: 'INTRODUCTION TO JAVA',
    slug: 'introduction-to-java',
    category: 'PROGRAMMING',
    level: 'INTERMEDIATE',
    description: 'Build a Java foundation with syntax, classes, methods, control flow, and object-oriented design.',
    thumbnailUrl: courseThumbnail({ title: 'JAVA', subtitle: 'INTRODUCTION TO JAVA', category: 'PROGRAMMING', level: 'INTERMEDIATE', accent: '#ef4444', secondary: '#f97316' }),
    createdByEmail: 'msdhoni@gmail.com',
    lessons: [],
  },
  {
    title: 'PYTHON PROGRAMMING',
    slug: 'python-programming',
    category: 'PROGRAMMING',
    level: 'BEGINNER',
    description: 'Learn Python syntax, functions, files, data structures, and beginner-friendly problem solving.',
    thumbnailUrl: courseThumbnail({ title: 'PYTHON PROGRAMMING', subtitle: 'PROGRAMMING', category: 'PROGRAMMING', level: 'BEGINNER', accent: '#2563eb', secondary: '#facc15' }),
    createdByEmail: 'viratkohli@gmail.com',
    lessons: [],
  },
]

function slugify(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function main() {
  const adminPasswordHash = await bcrypt.hash(adminPassword, 12)

  await prisma.$transaction([
    prisma.notification.deleteMany({}),
    prisma.activityLog.deleteMany({}),
    prisma.analyticsEvent.deleteMany({}),
    prisma.session.deleteMany({}),
    prisma.payment.deleteMany({}),
    prisma.certificate.deleteMany({}),
    prisma.progress.deleteMany({}),
    prisma.enrollment.deleteMany({}),
    prisma.chatMessage.deleteMany({}),
    prisma.lesson.deleteMany({}),
    prisma.course.deleteMany({}),
    prisma.category.deleteMany({}),
  ])

  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { in: ['admin@example.com', 'learner@example.com'] } },
        { email: { startsWith: 'codex-' } },
        { email: { endsWith: '@social.uptoskills.local' } },
        { role: 'ADMIN', email: { not: adminEmail } },
        { role: 'INSTRUCTOR', email: { notIn: instructors.map((instructor) => instructor.email) } },
      ],
    },
  })

  await prisma.user.updateMany({
    where: { role: 'USER' },
    data: { approvalStatus: 'APPROVED', isActive: true },
  })

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'UptoSkills Admin',
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      passwordHash: adminPasswordHash,
      isActive: true,
      bio: 'Platform administrator for the UptoSkills LMS.',
      expertise: 'Platform operations, reporting, user management',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/',
      },
    },
    create: {
      name: 'UptoSkills Admin',
      email: adminEmail,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      passwordHash: adminPasswordHash,
      isActive: true,
      bio: 'Platform administrator for the UptoSkills LMS.',
      expertise: 'Platform operations, reporting, user management',
      socialLinks: {
        linkedin: 'https://www.linkedin.com/',
      },
    },
  })

  for (const instructor of instructors) {
    await prisma.user.upsert({
      where: { email: instructor.email },
      update: {
        name: instructor.name,
        role: 'INSTRUCTOR',
        approvalStatus: 'APPROVED',
        avatarUrl: instructor.avatarUrl,
        bio: instructor.bio,
        expertise: instructor.expertise,
        socialLinks: instructor.socialLinks,
        isActive: true,
        passwordHash: await bcrypt.hash(`${instructor.email}:UptoSkills2026!`, 12),
      },
      create: {
        name: instructor.name,
        email: instructor.email,
        role: 'INSTRUCTOR',
        approvalStatus: 'APPROVED',
        avatarUrl: instructor.avatarUrl,
        bio: instructor.bio,
        expertise: instructor.expertise,
        socialLinks: instructor.socialLinks,
        isActive: true,
        passwordHash: await bcrypt.hash(`${instructor.email}:UptoSkills2026!`, 12),
      },
    })
  }

  const instructorRecords = await prisma.user.findMany({
    where: { role: 'INSTRUCTOR' },
    select: { id: true, email: true },
  })
  const instructorMap = new Map(instructorRecords.map((item) => [item.email, item.id]))

  const categories = [...new Set(courses.map((course) => course.category))]
  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: { name: categoryName, isActive: true },
      create: {
        name: categoryName,
        slug: slugify(categoryName),
        description: `${categoryName} learning path for the UptoSkills LMS.`,
        isActive: true,
      },
    })
  }

  for (const course of courses) {
    const creatorId = instructorMap.get(course.createdByEmail)
    const createdCourse = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
        videoPreviewUrl: course.videoPreviewUrl || null,
        isPublished: true,
        createdById: creatorId,
      },
      create: {
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
        videoPreviewUrl: course.videoPreviewUrl || null,
        isPublished: true,
        createdById: creatorId,
      },
    })

    await prisma.lesson.deleteMany({ where: { courseId: createdCourse.id } })
    for (const lesson of course.lessons) {
      await prisma.lesson.create({
        data: {
          courseId: createdCourse.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          durationMin: lesson.durationMin,
          sortOrder: lesson.sortOrder,
          quizJson: lesson.quizJson || null,
        },
      })
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
