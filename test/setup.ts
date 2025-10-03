import path from 'path'

import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ path: path.resolve(__dirname, '..', '.env.test'), override: false })

const resolveDatabaseUrl = () => {
  const fallback = 'mongodb://127.0.0.1:27018/nest_boiler_test'
  let databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? fallback

  try {
    const parsed = new URL(databaseUrl)
    if (!process.env.E2E_DATABASE_URL && ['mongo', 'mongo_test'].includes(parsed.hostname)) {
      parsed.hostname = '127.0.0.1'
      if (!parsed.port || parsed.port === '27017') {
        parsed.port = '27018'
      }
      databaseUrl = parsed.toString()
    }
  } catch (error) {
    databaseUrl = fallback
  }

  return databaseUrl
}

const baseURL = `http://127.0.0.1:${process.env.PORT || 8000}`

export const api = axios.create({
  baseURL,
  timeout: 15000,
  validateStatus: () => true
})

export const prisma = new PrismaClient({
  datasources: {
    db: { url: resolveDatabaseUrl() }
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
