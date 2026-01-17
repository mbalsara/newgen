import { builder } from '../../graphql/builder.js'
import { patientService } from './service.js'
import { getPatientFullName, type Patient } from './schema.js'

/**
 * Patient GraphQL Type
 */
export const PatientType = builder.objectRef<Patient>('Patient').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    // Computed full name for convenience
    name: t.string({
      resolve: (patient) => getPatientFullName(patient),
    }),
    phone: t.string({
      nullable: true,
      resolve: (patient) => patient.phone,
    }),
    dob: t.string({
      nullable: true,
      resolve: (patient) => patient.dob,
    }),
    flagReasons: t.field({
      type: ['Int'],
      nullable: true,
      resolve: (patient) => patient.flagReasons,
    }),
    flaggedBy: t.string({
      nullable: true,
      resolve: (patient) => patient.flaggedBy,
    }),
    flaggedAt: t.field({
      type: 'String',
      nullable: true,
      resolve: (patient) => patient.flaggedAt?.toISOString() || null,
    }),
    createdAt: t.field({
      type: 'String',
      resolve: (patient) => patient.createdAt?.toISOString() || '',
    }),
    updatedAt: t.field({
      type: 'String',
      resolve: (patient) => patient.updatedAt?.toISOString() || '',
    }),
  }),
})

/**
 * Input Types
 */
const CreatePatientInput = builder.inputType('CreatePatientInput', {
  fields: (t) => ({
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
    phone: t.string({ required: true }),
    dob: t.string({ required: false }),
  }),
})

const UpdatePatientInput = builder.inputType('UpdatePatientInput', {
  fields: (t) => ({
    firstName: t.string({ required: false }),
    lastName: t.string({ required: false }),
    phone: t.string({ required: false }),
    dob: t.string({ required: false }),
  }),
})

/**
 * Queries
 */
builder.queryFields((t) => ({
  patients: t.field({
    type: [PatientType],
    description: 'Get all patients',
    resolve: async () => {
      return await patientService.getAll()
    },
  }),

  patient: t.field({
    type: PatientType,
    nullable: true,
    description: 'Get patient by ID',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args) => {
      return await patientService.getById(args.id as string)
    },
  }),
}))

/**
 * Mutations
 */
builder.mutationFields((t) => ({
  createPatient: t.field({
    type: PatientType,
    description: 'Create a new patient',
    args: {
      input: t.arg({ type: CreatePatientInput, required: true }),
    },
    resolve: async (_, args) => {
      // Convert null to undefined for optional fields
      return await patientService.create({
        firstName: args.input.firstName,
        lastName: args.input.lastName,
        phone: args.input.phone,
        dob: args.input.dob ?? undefined,
      })
    },
  }),

  updatePatient: t.field({
    type: PatientType,
    description: 'Update an existing patient',
    args: {
      id: t.arg.id({ required: true }),
      input: t.arg({ type: UpdatePatientInput, required: true }),
    },
    resolve: async (_, args) => {
      // Convert null to undefined for optional fields
      const updateData: Record<string, string | undefined> = {}
      if (args.input.firstName != null) updateData.firstName = args.input.firstName
      if (args.input.lastName != null) updateData.lastName = args.input.lastName
      if (args.input.phone != null) updateData.phone = args.input.phone
      if (args.input.dob != null) updateData.dob = args.input.dob
      return await patientService.update(args.id as string, updateData)
    },
  }),

  deletePatient: t.field({
    type: 'Boolean',
    description: 'Delete a patient',
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_, args) => {
      return await patientService.delete(args.id as string)
    },
  }),
}))
