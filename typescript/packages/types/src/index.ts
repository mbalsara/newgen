export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

export * from './appointment'
export * from './schemas'
export * from './constants'

