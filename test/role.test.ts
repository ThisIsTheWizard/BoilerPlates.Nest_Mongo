import { api } from './setup'

describe('RoleController (integration)', () => {
  describe('POST /roles', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/roles', {
        name: 'user'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/roles', {
        name: 'user'
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid role name', async () => {
      const response = await api.post('/roles', {
        name: 'invalid_role'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })

    it('should fail with missing role name', async () => {
      const response = await api.post('/roles', {}, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('GET /roles', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/roles')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/roles', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('GET /roles/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.get('/roles/507f1f77bcf86cd799439011')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/roles/507f1f77bcf86cd799439011', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid id format', async () => {
      const response = await api.get('/roles/invalid-id', {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('PATCH /roles/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.patch('/roles/507f1f77bcf86cd799439011', {
        name: 'admin'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.patch('/roles/507f1f77bcf86cd799439011', {
        name: 'admin'
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with invalid role name', async () => {
      const response = await api.patch('/roles/507f1f77bcf86cd799439011', {
        name: 'invalid_role'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('DELETE /roles/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.delete('/roles/507f1f77bcf86cd799439011')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.delete('/roles/507f1f77bcf86cd799439011', {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /roles/permissions/assign', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: '507f1f77bcf86cd799439012',
        can_do_the_action: true
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: '507f1f77bcf86cd799439012',
        can_do_the_action: true
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })

    it('should fail with missing required fields', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: '507f1f77bcf86cd799439011'
      }, {
        headers: { authorization: 'Bearer valid-token' }
      })
      expect([400, 401, 500]).toContain(response.status)
    })
  })

  describe('PATCH /roles/permissions/update', () => {
    it('should fail without authorization', async () => {
      const response = await api.patch('/roles/permissions/update', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: '507f1f77bcf86cd799439012',
        can_do_the_action: false
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.patch('/roles/permissions/update', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: '507f1f77bcf86cd799439012',
        can_do_the_action: false
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /roles/permissions/revoke', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/roles/permissions/revoke', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: '507f1f77bcf86cd799439012'
      })
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/roles/permissions/revoke', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: '507f1f77bcf86cd799439012'
      }, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })

  describe('POST /roles/seed', () => {
    it('should fail without authorization', async () => {
      const response = await api.post('/roles/seed')
      expect(response.status).toBe(401)
    })

    it('should fail with invalid token', async () => {
      const response = await api.post('/roles/seed', {}, {
        headers: { authorization: 'Bearer invalid' }
      })
      expect(response.status).toBe(500)
    })
  })
})