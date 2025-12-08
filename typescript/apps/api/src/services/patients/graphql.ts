import { builder } from '../../graphql/builder.js'
import { patientService } from './service.js'
import type { Patient } from './schema.js'

/**
 * Patient GraphQL Type
 */
export const PatientType = builder.objectRef<Patient>('Patient').implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    phone: t.exposeString('phone'),
    dob: t.exposeString('dob'),
    address: t.string({
      nullable: true,
      resolve: (patient) => patient.address,
    }),
    emergencyContact: t.string({
      nullable: true,
      resolve: (patient) => patient.emergencyContact,
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
    name: t.string({ required: true }),
    email: t.string({ required: true }),
    phone: t.string({ required: true }),
    dob: t.string({ required: true }),
    address: t.string({ required: false }),
    emergencyContact: t.string({ required: false }),
  }),
})

const UpdatePatientInput = builder.inputType('UpdatePatientInput', {
  fields: (t) => ({
    name: t.string({ required: false }),
    email: t.string({ required: false }),
    phone: t.string({ required: false }),
    dob: t.string({ required: false }),
    address: t.string({ required: false }),
    emergencyContact: t.string({ required: false }),
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
      return await patientService.create(args.input)
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
      return await patientService.update(args.id as string, args.input)
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
