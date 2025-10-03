import { PermissionAction, PermissionModule, RoleName } from '@prisma/client'

import { api, getAuthHeaders, loginAndGetTokens, prisma, resetDatabase } from './setup'

describe('RoleController (integration)', () => {
  let accessToken: string

  beforeEach(async () => {
    await resetDatabase()
    const tokens = await loginAndGetTokens('test-1@test.com', 'password')
    accessToken = tokens.access_token
  })

  describe('POST /roles', () => {
    it('success', async () => {
      const developerRole = await prisma.role.findFirst({ where: { name: RoleName.developer } })
      if (developerRole) {
        await api.delete(`/roles/${developerRole.id}`, getAuthHeaders(accessToken))
      }

      const response = await api.post('/roles', { name: RoleName.developer }, getAuthHeaders(accessToken))

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ name: RoleName.developer })
    })

    it('error', async () => {
      const response = await api.post('/roles', { name: RoleName.user }, getAuthHeaders(accessToken))

      expect(response.status).toBe(500)
    })
  })

  describe('GET /roles', () => {
    it('success', async () => {
      const response = await api.get('/roles', getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('error', async () => {
      const response = await api.get('/roles')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /roles/:id', () => {
    it('success', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.admin } })
      expect(role).not.toBeNull()

      const response = await api.get(`/roles/${role!.id}`, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: role!.id, name: RoleName.admin })
    })

    it('error', async () => {
      const response = await api.get('/roles/non-existent-id')
      expect(response.status).toBe(401)
    })
  })

  describe('PATCH /roles/:id', () => {
    it('success', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.moderator } })
      expect(role).not.toBeNull()

      const response = await api.patch(`/roles/${role!.id}`, { name: RoleName.moderator }, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: role!.id, name: RoleName.moderator })
    })

    it('error', async () => {
      const response = await api.patch(
        '/roles/non-existent-id',
        { name: RoleName.moderator },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('DELETE /roles/:id', () => {
    it('success', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.moderator } })
      expect(role).not.toBeNull()

      const response = await api.delete(`/roles/${role!.id}`, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: role!.id })
    })

    it('error', async () => {
      const response = await api.delete('/roles/non-existent-id', getAuthHeaders(accessToken))
      expect(response.status).toBe(500)
    })
  })

  describe('POST /roles/permissions/assign', () => {
    it('success', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.admin } })
      expect(role).not.toBeNull()

      const permissionResponse = await api.post(
        '/permissions',
        { action: PermissionAction.create, module: PermissionModule.role },
        getAuthHeaders(accessToken)
      )
      expect(permissionResponse.status).toBe(201)
      const permissionId = permissionResponse.data.id

      const response = await api.post(
        '/roles/permissions/assign',
        { role_id: role!.id, permission_id: permissionId, can_do_the_action: true },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ role_id: role!.id, permission_id: permissionId })
    })

    it('error', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.admin } })
      expect(role).not.toBeNull()

      const response = await api.post(
        '/roles/permissions/assign',
        { role_id: role!.id, permission_id: 'invalid-id', can_do_the_action: true },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST /roles/permissions/revoke', () => {
    it('success', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.admin } })
      expect(role).not.toBeNull()

      const permissionResponse = await api.post(
        '/permissions',
        { action: PermissionAction.read, module: PermissionModule.role },
        getAuthHeaders(accessToken)
      )
      expect(permissionResponse.status).toBe(201)
      const permissionId = permissionResponse.data.id

      const assign = await api.post(
        '/roles/permissions/assign',
        { role_id: role!.id, permission_id: permissionId, can_do_the_action: true },
        getAuthHeaders(accessToken)
      )
      expect(assign.status).toBe(201)

      const response = await api.post(
        '/roles/permissions/revoke',
        { role_id: role!.id, permission_id: permissionId, can_do_the_action: true },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ role_id: role!.id, permission_id: permissionId })
    })

    it('error', async () => {
      const response = await api.post(
        '/roles/permissions/revoke',
        { role_id: 'invalid-role', permission_id: 'invalid-permission', can_do_the_action: true },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('PATCH /roles/permissions/update', () => {
    it('success', async () => {
      const role = await prisma.role.findFirst({ where: { name: RoleName.admin } })
      expect(role).not.toBeNull()

      const permissionResponse = await api.post(
        '/permissions',
        { action: PermissionAction.update, module: PermissionModule.role },
        getAuthHeaders(accessToken)
      )
      expect(permissionResponse.status).toBe(201)
      const permissionId = permissionResponse.data.id

      const assign = await api.post(
        '/roles/permissions/assign',
        { role_id: role!.id, permission_id: permissionId, can_do_the_action: false },
        getAuthHeaders(accessToken)
      )
      expect(assign.status).toBe(201)

      const response = await api.patch(
        '/roles/permissions/update',
        { role_id: role!.id, permission_id: permissionId, can_do_the_action: true },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ role_id: role!.id, permission_id: permissionId, can_do_the_action: true })
    })

    it('error', async () => {
      const response = await api.patch(
        '/roles/permissions/update',
        { role_id: 'invalid-role', permission_id: 'invalid-permission', can_do_the_action: true },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(500)
    })
  })

  describe('POST /roles/seed', () => {
    it('success', async () => {
      const response = await api.post('/roles/seed', {}, getAuthHeaders(accessToken))

      expect(response.status).toBe(201)
      expect(Array.isArray(response.data)).toBe(true)
    })

    it('error', async () => {
      const response = await api.post('/roles/seed')
      expect(response.status).toBe(401)
    })
  })
})
