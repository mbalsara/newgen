import { db } from '@repo/database'
import { patients, type Patient, type NewPatient } from './schema.js'
import { eq } from 'drizzle-orm'

/**
 * Patient Service
 * Business logic for patient operations
 */
export class PatientService {
  async getAll(): Promise<Patient[]> {
    return await db.select().from(patients)
  }

  async getById(id: string): Promise<Patient | null> {
    const result = await db.select()
      .from(patients)
      .where(eq(patients.id, id))
    return result[0] || null
  }

  async create(data: Omit<NewPatient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    // Check for duplicate email
    const existing = await db.select()
      .from(patients)
      .where(eq(patients.email, data.email))

    if (existing.length > 0) {
      throw new Error('Patient with this email already exists')
    }

    const newPatient = await db.insert(patients)
      .values({
        id: crypto.randomUUID(),
        ...data,
      })
      .returning()

    return newPatient[0]
  }

  async update(id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>): Promise<Patient> {
    const updated = await db.update(patients)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(patients.id, id))
      .returning()

    if (updated.length === 0) {
      throw new Error('Patient not found')
    }

    return updated[0]
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db.delete(patients)
      .where(eq(patients.id, id))
      .returning()

    return deleted.length > 0
  }
}

export const patientService = new PatientService()
