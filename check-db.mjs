import { PrismaClient } from './backend/src/generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
dotenv.config({ path: './backend/.env' })

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'admin@example.com' } })
    console.log('Admin user:', user ? { id: user.id, name: user.name, email: user.email, role: user.role } : 'Not found')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()