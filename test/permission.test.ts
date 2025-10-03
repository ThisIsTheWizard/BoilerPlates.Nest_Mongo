import { PermissionAction, PermissionModule } from '@prisma/client'

import { api, getAuthHeaders, loginAndGetTokens, resetDatabase } from './setup'

describe('PermissionController (integration)', () => {
  let accessToken: string

  beforeEach(async () => {
    await resetDatabase()
    const tokens = await loginAndGetTokens('test-1@test.com', 'password')
    accessToken = tokens.access_token
  })

  describe('POST /permissions', () => {
    it('success', async () => {
      const response = await api.post(
        '/permissions',
        { action: PermissionAction.create, module: PermissionModule.user },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(201)
      expect(response.data).toMatchObject({ action: PermissionAction.create, module: PermissionModule.user })
    })

    it('error', async () => {
      const response = await api.post(
        '/permissions',
        { action: 'invalid-action', module: PermissionModule.user },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(400)
    })
  })

  describe('GET /permissions', () => {
    it('success', async () => {
      await api.post(
        '/permissions',
        { action: PermissionAction.read, module: PermissionModule.user },
        getAuthHeaders(accessToken)
      )

      const response = await api.get('/permissions', getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })

    it('error', async () => {
      const response = await api.get('/permissions')
      expect(response.status).toBe(401)
    })
  })

  describe('GET /permissions/:id', () => {
    it('success', async () => {
      const created = await api.post(
        '/permissions',
        { action: PermissionAction.update, module: PermissionModule.user },
        getAuthHeaders(accessToken)
      )
      expect(created.status).toBe(201)
      const permissionId = created.data.id

      const response = await api.get(`/permissions/${permissionId}`, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: permissionId })
    })

    it('error', async () => {
      const response = await api.get('/permissions/non-existent-id', getAuthHeaders(accessToken))
      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /permissions/:id', () => {
    it('success', async () => {
      const created = await api.post(
        '/permissions',
        { action: PermissionAction.create, module: PermissionModule.permission },
        getAuthHeaders(accessToken)
      )
      expect(created.status).toBe(201)
      const permissionId = created.data.id

      const response = await api.patch(
        `/permissions/${permissionId}`,
        { action: PermissionAction.delete },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: permissionId, action: PermissionAction.delete })
    })

    it('error', async () => {
      const response = await api.patch(
        '/permissions/non-existent-id',
        { action: PermissionAction.delete },
        getAuthHeaders(accessToken)
      )

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /permissions/:id', () => {
    it('success', async () => {
      const created = await api.post(
        '/permissions',
        { action: PermissionAction.delete, module: PermissionModule.permission },
        getAuthHeaders(accessToken)
      )
      expect(created.status).toBe(201)
      const permissionId = created.data.id

      const response = await api.delete(`/permissions/${permissionId}`, getAuthHeaders(accessToken))

      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ id: permissionId })
    })

    it('error', async () => {
      const response = await api.delete('/permissions/non-existent-id', getAuthHeaders(accessToken))
      expect(response.status).toBe(404)
    })
  })

  describe('POST /permissions/seed', () => {
    it('success', async () => {
      const response = await api.post('/permissions/seed', {}, getAuthHeaders(accessToken))

      expect(response.status).toBe(201)
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)
    })

    it('error', async () => {
      const response = await api.post('/permissions/seed')
      expect(response.status).toBe(401)
    })
  })
})
