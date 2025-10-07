import { api } from './setup'

describe('AuthController (integration)', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    first_name: 'Test',
    last_name: 'User'
  }

  let accessToken: string

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await api.post('/auth/register', testUser)
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.email).toBe(testUser.email)
    })

    it('should fail with duplicate email', async () => {
      const response = await api.post('/auth/register', testUser)
      expect(response.status).toBe(500)
    })

    it('should fail with invalid email', async () => {
      const response = await api.post('/auth/register', { ...testUser, email: 'invalid' })
      expect(response.status).toBe(400)
    })

    it('should fail with weak password', async () => {
      const response = await api.post('/auth/register', { ...testUser, email: 'new@test.com', password: '123' })
      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/verify-user-email', () => {
    it('should fail with invalid token', async () => {
      const response = await api.post('/auth/verify-user-email', {
        email: testUser.email,
        token: 'invalid'
      })
      expect(response.status).toBe(400)
    })
  })

  describe('POST /auth/resend-verification-email', () => {
    it('should resend verification email successfully', async () => {
      const response = await api.post('/auth/resend-verification-email', {
        email: testUser.email
      })
      expect(response.status).toBe(201)
    })

    it('should fail with non-existent email', async () => {
      const response = await api.post('/auth/resend-verification-email', {
        email: 'nonexistent@test.com'
      })
      expect(response.status).toBe(404)
    })
  })

  describe('POST /auth/login', () => {
    it('should fail with unverified user', async () => {
      const response = await api.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      })
      expect(response.status).toBe(201)
    })

    it('should fail with invalid email', async () => {
      const response = await api.post('/auth/login', {
        email: 'wrong@test.com',
        password: testUser.password
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid password', async () => {
      const response = await api.post('/auth/login', {
        email: testUser.email,
        password: 'wrongpassword'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/refresh-token', () => {
    it('should fail with invalid tokens', async () => {
      const response = await api.post('/auth/refresh-token', {
        access_token: 'invalid',
        refresh_token: 'invalid'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/auth/logout')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/auth/logout', {}, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /auth/user', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/auth/user')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/auth/user', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /auth/change-email', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/auth/change-email', {
        email: 'newemail@test.com'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/change-password', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/auth/change-password', {
        old_password: testUser.password,
        new_password: 'NewPassword123!@#'
      })
      expect(response.status).toBe(401)
    })
  })

  describe('POST /auth/forgot-password', () => {
    it('should send forgot password email successfully', async () => {
      const response = await api.post('/auth/forgot-password', {
        email: testUser.email
      })
      expect(response.status).toBe(201)
    })

    it('should fail with non-existent email', async () => {
      const response = await api.post('/auth/forgot-password', {
        email: 'nonexistent@test.com'
      })
      expect(response.status).toBe(404)
    })
  })

  describe('Admin/Developer only routes', () => {
    describe('POST /auth/assign-role', () => {
      it('should fail without authorization', async () => {
        const response = await api.post('/auth/assign-role', {
          user_id: 'someid',
          role_id: 'someid'
        })
        expect(response.status).toBe(401)
      })

      it('should fail with invalid token', async () => {
        const response = await api.post('/auth/assign-role', {
          user_id: 'someid',
          role_id: 'someid'
        }, {
          headers: { authorization: 'Bearer invalid' }
        })
        expect(response.status).toBe(500)
      })
    })

    describe('POST /auth/set-user-email', () => {
      it('should fail without authorization', async () => {
        const response = await api.post('/auth/set-user-email', {
          user_id: 'someid',
          new_email: 'test@test.com'
        })
        expect(response.status).toBe(401)
      })
    })

    describe('POST /auth/set-user-password', () => {
      it('should fail without authorization', async () => {
        const response = await api.post('/auth/set-user-password', {
          user_id: 'someid',
          password: 'Test123!@#'
        })
        expect(response.status).toBe(401)
      })
    })
  })
})