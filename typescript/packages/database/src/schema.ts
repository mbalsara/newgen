import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

// Legacy users table (keep for reference, but use auth schema for authentication)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Export all auth schema tables
export * from './auth-schema'

// Export all application schemas
export * from './schema/index'
