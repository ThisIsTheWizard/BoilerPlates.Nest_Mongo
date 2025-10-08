import { api, prisma } from './setup'
import { createTestFixtures, cleanupTestData, TestFixtures } from './fixtures'

describe('RoleController (integration)', () => {
  let fixtures: TestFixtures
  let testRoleId: string
  let testPermissionId: string

  beforeAll(async () => {
    fixtures = await createTestFixtures()
    // Get a permission for testing
    testPermissionId = fixtures.permissions[0].id
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('POST /roles', () => {
    it('should create role successfully with admin token', async () => {
      // First delete if exists to avoid conflicts
      await prisma.role.deleteMany({ where: { name: 'moderator' } })
      
      const response = await api.post('/roles', {
        name: 'moderator'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('id')
      expect(response.data.name).toBe('moderator')
      testRoleId = response.data.id
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/roles', {
        name: 'user'
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post('/roles', {
        name: 'user'
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid role name', async () => {
      const response = await api.post('/roles', {
        name: 'invalid_role'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with duplicate role name', async () => {
      const response = await api.post('/roles', {
        name: 'moderator'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with missing role name', async () => {
      const response = await api.post('/roles', {}, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })
  })

  describe('GET /roles', () => {
    it('should get all roles successfully with admin token', async () => {
      const response = await api.get('/roles', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })

    it('should fail without authorization', async () => {
      const response = await api.get('/roles')
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.get('/roles', {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid token', async () => {
      const response = await api.get('/roles', {
        headers: { authorization: 'Bearer invalid-token' }
      })
      expect(response.status).toBe(401)
    })
  })

  describe('GET /roles/:id', () => {
    it('should get role by id successfully with admin token', async () => {
      const response = await api.get(`/roles/${testRoleId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('id', testRoleId)
      expect(response.data.name).toBe('moderator')
    })

    it('should fail without authorization', async () => {
      const response = await api.get(`/roles/${testRoleId}`)
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.get(`/roles/${testRoleId}`, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent role id', async () => {
      const response = await api.get('/roles/507f1f77bcf86cd799439011', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should fail with invalid role id format', async () => {
      const response = await api.get('/roles/invalid-id', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /roles/:id', () => {
    it('should update role successfully with admin token', async () => {
      // Delete the existing developer role to make room for update
      const existingDeveloperRole = await prisma.role.findUnique({ where: { name: 'developer' } })
      if (existingDeveloperRole) {
        await prisma.roleUser.deleteMany({ where: { role_id: existingDeveloperRole.id } })
        await prisma.rolePermission.deleteMany({ where: { role_id: existingDeveloperRole.id } })
        await prisma.role.delete({ where: { id: existingDeveloperRole.id } })
      }
      
      const response = await api.patch(`/roles/${testRoleId}`, {
        name: 'developer'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
      expect(response.data.name).toBe('developer')
    })

    it('should fail without authorization', async () => {
      const response = await api.patch(`/roles/${testRoleId}`, {
        name: 'admin'
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.patch(`/roles/${testRoleId}`, {
        name: 'admin'
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with invalid role name', async () => {
      const response = await api.patch(`/roles/${testRoleId}`, {
        name: 'invalid_role'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(400)
    })

    it('should fail with non-existent role id', async () => {
      const response = await api.patch('/roles/507f1f77bcf86cd799439011', {
        name: 'admin'
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })
  })

  describe('POST /roles/permissions/assign', () => {
    it('should assign permission successfully with admin token', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: testRoleId,
        permission_id: testPermissionId,
        can_do_the_action: true
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: testRoleId,
        permission_id: testPermissionId,
        can_do_the_action: true
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: testRoleId,
        permission_id: testPermissionId,
        can_do_the_action: true
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent role id', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: '507f1f77bcf86cd799439011',
        permission_id: testPermissionId,
        can_do_the_action: true
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should fail with non-existent permission id', async () => {
      const response = await api.post('/roles/permissions/assign', {
        role_id: testRoleId,
        permission_id: '507f1f77bcf86cd799439011',
        can_do_the_action: true
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /roles/permissions/update', () => {
    it('should update permission successfully with admin token', async () => {
      const response = await api.patch('/roles/permissions/update', {
        role_id: testRoleId,
        permission_id: testPermissionId,
        can_do_the_action: false
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
    })

    it('should fail without authorization', async () => {
      const response = await api.patch('/roles/permissions/update', {
        role_id: testRoleId,
        permission_id: testPermissionId,
        can_do_the_action: true
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.patch('/roles/permissions/update', {
        role_id: testRoleId,
        permission_id: testPermissionId,
        can_do_the_action: true
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })
  })

  describe('POST /roles/permissions/revoke', () => {
    it('should revoke permission successfully with admin token', async () => {
      // The permission was assigned in the previous test, so it should exist
      const response = await api.post('/roles/permissions/revoke', {
        role_id: testRoleId,
        permission_id: testPermissionId
      }, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/roles/permissions/revoke', {
        role_id: testRoleId,
        permission_id: testPermissionId
      })
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post('/roles/permissions/revoke', {
        role_id: testRoleId,
        permission_id: testPermissionId
      }, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })
  })

  describe('POST /roles/seed', () => {
    it('should seed roles successfully with admin token', async () => {
      const response = await api.post('/roles/seed', {}, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(201)
    })

    it('should fail without authorization', async () => {
      const response = await api.post('/roles/seed')
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.post('/roles/seed', {}, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })
  })

  describe('DELETE /roles/:id', () => {
    it('should fail without authorization', async () => {
      const response = await api.delete(`/roles/${testRoleId}`)
      expect(response.status).toBe(401)
    })

    it('should fail without admin/developer role', async () => {
      const response = await api.delete(`/roles/${testRoleId}`, {
        headers: { authorization: `Bearer ${fixtures.regularUser.accessToken}` }
      })
      expect(response.status).toBe(403)
    })

    it('should fail with non-existent role id', async () => {
      const response = await api.delete('/roles/507f1f77bcf86cd799439011', {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(404)
    })

    it('should delete role successfully with admin token', async () => {
      const response = await api.delete(`/roles/${testRoleId}`, {
        headers: { authorization: `Bearer ${fixtures.adminUser.accessToken}` }
      })
      expect(response.status).toBe(200)
    })
  })
})