import { api, getAuthHeaders, loginAndGetTokens, resetDatabase } from './setup'

describe('UserController (integration)', () => {
  let accessToken: string

  beforeEach(async () => {
    await resetDatabase()
    const tokens = await loginAndGetTokens('test-1@test.com', 'password')
    accessToken = tokens.access_token
  })

  describe('POST /users', () => {
    it('success', async () => {
      const response = await api.post(
        '/users',
        {
          email: `user-${Date.now()}@example.com`,
          password: 'Password123!@#',
          first_name: 'John',
          last_name: 'Doe'
        },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ email: expect.stringContaining('@example.com') })
    })

    it('error', async () => {
      const response = await api.post(
        '/users',
        {
          email: 'invalid-email',
          password: 'Password123!@#'
        },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(400)
    })
  })

  describe('GET /users', () => {
    it('success', async () => {
      const response = await api.get('/users', getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('error', async () => {
      const response = await api.get('/users')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /users/:id', () => {
    it('success', async () => {
      const created = await api.post(
        '/users',
        {
          email: `find-${Date.now()}@example.com`,
          password: 'Password123!@#'
        },
        getAuthHeaders(accessToken)
      )
      expect(created.status).toBe(201)
      const userId = created.data.id

      const response = await api.get(`/users/${userId}`, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: userId })
    })

    it('error', async () => {
      const response = await api.get('/users/non-existent-id')
      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /users/:id', () => {
    it('success', async () => {
      const created = await api.post(
        '/users',
        {
          email: `update-${Date.now()}@example.com`,
          password: 'Password123!@#'
        },
        getAuthHeaders(accessToken)
      )
      expect(created.status).toBe(201)
      const userId = created.data.id

      const response = await api.patch(`/users/${userId}`, { first_name: 'Updated' }, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ first_name: 'Updated' })
    })

    it('error', async () => {
      const response = await api.patch('/users/non-existent-id', { first_name: 'Updated' }, getAuthHeaders(accessToken))

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /users/:id', () => {
    it('success', async () => {
      const created = await api.post(
        '/users',
        {
          email: `delete-${Date.now()}@example.com`,
          password: 'Password123!@#'
        },
        getAuthHeaders(accessToken)
      )
      expect(created.status).toBe(201)
      const userId = created.data.id

      const response = await api.delete(`/users/${userId}`, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: userId })
    })

    it('error', async () => {
      const response = await api.delete('/users/non-existent-id', getAuthHeaders(accessToken))
      expect(response.status).toBe(500)
    })
  })
})
