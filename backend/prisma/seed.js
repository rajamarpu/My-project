import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const personalities = [
  {
    name: 'Nova Mentor',
    slug: 'nova-mentor',
    archetype: 'visionary scientist',
    voiceStyle: 'calm, cinematic, precise',
    teachingStyle: 'Socratic explanations with vivid simulations',
    traits: ['curious', 'patient', 'analytical'],
    promptTemplate: 'Teach like a futuristic celebrity scientist while keeping every claim accurate and practical.',
    avatarUrl: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Astra Coach',
    slug: 'astra-coach',
    archetype: 'high-energy founder',
    voiceStyle: 'direct, motivating, witty',
    teachingStyle: 'Challenges, stories, and action plans',
    traits: ['bold', 'warm', 'strategic'],
    promptTemplate: 'Teach like a charismatic startup icon, with practical drills and crisp feedback.',
    avatarUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Lyra Sage',
    slug: 'lyra-sage',
    archetype: 'artist-scholar',
    voiceStyle: 'poetic, clear, reflective',
    teachingStyle: 'Analogies, memory hooks, and visual thinking',
    traits: ['creative', 'empathetic', 'insightful'],
    promptTemplate: 'Teach like a beloved creative icon while turning complex ideas into memorable patterns.',
    avatarUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
  },
]

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ailms.dev' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@ailms.dev',
      role: 'ADMIN',
      passwordHash: await bcrypt.hash('Admin12345', 12),
    },
  })

  await prisma.user.upsert({
    where: { email: 'learner@ailms.dev' },
    update: {},
    create: {
      name: 'Demo Learner',
      email: 'learner@ailms.dev',
      role: 'LEARNER',
      passwordHash: await bcrypt.hash('Learner12345', 12),
    },
  })

  for (const personality of personalities) {
    await prisma.aIPersonality.upsert({
      where: { slug: personality.slug },
      update: personality,
      create: personality,
    })
  }

  const course = await prisma.course.upsert({
    where: { slug: 'ai-product-mastery' },
    update: {},
    create: {
      title: 'AI Product Mastery',
      slug: 'ai-product-mastery',
      description: 'Build, evaluate, and ship AI-powered products with responsible workflows.',
      category: 'Artificial Intelligence',
      level: 'INTERMEDIATE',
      thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
      videoPreviewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      isPublished: true,
      createdById: admin.id,
      lessons: {
        create: [
          { title: 'Designing AI Learning Loops', durationMin: 18, sortOrder: 1, videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
          { title: 'Prompt Systems for Tutors', durationMin: 24, sortOrder: 2, videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
          { title: 'Measuring Learner Outcomes', durationMin: 21, sortOrder: 3, videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
        ],
      },
    },
  })

  await prisma.course.upsert({
    where: { slug: 'full-stack-postgres-lms' },
    update: {},
    create: {
      title: 'Full-Stack PostgreSQL LMS',
      slug: 'full-stack-postgres-lms',
      description: 'Create secure learner portals with Express, Prisma, PostgreSQL, and React.',
      category: 'Web Development',
      level: 'ADVANCED',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      videoPreviewUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      isPublished: true,
      createdById: admin.id,
    },
  })

  await prisma.analyticsEvent.create({ data: { courseId: course.id, eventType: 'seed_completed' } })
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
