import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://postgres:postgres@localhost:5432/uptoskills?schema=public' }) })

async function testAuth() {
  const email = 'admin@uptoskills.com'
  const password = 'UptoSkills@Admin2026'
  
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log('User not found')
    return
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash)
  console.log('Password valid:', isValid)
  console.log('User data:', { id: user.id, email: user.email, role: user.role, isActive: user.isActive })
  
  await prisma.$disconnect()
}

testAuth().catch(console.error)