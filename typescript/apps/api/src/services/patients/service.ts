import { db } from '@repo/database'
import { patients, type Patient, type NewPatient } from './schema.js'
import { eq, desc } from 'drizzle-orm'
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

/**
 * Generate a patient ID in the format PT-XXXX
 */
function generatePatientId(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `PT-${num}`
}

/**
 * Format phone number to E.164 format
 * @param phone - Phone number in any format
 * @param defaultCountry - Default country code (default: US)
 * @returns E.164 formatted phone number or null if invalid
 */
export function formatPhoneToE164(phone: string, defaultCountry: CountryCode = 'US'): string | null {
  if (!phone) return null

  // Clean the phone number
  const cleaned = phone.replace(/[^\d+]/g, '')

  // Try parsing with the library
  const phoneNumber = parsePhoneNumberFromString(cleaned, defaultCountry)

  if (phoneNumber && phoneNumber.isValid()) {
    return phoneNumber.format('E.164')
  }

  // If already in E.164 format, return as is
  if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
    return cleaned
  }

  return null
}

/**
 * Patient Service
 * Business logic for patient operations
 */
export class PatientService {
  async getAll(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(desc(patients.updatedAt))
  }

  async getById(id: string): Promise<Patient | null> {
    const result = await db.select()
      .from(patients)
      .where(eq(patients.id, id))
    return result[0] || null
  }

  async getByPhone(phone: string): Promise<Patient | null> {
    // Format phone to E.164 for lookup
    const formattedPhone = formatPhoneToE164(phone)
    if (!formattedPhone) return null

    const result = await db.select()
      .from(patients)
      .where(eq(patients.phone, formattedPhone))
    return result[0] || null
  }

  async create(data: { firstName: string; lastName: string; phone: string; dob?: string }): Promise<Patient> {
    // Format phone to E.164
    const formattedPhone = formatPhoneToE164(data.phone)
    if (!formattedPhone) {
      throw new Error('Invalid phone number format')
    }

    // Check for duplicate phone
    const existing = await this.getByPhone(formattedPhone)
    if (existing) {
      throw new Error('Patient with this phone number already exists')
    }

    // Generate unique patient ID
    let patientId = generatePatientId()
    let attempts = 0
    while (attempts < 10) {
      const existingId = await this.getById(patientId)
      if (!existingId) break
      patientId = generatePatientId()
      attempts++
    }

    const newPatient = await db.insert(patients)
      .values({
        id: patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: formattedPhone,
        dob: data.dob || null,
      })
      .returning()

    return newPatient[0]
  }

  async update(id: string, data: Partial<{ firstName: string; lastName: string; phone: string; dob: string }>): Promise<Patient> {
    // Format phone if provided
    const updateData: Partial<Patient> = { ...data }
    if (data.phone) {
      const formattedPhone = formatPhoneToE164(data.phone)
      if (!formattedPhone) {
        throw new Error('Invalid phone number format')
      }
      // Check if phone is being changed to another patient's phone
      const existingWithPhone = await this.getByPhone(formattedPhone)
      if (existingWithPhone && existingWithPhone.id !== id) {
        throw new Error('Phone number already belongs to another patient')
      }
      updateData.phone = formattedPhone
    }

    const updated = await db.update(patients)
      .set({
        ...updateData,
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

  /**
   * Upsert a patient - update if phone exists, create if not
   * Used during import
   */
  async upsert(data: { firstName: string; lastName: string; phone: string; dob?: string }): Promise<{ patient: Patient; created: boolean }> {
    // Format phone to E.164
    const formattedPhone = formatPhoneToE164(data.phone)
    if (!formattedPhone) {
      throw new Error('Invalid phone number format')
    }

    // Check if patient exists by phone
    const existing = await this.getByPhone(formattedPhone)

    if (existing) {
      // Update existing patient
      const updated = await this.update(existing.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        dob: data.dob,
      })
      return { patient: updated, created: false }
    }

    // Create new patient
    const created = await this.create({
      ...data,
      phone: formattedPhone,
    })
    return { patient: created, created: true }
  }
}

export const patientService = new PatientService()
