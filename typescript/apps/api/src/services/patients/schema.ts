import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

/**
 * Patients table schema
 */
export const patients = pgTable('patients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  dob: text('dob').notNull(),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Export inferred types for internal use
export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert
