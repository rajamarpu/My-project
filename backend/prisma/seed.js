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

const courses = [
  {
    title: 'Cloud DevOps with Docker & Kubernetes',
    slug: 'cloud-devops-docker-kubernetes',
    category: 'Cloud Computing',
    level: 'ADVANCED',
    description: 'Build containers, deploy services, and ship with modern cloud operations.',
    thumbnailUrl: '/celebrities/shah-rukh-khan.jpg',
    createdByEmail: 'shahrukhkhan@gmail.com',
    lessons: [
      { title: 'Containers and Docker images', description: 'Build and ship portable services.', type: 'ARTICLE', durationMin: 18, sortOrder: 0 },
      { title: 'Kubernetes deployments', description: 'Run services across clusters and manage rollouts.', type: 'ARTICLE', durationMin: 32, sortOrder: 1 },
      { title: 'CI/CD release workflow', description: 'Connect source control to production delivery.', type: 'QUIZ', durationMin: 24, sortOrder: 2, quizJson: { questions: 4 } },
    ],
  },
  {
    title: 'TypeScript Frontend Engineering',
    slug: 'typescript-frontend-engineering',
    category: 'Web Development',
    level: 'INTERMEDIATE',
    description: 'Design stable React interfaces with typed state and reusable component architecture.',
    thumbnailUrl: '/celebrities/deepika-padukone.jpg',
    createdByEmail: 'deepikapadukone@gmail.com',
    lessons: [
      { title: 'TypeScript essentials', description: 'Learn types, interfaces, and inference.', type: 'ARTICLE', durationMin: 20, sortOrder: 0 },
      { title: 'Typed component design', description: 'Build predictable React props and state.', type: 'ARTICLE', durationMin: 28, sortOrder: 1 },
      { title: 'Frontend architecture patterns', description: 'Organize scalable frontends.', type: 'QUIZ', durationMin: 30, sortOrder: 2, quizJson: { questions: 5 } },
    ],
  },
  {
    title: 'Python for Cricket Data Analytics',
    slug: 'python-cricket-data-analytics',
    category: 'Programming',
    level: 'BEGINNER',
    description: 'Use Python to explore sports datasets and build useful analytics dashboards.',
    thumbnailUrl: '/celebrities/virat-kohli.jpg',
    createdByEmail: 'viratkohli@gmail.com',
    lessons: [
      { title: 'Python basics for analytics', description: 'Variables, loops, and functions.', type: 'ARTICLE', durationMin: 22, sortOrder: 0 },
      { title: 'Data cleaning and sorting', description: 'Shape raw data into useful datasets.', type: 'ARTICLE', durationMin: 28, sortOrder: 1 },
      { title: 'Visualize match trends', description: 'Create simple charts from cricket stats.', type: 'QUIZ', durationMin: 26, sortOrder: 2, quizJson: { questions: 4 } },
    ],
  },
  {
    title: 'Java Microservices for Sports Platforms',
    slug: 'java-microservices-sports-platforms',
    category: 'Programming',
    level: 'INTERMEDIATE',
    description: 'Build resilient backend services for high-traffic product experiences.',
    thumbnailUrl: '/celebrities/ms-dhoni.jpg',
    createdByEmail: 'msdhoni@gmail.com',
    lessons: [
      { title: 'Service boundaries', description: 'Split a system into reliable services.', type: 'ARTICLE', durationMin: 24, sortOrder: 0 },
      { title: 'REST APIs and contracts', description: 'Create predictable API behavior.', type: 'ARTICLE', durationMin: 30, sortOrder: 1 },
      { title: 'Deploy and monitor', description: 'Ship, observe, and iterate safely.', type: 'QUIZ', durationMin: 34, sortOrder: 2, quizJson: { questions: 5 } },
    ],
  },
  {
    title: 'JavaScript Fullstack Apps',
    slug: 'javascript-fullstack-apps',
    category: 'Web Development',
    level: 'INTERMEDIATE',
    description: 'Create fullstack apps with modern JavaScript, APIs, and product workflows.',
    thumbnailUrl: '/celebrities/rohit-sharma.jpg',
    createdByEmail: 'rohitsharma@gmail.com',
    lessons: [
      { title: 'Modern JavaScript foundations', description: 'Syntax, modules, and async patterns.', type: 'ARTICLE', durationMin: 18, sortOrder: 0 },
      { title: 'Fullstack app flow', description: 'Move data between frontend and backend.', type: 'ARTICLE', durationMin: 30, sortOrder: 1 },
      { title: 'Deployment checklist', description: 'Ship apps with fewer surprises.', type: 'QUIZ', durationMin: 24, sortOrder: 2, quizJson: { questions: 4 } },
    ],
  },
  {
    title: 'React Interfaces for Fan Engagement',
    slug: 'react-interfaces-fan-engagement',
    category: 'Web Development',
    level: 'BEGINNER',
    description: 'Build responsive React dashboards, panels, and learner experiences.',
    thumbnailUrl: '/celebrities/sachin-tendulkar.jpg',
    createdByEmail: 'sachintendulkar@gmail.com',
    lessons: [
      { title: 'React components', description: 'Compose reliable interface building blocks.', type: 'ARTICLE', durationMin: 16, sortOrder: 0 },
      { title: 'State and props', description: 'Connect UI to dynamic data.', type: 'ARTICLE', durationMin: 24, sortOrder: 1 },
      { title: 'Performance basics', description: 'Keep the UI fast and predictable.', type: 'QUIZ', durationMin: 20, sortOrder: 2, quizJson: { questions: 4 } },
    ],
  },
  {
    title: 'React Motion and UI Polish',
    slug: 'react-motion-ui-polish',
    category: 'Web Development',
    level: 'INTERMEDIATE',
    description: 'Build polished React interfaces with motion, layout rhythm, and accessible interaction states.',
    thumbnailUrl: '/celebrities/allu-arjun.jpg',
    createdByEmail: 'alluarjun@gmail.com',
    lessons: [
      { title: 'Motion principles for interfaces', description: 'Use animation to clarify state and flow.', type: 'ARTICLE', durationMin: 18, sortOrder: 0 },
      { title: 'Responsive UI rhythm', description: 'Tune spacing, hierarchy, and component behavior.', type: 'ARTICLE', durationMin: 26, sortOrder: 1 },
      { title: 'Accessible interaction states', description: 'Design focus, hover, loading, and empty states.', type: 'QUIZ', durationMin: 22, sortOrder: 2, quizJson: { questions: 4 } },
    ],
  },
  {
    title: 'C Programming Foundations',
    slug: 'c-programming-foundations',
    category: 'Programming',
    level: 'BEGINNER',
    description: 'Learn the core building blocks of programming with a step-by-step foundation.',
    thumbnailUrl: '/celebrities/alia-bhatt.jpg',
    createdByEmail: 'aliabhatt@gmail.com',
    lessons: [
      { title: 'First C program', description: 'Write, compile, and run your first example.', type: 'ARTICLE', durationMin: 18, sortOrder: 0 },
      { title: 'Functions and loops', description: 'Control flow and reusable logic.', type: 'ARTICLE', durationMin: 26, sortOrder: 1 },
      { title: 'Arrays and pointers', description: 'Understand the memory model.', type: 'QUIZ', durationMin: 32, sortOrder: 2, quizJson: { questions: 5 } },
    ],
  },
  {
    title: 'SQL and PostgreSQL Mastery',
    slug: 'sql-and-postgresql-mastery',
    category: 'Database',
    level: 'INTERMEDIATE',
    description: 'Design relational schemas, indexes, queries, and production-ready SQL workflows.',
    thumbnailUrl: '/celebrities/ranveer-singh.jpg',
    createdByEmail: 'ranveersingh@gmail.com',
    lessons: [
      { title: 'Tables and relationships', description: 'Model data correctly from day one.', type: 'ARTICLE', durationMin: 24, sortOrder: 0 },
      { title: 'Joins and aggregations', description: 'Answer real product questions with SQL.', type: 'ARTICLE', durationMin: 30, sortOrder: 1 },
      { title: 'Indexes and constraints', description: 'Keep data fast, safe, and consistent.', type: 'QUIZ', durationMin: 28, sortOrder: 2, quizJson: { questions: 5 } },
    ],
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
