import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

const personalities = [
  ['Shah Rukh Khan', 'shah-rukh-khan', 'charismatic storyteller', '/celebrities/shah-rukh-khan.jpg', 'charismatic, expressive, story-led', 'Narrative lessons with confidence-building examples', ['charismatic', 'story-led', 'motivational']],
  ['Alia Bhatt', 'alia-bhatt', 'supportive creative coach', '/celebrities/alia-bhatt.jpg', 'warm, friendly, clear', 'Conversational teaching with simple analogies and recap moments', ['friendly', 'creative', 'clear']],
  ['Ranveer Singh', 'ranveer-singh', 'high-energy motivator', '/celebrities/ranveer-singh.jpg', 'energetic, bold, fast-paced', 'Interactive lessons with quick wins and bold practice tasks', ['energetic', 'interactive', 'bold']],
  ['Deepika Padukone', 'deepika-padukone', 'structured mentor', '/celebrities/deepika-padukone.jpg', 'calm, polished, focused', 'Step-by-step instruction with fundamentals and reflection checkpoints', ['calm', 'structured', 'focused']],
  ['Virat Kohli', 'virat-kohli', 'performance coach', '/celebrities/virat-kohli.jpg', 'direct, intense, performance-focused', 'Goal-driven lessons with drills, metrics, and repetition', ['disciplined', 'intense', 'performance']],
  ['MS Dhoni', 'ms-dhoni', 'strategic captain', '/celebrities/ms-dhoni.jpg', 'calm, tactical, concise', 'Tactical breakdowns with decisions, trade-offs, and composed problem solving', ['calm', 'tactical', 'leader']],
  ['Rohit Sharma', 'rohit-sharma', 'execution mentor', '/celebrities/rohit-sharma.jpg', 'relaxed, practical, confident', 'Project-first lessons with reusable patterns and calm debugging', ['practical', 'smooth', 'confident']],
  ['Sachin Tendulkar', 'sachin-tendulkar', 'fundamentals mentor', '/celebrities/sachin-tendulkar.jpg', 'patient, precise, masterclass-style', 'Fundamentals-first instruction with examples and mastery checkpoints', ['patient', 'precise', 'mastery']],
]

const courses = [
  {
    title: 'TypeScript Frontend Engineering',
    slug: 'typescript-frontend-engineering',
    description: 'Use TypeScript to build reliable React interfaces with typed state, API contracts, reusable components, and clean project structure.',
    category: 'Web Development',
    level: 'INTERMEDIATE',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Typescript_logo_2020.svg',
    lessons: ['TypeScript fundamentals', 'Typed React components', 'API contracts and state', 'Frontend architecture patterns'],
  },
  {
    title: 'C Programming Foundations',
    slug: 'c-programming-foundations',
    description: 'Learn C syntax, memory, pointers, arrays, functions, file handling, and problem solving from first principles.',
    category: 'Programming',
    level: 'BEGINNER',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/C_Programming_Language.svg',
    lessons: ['C setup and syntax', 'Variables, loops, and functions', 'Pointers and memory', 'File handling project'],
  },
  {
    title: 'React Frontend Development',
    slug: 'react-frontend-development',
    description: 'Build responsive React apps with components, props, hooks, routing, state, APIs, and reusable UI patterns.',
    category: 'Web Development',
    level: 'BEGINNER',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/React-icon.svg',
    lessons: ['React components', 'Hooks and state', 'Routing and API calls', 'Project deployment'],
  },
  {
    title: 'Python Programming for Data',
    slug: 'python-programming-for-data',
    description: 'Master Python basics, data structures, modules, notebooks, charts, and practical data analysis workflows.',
    category: 'Data Science',
    level: 'BEGINNER',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Python-logo-notext.svg',
    lessons: ['Python basics', 'Lists and dictionaries', 'Working with data files', 'Analytics dashboard'],
  },
  {
    title: 'JavaScript Full Stack Apps',
    slug: 'javascript-full-stack-apps',
    description: 'Create interactive full stack apps with modern JavaScript, REST APIs, forms, authentication, and deployment.',
    category: 'Web Development',
    level: 'INTERMEDIATE',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Unofficial_JavaScript_logo_2.svg',
    lessons: ['Modern JavaScript', 'Async APIs', 'Express endpoints', 'Full stack mini app'],
  },
  {
    title: 'SQL and PostgreSQL Mastery',
    slug: 'sql-and-postgresql-mastery',
    description: 'Design relational databases, write SQL queries, use joins, indexes, constraints, and PostgreSQL best practices.',
    category: 'Database',
    level: 'INTERMEDIATE',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Postgresql_elephant.svg',
    lessons: ['Tables and relationships', 'Joins and aggregations', 'Indexes and constraints', 'PostgreSQL project'],
  },
  {
    title: 'Node.js Backend APIs',
    slug: 'node-js-backend-apis',
    description: 'Build secure Express APIs with validation, JWT authentication, Prisma, PostgreSQL, and production structure.',
    category: 'Backend',
    level: 'ADVANCED',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Node.js_logo.svg',
    lessons: ['Express routing', 'Auth and middleware', 'Prisma models', 'API deployment'],
  },
  {
    title: 'Java Microservices',
    slug: 'java-microservices',
    description: 'Learn Java service architecture, REST APIs, layered design, testing, and deployment-ready microservice patterns.',
    category: 'Programming',
    level: 'INTERMEDIATE',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Java_programming_language_logo.svg',
    lessons: ['Java service basics', 'REST controllers', 'Persistence layer', 'Microservice deployment'],
  },
  {
    title: 'Cloud DevOps with Docker and Kubernetes',
    slug: 'cloud-devops-docker-kubernetes',
    description: 'Containerize apps, manage images, deploy to Kubernetes, and build practical CI/CD workflows.',
    category: 'Cloud Computing',
    level: 'ADVANCED',
    thumbnailUrl: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kubernetes_logo_without_workmark.svg',
    lessons: ['Docker fundamentals', 'Images and registries', 'Kubernetes deployments', 'CI/CD pipeline'],
  },
]

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@uptoskills.local' },
    update: {
      name: 'UptoSkills Admin',
      role: 'admin',
      passwordHash: await bcrypt.hash('UptoAdmin@2026', 12),
    },
    create: {
      name: 'UptoSkills Admin',
      email: 'admin@uptoskills.local',
      role: 'admin',
      passwordHash: await bcrypt.hash('UptoAdmin@2026', 12),
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Platform Admin',
      role: 'admin',
      passwordHash: await bcrypt.hash('Admin@12345', 12),
    },
    create: {
      name: 'Platform Admin',
      email: 'admin@example.com',
      role: 'admin',
      passwordHash: await bcrypt.hash('Admin@12345', 12),
    },
  })

  await prisma.user.upsert({
    where: { email: 'learner@example.com' },
    update: {
      name: 'Demo Learner',
      role: 'learner',
      passwordHash: await bcrypt.hash('Learner@12345', 12),
    },
    create: {
      name: 'Demo Learner',
      email: 'learner@example.com',
      role: 'learner',
      passwordHash: await bcrypt.hash('Learner@12345', 12),
    },
  })

  for (const [name, slug, archetype, avatarUrl, voiceStyle, teachingStyle, traits] of personalities) {
    await prisma.aIPersonality.upsert({
      where: { slug },
      update: { name, archetype, avatarUrl, voiceStyle, teachingStyle, traits, promptTemplate: `Teach ${name}'s virtual class with practical, accurate, beginner-friendly examples.`, isActive: true },
      create: { name, slug, archetype, avatarUrl, voiceStyle, teachingStyle, traits, promptTemplate: `Teach ${name}'s virtual class with practical, accurate, beginner-friendly examples.` },
    })
  }

  for (const course of courses) {
    await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
        isPublished: true,
      },
      create: {
        title: course.title,
        slug: course.slug,
        description: course.description,
        category: course.category,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
        isPublished: true,
        createdById: admin.id,
        lessons: {
          create: course.lessons.map((title, index) => ({
            title,
            durationMin: 20 + index * 8,
            sortOrder: index + 1,
            videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
          })),
        },
      },
    })
  }

  await prisma.analyticsEvent.create({ data: { eventType: 'seed_completed', metadata: { courses: courses.length, personalities: personalities.length } } })
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
