import { RoleName } from '@prisma/client'

import { api, getAuthHeaders, loginAndGetTokens, prisma, resetDatabase } from './setup'

describe('AuthController (integration)', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  describe('POST /auth/register', () => {
    it('success', async () => {
      const email = `new-user-${Date.now()}@example.com`
      const response = await api.post('/auth/register', {
        email,
        password: 'Password123!@#',
        first_name: 'Test',
        last_name: 'User'
      })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ email, status: expect.any(String) })
    })

    it('error', async () => {
      const email = `duplicate-user-${Date.now()}@example.com`
      const firstResponse = await api.post('/auth/register', {
        email,
        password: 'Password123!@#',
        first_name: 'Test',
        last_name: 'User'
      })
      expect(firstResponse.status).toBe(201)

      const response = await api.post('/auth/register', {
        email,
        password: 'Password123!@#',
        first_name: 'Test',
        last_name: 'User'
      })

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/verify-user-email', () => {
    it('success', async () => {
      const email = `verify-user-${Date.now()}@example.com`
      const registration = await api.post('/auth/register', {
        email,
        password: 'Password123!@#'
      })
      expect(registration.status).toBe(201)

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: { email, type: 'user_verification', status: 'unverified' }
      })
      expect(tokenRecord).not.toBeNull()

      const response = await api.post('/auth/verify-user-email', {
        email,
        token: tokenRecord!.token
      })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ email, status: 'active' })
    })

    it('error', async () => {
      const email = `verify-user-error-${Date.now()}@example.com`
      const registration = await api.post('/auth/register', {
        email,
        password: 'Password123!@#'
      })
      expect(registration.status).toBe(201)

      const response = await api.post('/auth/verify-user-email', {
        email,
        token: 'invalid-token'
      })

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/resend-verification-email', () => {
    it('success', async () => {
      const email = `resend-${Date.now()}@example.com`
      const registration = await api.post('/auth/register', {
        email,
        password: 'Password123!@#'
      })
      expect(registration.status).toBe(201)

      const response = await api.post('/auth/resend-verification-email', { email })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'VERIFICATION_EMAIL_SENT', success: true })
    })

    it('error', async () => {
      const response = await api.post('/auth/resend-verification-email', { email: 'missing@example.com' })
      expect(response.status).toBe(404)
    })
  })

  describe('POST /auth/login', () => {
    it('success', async () => {
      const response = await api.post('/auth/login', {
        email: 'test-1@test.com',
        password: 'password'
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('access_token')
      expect(response.data).toHaveProperty('refresh_token')
    })

    it('error', async () => {
      const response = await api.post('/auth/login', {
        email: 'test-1@test.com',
        password: 'wrong-password'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/refresh-token', () => {
    it('success', async () => {
      const tokens = await loginAndGetTokens('test-1@test.com', 'password')

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const response = await api.post('/auth/refresh-token', tokens)

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('access_token')
      expect(response.data).toHaveProperty('refresh_token')
      expect(response.data.access_token).not.toEqual(tokens.access_token)
      expect(response.data.refresh_token).not.toEqual(tokens.refresh_token)
    })

    it('error', async () => {
      const response = await api.post('/auth/refresh-token', {
        access_token: 'invalid',
        refresh_token: 'invalid'
      })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post('/auth/logout', {}, getAuthHeaders(access_token))

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'USER_LOGGED_OUT', success: true })
    })

    it('error', async () => {
      const response = await api.post('/auth/logout')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/change-email', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const newEmail = `changed-${Date.now()}@example.com`

      const response = await api.post('/auth/change-email', { email: newEmail }, getAuthHeaders(access_token))

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ id: expect.any(String), email: 'test-1@test.com' })

      const updatedUser = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(updatedUser?.new_email).toBe(newEmail)
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post('/auth/change-email', { email: 'invalid-email' }, getAuthHeaders(access_token))

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/cancel-change-email', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const newEmail = `cancel-${Date.now()}@example.com`
      await api.post('/auth/change-email', { email: newEmail }, getAuthHeaders(access_token))

      const response = await api.post('/auth/cancel-change-email', { email: newEmail }, getAuthHeaders(access_token))

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'EMAIL_CHANGE_CANCELLED', success: true })
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post(
        '/auth/cancel-change-email',
        { email: 'missing@example.com' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/verify-change-email', () => {
    it('success', async () => {
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(user).not.toBeNull()

      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const newEmail = `verify-change-${Date.now()}@example.com`
      await api.post('/auth/change-email', { email: newEmail }, getAuthHeaders(access_token))

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          user_id: user!.id,
          type: 'user_verification',
          status: 'unverified',
          email: newEmail
        }
      })
      expect(tokenRecord).not.toBeNull()

      const response = await api.post(
        '/auth/verify-change-email',
        { token: tokenRecord!.token },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data.email).toBe(newEmail)
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const response = await api.post(
        '/auth/verify-change-email',
        { token: 'invalid-token' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/set-user-email', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(user).not.toBeNull()
      const newEmail = `set-email-${Date.now()}@example.com`

      const response = await api.post(
        '/auth/set-user-email',
        { new_email: newEmail, user_id: user!.id },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ email: newEmail })
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(user).not.toBeNull()

      const response = await api.post(
        '/auth/set-user-email',
        { new_email: 'test-2@test.com', user_id: user!.id },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/change-password', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post(
        '/auth/change-password',
        { old_password: 'password', new_password: 'NewPassword123!@#' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ email: 'test-1@test.com', id: expect.any(String) })
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post(
        '/auth/change-password',
        { old_password: 'password', new_password: 'password' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/set-user-password', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(user).not.toBeNull()

      const response = await api.post(
        '/auth/set-user-password',
        { password: 'AnotherPassword123!@#', user_id: user!.id },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ id: user!.id, message: 'PASSWORD_SET' })
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post(
        '/auth/set-user-password',
        { password: 'Password123!@#', user_id: 'non-existent-id' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/forgot-password', () => {
    it('success', async () => {
      const response = await api.post('/auth/forgot-password', { email: 'test-1@test.com' })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'FORGOT_PASSWORD_EMAIL_SENT', success: true })
    })

    it('error', async () => {
      const response = await api.post('/auth/forgot-password', { email: 'missing@example.com' })
      expect(response.status).toBe(404)
    })
  })

  describe('POST /auth/retry-forgot-password', () => {
    it('success', async () => {
      const response = await api.post('/auth/retry-forgot-password', { email: 'test-1@test.com' })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'FORGOT_PASSWORD_EMAIL_RESENT', success: true })
    })

    it('error', async () => {
      const response = await api.post('/auth/retry-forgot-password', { email: 'missing@example.com' })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/verify-forgot-password', () => {
    it('success', async () => {
      const email = 'test-1@test.com'
      const forgot = await api.post('/auth/forgot-password', { email })
      expect(forgot.status).toBe(201)

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: { email, type: 'forgot_password', status: 'unverified' },
        orderBy: { created_at: 'desc' }
      })
      expect(tokenRecord).not.toBeNull()

      const response = await api.post('/auth/verify-forgot-password', {
        email,
        password: 'RecoveredPassword123!@#',
        token: tokenRecord!.token
      })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ email })
    })

    it('error', async () => {
      const response = await api.post('/auth/verify-forgot-password', {
        email: 'test-1@test.com',
        password: 'RecoveredPassword123!@#',
        token: 'invalid-token'
      })

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/verify-forgot-password-code', () => {
    it('success', async () => {
      const email = 'test-1@test.com'
      const forgot = await api.post('/auth/forgot-password', { email })
      expect(forgot.status).toBe(201)

      const tokenRecord = await prisma.verificationToken.findFirst({
        where: { email, type: 'forgot_password', status: 'unverified' },
        orderBy: { created_at: 'desc' }
      })
      expect(tokenRecord).not.toBeNull()

      const response = await api.post('/auth/verify-forgot-password-code', {
        email,
        token: tokenRecord!.token
      })

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'OTP_IS_VALID', success: true })
    })

    it('error', async () => {
      const response = await api.post('/auth/verify-forgot-password-code', {
        email: 'test-1@test.com',
        token: 'invalid-token'
      })

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/verify-user-password', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.post(
        '/auth/verify-user-password',
        { password: 'password' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ message: 'PASSWORD_IS_CORRECT', success: true })
    })

    it('error', async () => {
      const response = await api.post('/auth/verify-user-password', { password: 'password' })
      expect(response.status).toBe(401)
    })
  })

  describe('GET /auth/user', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')

      const response = await api.get('/auth/user', getAuthHeaders(access_token))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ email: 'test-1@test.com', roles: expect.arrayContaining(['user']) })
    })

    it('error', async () => {
      const response = await api.get('/auth/user')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/assign-role', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      const role = await prisma.role.findFirst({ where: { name: RoleName.admin } })
      expect(user).not.toBeNull()
      expect(role).not.toBeNull()

      const response = await api.post(
        '/auth/assign-role',
        { user_id: user!.id, role_id: role!.id },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ role_id: role!.id, user_id: user!.id })
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(user).not.toBeNull()

      const response = await api.post(
        '/auth/assign-role',
        { user_id: user!.id, role_id: 'invalid-role-id' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/revoke-role', () => {
    it('success', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      const role = await prisma.role.findFirst({ where: { name: RoleName.user } })
      expect(user).not.toBeNull()
      expect(role).not.toBeNull()

      const response = await api.post(
        '/auth/revoke-role',
        { user_id: user!.id, role_id: role!.id },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ role_id: role!.id, user_id: user!.id })
    })

    it('error', async () => {
      const { access_token } = await loginAndGetTokens('test-1@test.com', 'password')
      const user = await prisma.user.findFirst({ where: { email: 'test-1@test.com' } })
      expect(user).not.toBeNull()

      const response = await api.post(
        '/auth/revoke-role',
        { user_id: user!.id, role_id: 'invalid-role-id' },
        getAuthHeaders(access_token)
      )

      expect(response.status).toBe(500)
    })
  })
})
