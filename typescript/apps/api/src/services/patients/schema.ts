// Re-export from the main database package
// This ensures we use the canonical schema definition
export { patients, type Patient, type NewPatient } from '@repo/database'

// Helper to get full name from patient
export function getPatientFullName(patient: { firstName: string; lastName: string }): string {
  return `${patient.firstName} ${patient.lastName}`.trim()
}
