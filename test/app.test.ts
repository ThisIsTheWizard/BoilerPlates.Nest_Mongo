import { api } from './setup'

describe('AppController (integration)', () => {
  describe('GET /', () => {
    it('success', async () => {
      const response = await api.get('/')
      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ message: expect.any(String), success: true })
    })

    it('error', async () => {
      const response = await api.get('/non-existent-route')
      expect(response.status).toBe(404)
    })
  })
})
