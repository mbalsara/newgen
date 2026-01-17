import { pgTable, serial, text, timestamp, date } from 'drizzle-orm/pg-core'
import { patients } from './patients'

// Appointments/Visits table - tracks patient visit dates from imports
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  patientId: text('patient_id').notNull().references(() => patients.id),
  visitDate: date('visit_date').notNull(),
  notes: text('notes'),
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TypeScript types
export type Appointment = typeof appointments.$inferSelect
export type NewAppointment = typeof appointments.$inferInsert
