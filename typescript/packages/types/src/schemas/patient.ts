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

// Patient schema
export const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
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
