import { api, prisma } from './setup'
import { createTestFixtures, cleanupTestData, TestFixtures } from './fixtures'

describe('PermissionController (integration)', () => {
  let fixtures: TestFixtures
  let testPermissionId: string

  beforeAll(async () => {
    fixtures = await createTestFixtures()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('POST /permissions', () => {
    it('should create permission successfully with admin token', async () => {
      // First delete if exists to avoid conflicts
      await prisma.permission.deleteMany({ 
        where: { 
          action: 'update',
          module: 'role_user'
        } 
      })
      
      const response = await api.post('/permissions', {
        action: 'update',
        module: 'role_user'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.action).toBe('update')
      expect(response.data.module).toBe('role_user')
      testPermissionId = response.data.id
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/permissions', {
        action: 'create',
        module: 'user'
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post('/permissions', {
        action: 'create',
        module: 'user'
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid action', async () => {
      const response = await api.post('/permissions', {
        action: 'invalid_action',
        module: 'user'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with invalid module', async () => {
      const response = await api.post('/permissions', {
        action: 'create',
        module: 'invalid_module'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with duplicate permission', async () => {
      const response = await api.post('/permissions', {
        action: 'update',
        module: 'role_user'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with missing required fields', async () => {
      const response = await api.post('/permissions', {
        action: 'create'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })
  })

  describe('GET /permissions', () => {
    it('should get all permissions successfully with admin token', async () => {
      const response = await api.get('/permissions', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })

    it('should fail without authorization', async () => {
      const response = await api.get('/permissions')
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.get('/permissions', {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/permissions', {
        headers: { authorization: 'Bearer invalid-token' }
      })
      expect(response.status).toBe(401)
    })
  })

  describe('GET /permissions/:id', () => {
    it('should get permission by id successfully with admin token', async () => {
      const response = await api.get(`/permissions/${testPermissionId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', testPermissionId)
      expect(response.data.action).toBe('update')
      expect(response.data.module).toBe('role_user')
    })

    it('should fail without authorization', async () => {
      const response = await api.get(`/permissions/${testPermissionId}`)
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.get(`/permissions/${testPermissionId}`, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent permission id', async () => {
      const response = await api.get('/permissions/507f1f77bcf86cd799439011', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should fail with invalid permission id format', async () => {
      const response = await api.get('/permissions/invalid-id', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /permissions/:id', () => {
    it('should update permission successfully with admin token', async () => {
      const response = await api.patch(`/permissions/${testPermissionId}`, {
        action: 'delete'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data.action).toBe('delete')
    })

    it('should fail without authorization', async () => {
      const response = await api.patch(`/permissions/${testPermissionId}`, {
        action: 'create'
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.patch(`/permissions/${testPermissionId}`, {
        action: 'create'
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid action', async () => {
      const response = await api.patch(`/permissions/${testPermissionId}`, {
        action: 'invalid_action'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with invalid module', async () => {
      const response = await api.patch(`/permissions/${testPermissionId}`, {
        module: 'invalid_module'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with non-existent permission id', async () => {
      const response = await api.patch('/permissions/507f1f77bcf86cd799439011', {
        action: 'create'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should update permission module successfully', async () => {
      const response = await api.patch(`/permissions/${testPermissionId}`, {
        module: 'user'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data.module).toBe('user')
    })
  })

  describe('POST /permissions/seed', () => {
    it('should seed permissions successfully with admin token', async () => {
      const response = await api.post('/permissions/seed', {}, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/permissions/seed')
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post('/permissions/seed', {}, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should handle seeding when permissions already exist', async () => {
      const response = await api.post('/permissions/seed', {}, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
    })
  })

  describe('DELETE /permissions/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.delete(`/permissions/${testPermissionId}`)
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.delete(`/permissions/${testPermissionId}`, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent permission id', async () => {
      const response = await api.delete('/permissions/507f1f77bcf86cd799439011', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should fail with invalid permission id format', async () => {
      const response = await api.delete('/permissions/invalid-id', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should delete permission successfully with admin token', async () => {
      const response = await api.delete(`/permissions/${testPermissionId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
    })

    it('should fail to delete already deleted permission', async () => {
      const response = await api.delete(`/permissions/${testPermissionId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })
  })
})