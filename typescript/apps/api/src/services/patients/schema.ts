// Re-export from the main database package
// This ensures we use the canonical schema definition
export { patients, type Patient, type NewPatient, getPatientFullName } from '@repo/database'
