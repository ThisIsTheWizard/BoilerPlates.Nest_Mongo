import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '..', '.env.test'), override: true })

export const api = axios.create({
  baseURL: `http://node_server_test:${process.env.PORT || 8000}`,
  timeout: 15000,
  validateStatus: () => true
})

export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
})

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})
