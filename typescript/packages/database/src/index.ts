import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'
import * as schema from './schema.js'

// Lazy initialization - connection created on first use
let _client: Sql | null = null
let _db: PostgresJsDatabase<typeof schema> | null = null

function getConnectionString(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return url
}

function getClient(): Sql {
  if (!_client) {
    _client = postgres(getConnectionString())
  }
  return _client
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getClient(), { schema })
  }
  return _db
}

// For backwards compatibility - lazy getter
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop]
  },
})

// Export all schemas
export * from './schema.js'
export * from './auth-schema.js'
