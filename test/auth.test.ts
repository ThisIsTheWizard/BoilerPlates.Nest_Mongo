import { cleanupTestData, createTestFixtures, TestFixtures } from './fixtures'
import { api } from './setup'

describe('AuthController (integration)', () => {
  let fixtures: TestFixtures

  beforeAll(async () => {
    fixtures = await createTestFixtures()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('POST /auth/register', () => {
    const newUser = {
      email: 'newuser@wizardcld.com',
      password: 'NewUser123!@#',
      first_name: 'New',
      last_name: 'User'
    }

    it('should register a new user successfully', async () => {
      const response = await api.post('/auth/register', newUser)
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.email).toBe(newUser.email)
      expect(response.data.status).toBe('unverified')
    })

    it('should fail with duplicate email', async () => {
      const response = await api.post('/auth/register', newUser)
      expect(response.status).toBe(400)
    })

    it('should fail with invalid email', async () => {
      const response = await api.post('/auth/register', { ...newUser, email: 'invalid' })
      expect(response.status).toBe(400)
    })

    it('should fail with weak password', async () => {
      const response = await api.post('/auth/register', {
        ...newUser,
        email: 'weak@wizardcld.com',
        password: '123'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await api.post('/auth/login', {
        email: fixtures.adminUser.email,
        password: 'Admin123!@#'
      })
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('access_token')
      expect(response.data).toHaveProperty('refresh_token')
    })

    it('should fail with invalid email', async () => {
      const response = await api.post('/auth/login', {
        email: 'nonexistent@wizardcld.com',
        password: 'Admin123!@#'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid password', async () => {
      const response = await api.post('/auth/login', {
        email: fixtures.adminUser.email,
        password: 'wrongpassword'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      // First login to get fresh tokens
      const loginResponse = await api.post('/auth/login', {
        email: fixtures.adminUser.email,
        password: 'Admin123!@#'
      })
      expect(loginResponse.status).toBe(201)

      const response = await api.post('/auth/refresh-token', {
        access_token: loginResponse.data.access_token,
        refresh_token: loginResponse.data.refresh_token
      })
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('access_token')
    })

    it('should fail with invalid tokens', async () => {
      const response = await api.post('/auth/refresh-token', {
        access_token: 'invalid',
        refresh_token: 'invalid'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('GET /auth/user', () => {
    it('should get authenticated user successfully', async () => {
      const response = await api.get('/auth/user', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', fixtures.adminUser.id)
      expect(response.data.email).toBe(fixtures.adminUser.email)
    })

    it('should fail without authorization', async () => {
      const response = await api.get('/auth/user')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/auth/user', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await api.post(
        '/auth/logout',
        {},
        {
          headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
        }
      )
      expect(response.status).toBe(201)
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/auth/logout')
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/change-password', () => {
    it('should change password successfully', async () => {
      const response = await api.post(
        '/auth/change-password',
        {
          old_password: 'User123!@#',
          new_password: 'NewPassword123!@#'
        },
        {
          headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
        }
      )
      expect(response.status).toBe(201)
    })

    it('should fail with wrong old password', async () => {
      const response = await api.post(
        '/auth/change-password',
        {
          old_password: 'wrongpassword',
          new_password: 'NewPassword123!@#'
        },
        {
          headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
        }
      )
      expect(response.status).toBe(400)
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/auth/change-password', {
        old_password: 'User123!@#',
        new_password: 'NewPassword123!@#'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/forgot-password', () => {
    it('should send forgot password email successfully', async () => {
      const response = await api.post('/auth/forgot-password', {
        email: fixtures.adminUser.email
      })
      expect(response.status).toBe(201)
    })

    it('should fail with non-existent email', async () => {
      const response = await api.post('/auth/forgot-password', {
        email: 'nonexistent@wizardcld.com'
      })
      expect(response.status).toBe(404)
    })
  })

  describe('Admin/Developer only routes', () => {
    describe('POST /auth/assign-role', () => {
      it('should assign role successfully with admin token', async () => {
        const response = await api.post(
          '/auth/assign-role',
          {
            user_id: fixtures.regularUser.id,
            role_id: fixtures.roles.moderator.id
          },
          {
            headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
          }
        )
        expect(response.status).toBe(201)
      })

      it('should fail without admin/developer role', async () => {
        const response = await api.post(
          '/auth/assign-role',
          {
            user_id: fixtures.regularUser.id,
            role_id: fixtures.roles.moderator.id
          },
          {
            headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
          }
        )
        expect(response.status).toBe(403)
      })

      it('should fail without authorization', async () => {
        const response = await api.post('/auth/assign-role', {
          user_id: fixtures.regularUser.id,
          role_id: fixtures.roles.moderator.id
        })
        expect(response.status).toBe(401)
      })
    })

    describe('POST /auth/revoke-role', () => {
      it('should revoke role successfully with admin token', async () => {
        const response = await api.post(
          '/auth/revoke-role',
          {
            user_id: fixtures.regularUser.id,
            role_id: fixtures.roles.moderator.id
          },
          {
            headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
          }
        )
        expect(response.status).toBe(200)
      })

      it('should fail without admin/developer role', async () => {
        const response = await api.post(
          '/auth/revoke-role',
          {
            user_id: fixtures.regularUser.id,
            role_id: fixtures.roles.user.id
          },
          {
            headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
          }
        )
        expect(response.status).toBe(403)
      })
    })

    describe('POST /auth/set-user-email', () => {
      it('should set user email successfully with admin token', async () => {
        const response = await api.post(
          '/auth/set-user-email',
          {
            user_id: fixtures.regularUser.id,
            new_email: 'updated@wizardcld.com'
          },
          {
            headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
          }
        )
        expect(response.status).toBe(201)
      })

      it('should fail without admin/developer role', async () => {
        const response = await api.post(
          '/auth/set-user-email',
          {
            user_id: fixtures.regularUser.id,
            new_email: 'test@wizardcld.com'
          },
          {
            headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
          }
        )
        expect(response.status).toBe(403)
      })
    })

    describe('POST /auth/set-user-password', () => {
      it('should set user password successfully with admin token', async () => {
        const response = await api.post(
          '/auth/set-user-password',
          {
            user_id: fixtures.regularUser.id,
            password: 'AdminSet123!@#'
          },
          {
            headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
          }
        )
        expect(response.status).toBe(201)
      })

      it('should fail without admin/developer role', async () => {
        const response = await api.post(
          '/auth/set-user-password',
          {
            user_id: fixtures.regularUser.id,
            password: 'Test123!@#'
          },
          {
            headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
          }
        )
        expect(response.status).toBe(403)
      })
    })
  })
})
