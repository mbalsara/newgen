import { describe, it, expect } from 'vitest'
import { users } from './schema'

describe('Database Schema', () => {
  it('should define users table', () => {
    expect(users).toBeDefined()
  })
})
