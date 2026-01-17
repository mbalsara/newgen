import { z } from 'zod'

// Patient flag reasons (stored as smallint[] in DB)
export const FLAG_REASONS = [
  'abusive-language',
  'verbal-threats',
  'harassment',
  'discriminatory',
  'other',
] as const

export const PatientFlagReasonSchema = z.enum(FLAG_REASONS)
export type PatientFlagReason = z.infer<typeof PatientFlagReasonSchema>

// Helper to convert reason string to index
export function flagReasonToIndex(reason: PatientFlagReason): number {
  return FLAG_REASONS.indexOf(reason)
}

// Helper to convert index to reason string
export function indexToFlagReason(index: number): PatientFlagReason | undefined {
  return FLAG_REASONS[index]
}

// E.164 phone number regex (e.g., +14155551234)
const E164_REGEX = /^\+[1-9]\d{1,14}$/

// Patient schema
export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  dob: z.string().nullable(),
  flagReasons: z.array(z.number()).nullable(),
  flaggedBy: z.string().nullable(),
  flaggedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Patient = z.infer<typeof PatientSchema>

// New patient (for creation)
export const NewPatientSchema = PatientSchema.omit({
  createdAt: true,
  updatedAt: true,
}).partial({
  flagReasons: true,
  flaggedBy: true,
  flaggedAt: true,
})

export type NewPatient = z.infer<typeof NewPatientSchema>

// Create patient input (from frontend)
export const CreatePatientInputSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(E164_REGEX, 'Phone must be in E.164 format (e.g., +14155551234)'),
})

export type CreatePatientInput = z.infer<typeof CreatePatientInputSchema>

// Update patient input
export const UpdatePatientInputSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().regex(E164_REGEX, 'Phone must be in E.164 format').optional(),
})

export type UpdatePatientInput = z.infer<typeof UpdatePatientInputSchema>

// Helper to get full name from patient
export function getPatientFullName(patient: Patient): string {
  return `${patient.firstName} ${patient.lastName}`.trim()
}

// Appointment schema
export const AppointmentSchema = z.object({
  id: z.number(),
  patientId: z.string(),
  visitDate: z.string(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Appointment = z.infer<typeof AppointmentSchema>

// New appointment (for creation)
export const NewAppointmentSchema = AppointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  notes: true,
})

export type NewAppointment = z.infer<typeof NewAppointmentSchema>
