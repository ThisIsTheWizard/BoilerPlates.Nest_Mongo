import { cleanupTestData, createTestFixtures, TestFixtures } from './fixtures'
import { api } from './setup'

describe('UserController (integration)', () => {
  let fixtures: TestFixtures
  let testUserId: string

  const mockUser = {
    email: 'testuser@example.com',
    password: 'Test123!@#',
    first_name: 'John',
    last_name: 'Doe'
  }

  beforeAll(async () => {
    fixtures = await createTestFixtures()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('POST /users', () => {
    it('should create user successfully with admin token', async () => {
      const response = await api.post('/users', mockUser, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.email).toBe(mockUser.email)
      expect(response.data.first_name).toBe(mockUser.first_name)
      testUserId = response.data.id
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/users', {
        email: 'another@wizardcld.com',
        password: 'Test123!@#'
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post(
        '/users',
        {
          email: 'another@wizardcld.com',
          password: 'Test123!@#'
        },
        {
          headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
        }
      )
      expect(response.status).toBe(403)
    })

    it('should fail with invalid email', async () => {
      const response = await api.post(
        '/users',
        {
          ...mockUser,
          email: 'invalid-email'
        },
        {
          headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
        }
      )
      expect(response.status).toBe(400)
    })

    it('should fail with duplicate email', async () => {
      const response = await api.post('/users', mockUser, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with weak password', async () => {
      const response = await api.post(
        '/users',
        {
          ...mockUser,
          email: 'weak@wizardcld.com',
          password: '123'
        },
        {
          headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
        }
      )
      expect(response.status).toBe(400)
    })
  })

  describe('GET /users', () => {
    it('should get all users successfully with admin token', async () => {
      const response = await api.get('/users', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })

    it('should fail without authorization', async () => {
      const response = await api.get('/users')
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.get('/users', {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/users', {
        headers: { authorization: 'Bearer invalid-token' }
      })
      expect(response.status).toBe(401)
    })
  })

  describe('GET /users/:id', () => {
    it('should get user by id successfully with admin token', async () => {
      const response = await api.get(`/users/${testUserId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', testUserId)
      expect(response.data.email).toBe(mockUser.email)
    })

    it('should fail without authorization', async () => {
      const response = await api.get(`/users/${testUserId}`)
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.get(`/users/${testUserId}`, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent user id', async () => {
      const response = await api.get('/users/507f1f77bcf86cd799439011', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should fail with invalid user id format', async () => {
      const response = await api.get('/users/invalid-id', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /users/:id', () => {
    it('should update user successfully with admin token', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      }
      const response = await api.patch(`/users/${testUserId}`, updateData, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data.first_name).toBe(updateData.first_name)
      expect(response.data.last_name).toBe(updateData.last_name)
    })

    it('should fail without authorization', async () => {
      const response = await api.patch(`/users/${testUserId}`, {
        first_name: 'Test'
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.patch(
        `/users/${testUserId}`,
        {
          first_name: 'Test'
        },
        {
          headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
        }
      )
      expect(response.status).toBe(403)
    })

    it('should fail with invalid email format', async () => {
      const response = await api.patch(
        `/users/${testUserId}`,
        {
          email: 'invalid-email'
        },
        {
          headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
        }
      )
      expect(response.status).toBe(400)
    })

    it('should fail with non-existent user id', async () => {
      const response = await api.patch(
        '/users/507f1f77bcf86cd799439011',
        {
          first_name: 'Test'
        },
        {
          headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
        }
      )
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /users/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.delete(`/users/${testUserId}`)
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.delete(`/users/${testUserId}`, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent user id', async () => {
      const response = await api.delete('/users/507f1f77bcf86cd799439011', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should delete user successfully with admin token', async () => {
      const response = await api.delete(`/users/${testUserId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
    })

    it('should fail to delete already deleted user', async () => {
      const response = await api.delete(`/users/${testUserId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      console.log(response.data)
      expect(response.status).toBe(404)
    })
  })
})
