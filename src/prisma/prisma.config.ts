import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default {
  seed: async () => {
    await prisma.$executeRaw`ts-node src/prisma/seed.ts`
  }
}
