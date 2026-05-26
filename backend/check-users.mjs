import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'postgresql://postgres:postgres@localhost:5432/uptoskills?schema=public' }) })
prisma.user.findMany().then(users => {
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, role: u.role, isActive: u.isActive })))
}).finally(() => prisma.$disconnect())