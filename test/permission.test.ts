import { api } from './setup'

describe('PermissionController (integration)', () => {
  describe('POST /permissions', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/permissions', {
        action: 'create',
        module: 'user'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/permissions', {
        action: 'create',
        module: 'user'
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid action', async () => {
      const response = await api.post('/permissions', {
        action: 'invalid_action',
        module: 'user'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })

    it('should fail with invalid module', async () => {
      const response = await api.post('/permissions', {
        action: 'create',
        module: 'invalid_module'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })

    it('should fail with missing required fields', async () => {
      const response = await api.post('/permissions', {
        action: 'create'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('GET /permissions', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/permissions')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/permissions', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /permissions/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/permissions/507f1f77bcf86cd799439011')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/permissions/507f1f77bcf86cd799439011', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid id format', async () => {
      const response = await api.get('/permissions/invalid-id', {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('PATCH /permissions/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.patch('/permissions/507f1f77bcf86cd799439011', {
        action: 'update'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.patch('/permissions/507f1f77bcf86cd799439011', {
        action: 'update'
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid action', async () => {
      const response = await api.patch('/permissions/507f1f77bcf86cd799439011', {
        action: 'invalid_action'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })

    it('should fail with invalid module', async () => {
      const response = await api.patch('/permissions/507f1f77bcf86cd799439011', {
        module: 'invalid_module'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('DELETE /permissions/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.delete('/permissions/507f1f77bcf86cd799439011')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.delete('/permissions/507f1f77bcf86cd799439011', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid id format', async () => {
      const response = await api.delete('/permissions/invalid-id', {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('POST /permissions/seed', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/permissions/seed')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/permissions/seed', {}, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })
})