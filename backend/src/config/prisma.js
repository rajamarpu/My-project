import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
})

export async function connectPrisma() {
  await prisma.$connect()
  console.log('PostgreSQL connected through Prisma')
}

export default prisma
