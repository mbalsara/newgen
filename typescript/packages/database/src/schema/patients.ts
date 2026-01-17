import { pgTable, text, timestamp, smallint } from 'drizzle-orm/pg-core'

// Flag reason enum values (stored as smallint in array)
// 0 = abusive-language
// 1 = verbal-threats
// 2 = harassment
// 3 = discriminatory
// 4 = other
export const FLAG_REASONS = [
  'abusive-language',
  'verbal-threats',
  'harassment',
  'discriminatory',
  'other',
] as const

export type PatientFlagReason = typeof FLAG_REASONS[number]

// Helper to convert reason string to index
export function flagReasonToIndex(reason: PatientFlagReason): number {
  return FLAG_REASONS.indexOf(reason)
}

// Helper to convert index to reason string
export function indexToFlagReason(index: number): PatientFlagReason | undefined {
  return FLAG_REASONS[index]
}

// Patients table
export const patients = pgTable('patients', {
  id: text('id').primaryKey(), // e.g., 'PT-2847'
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'), // E.164 format (e.g., +14155551234)
  dob: text('dob'),
  // Behavior flags - array of reason indices
  flagReasons: smallint('flag_reasons').array(),
  flaggedBy: text('flagged_by'), // Who flagged (most recent)
  flaggedAt: timestamp('flagged_at'), // When flagged (most recent)
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TypeScript types
export type Patient = typeof patients.$inferSelect
export type NewPatient = typeof patients.$inferInsert

// Helper to get full name
export function getPatientFullName(patient: Patient): string {
  return `${patient.firstName} ${patient.lastName}`.trim()
}
