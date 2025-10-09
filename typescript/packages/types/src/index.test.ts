import { describe, it, expect } from 'vitest'
import type { User } from './index'

describe('Types', () => {
  it('should define User type correctly', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    expect(user.email).toBe('test@example.com')
  })
})
