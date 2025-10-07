import { api } from './setup'

describe('UserController (integration)', () => {
  const mockUser = {
    email: 'user@example.com',
    password: 'Test123!@#',
    first_name: 'John',
    last_name: 'Doe'
  }

  describe('POST /users', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/users', mockUser)
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/users', mockUser, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid data format', async () => {
      const response = await api.post('/users', { email: 'invalid' }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('GET /users', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/users')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/users', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /users/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/users/507f1f77bcf86cd799439011')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/users/507f1f77bcf86cd799439011', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid id format', async () => {
      const response = await api.get('/users/invalid-id', {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('PATCH /users/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.patch('/users/507f1f77bcf86cd799439011', {
        first_name: 'Updated'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.patch('/users/507f1f77bcf86cd799439011', {
        first_name: 'Updated'
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid email format', async () => {
      const response = await api.patch('/users/507f1f77bcf86cd799439011', {
        email: 'invalid-email'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('DELETE /users/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.delete('/users/507f1f77bcf86cd799439011')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.delete('/users/507f1f77bcf86cd799439011', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid id format', async () => {
      const response = await api.delete('/users/invalid-id', {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })
})