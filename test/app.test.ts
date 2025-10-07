import { api } from './setup'

describe('AppController (integration)', () => {
  describe('GET /', () => {
    it('should return welcome message', async () => {
      const response = await api.get('/')
      expect(response.status).toBe(200)
      expect(response.data).toMatchObject({ 
        message: expect.any(String), 
        success: true 
      })
    })

    it('should return 404 for non-existent route', async () => {
      const response = await api.get('/non-existent-route')
      expect(response.status).toBe(404)
    })

    it('should handle invalid HTTP methods', async () => {
      const response = await api.post('/')
      expect(response.status).toBe(404)
    })
  })
})
