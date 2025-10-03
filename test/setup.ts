import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(__dirname, '..', '.env.test'), override: true })

const baseURL = `http://127.0.0.1:${process.env.PORT || 8000}`

export const api = axios.create({
  baseURL,
  timeout: 15000,
  validateStatus: () => true
})

export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
})

export const resetDatabase = async () => {
  const response = await api.post('/test/setup')
  if (response.status >= 400) {
    throw new Error(`Failed to reset database: ${response.status}`)
  }

  return response.data
}

export const getAuthHeaders = (accessToken: string) => ({
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
})

export const loginAndGetTokens = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password })
  if (response.status >= 400) {
    throw new Error(`Login failed for ${email}: ${response.status}`)
  }
  return response.data as { access_token: string; refresh_token: string }
}

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})
