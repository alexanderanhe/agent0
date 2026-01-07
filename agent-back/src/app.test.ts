import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { getApp } from './app'

describe('GET /', () => {
  it('returns ok status', async () => {
    const app = getApp()
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})
