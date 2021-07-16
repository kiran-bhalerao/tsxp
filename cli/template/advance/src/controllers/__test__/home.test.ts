import { app } from 'src/app'
import request from 'supertest'

it('returns 200', async () => {
  await request(app).get('/api/home/movie/1').expect(200)
})
