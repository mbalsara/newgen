import { z } from 'zod'
import { PatientSchema } from './patient'

// Task status enum
export const TaskStatusSchema = z.enum([
  'in-progress',
  'scheduled',
  'escalated',
  'pending',
  'completed',
])
export type TaskStatus = z.infer<typeof TaskStatusSchema>

// Task type enum
export const TaskTypeSchema = z.enum([
  'confirmation',
  'no-show',
  'pre-visit',
  'post-visit',
  'recall',
  'collections',
])
export type TaskType = z.infer<typeof TaskTypeSchema>

// EHR sync status
export const EhrSyncStatusSchema = z.enum(['synced', 'pending', 'failed', 'syncing'])
export type EhrSyncStatus = z.infer<typeof EhrSyncStatusSchema>

// EHR sync info
export const EhrSyncSchema = z.object({
  status: EhrSyncStatusSchema,
  lastSync: z.string().nullable(),
  error: z.string().optional(),
})
export type EhrSync = z.infer<typeof EhrSyncSchema>

// Transcript message
export const TranscriptMessageSchema = z.object({
  speaker: z.enum(['ai', 'patient']),
  text: z.string(),
  time: z.string(),
  flagged: z.boolean().optional(),
})
export type TranscriptMessage = z.infer<typeof TranscriptMessageSchema>

// Base timeline event
export const BaseTimelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  title: z.string(),
})

// Timeline event (with additional fields)
export const TimelineEventSchema = BaseTimelineEventSchema.passthrough()
export type TimelineEvent = z.infer<typeof TimelineEventSchema>

// Task schema (without patient join)
export const TaskSchema = z.object({
  id: z.number(),
  patientId: z.string(),
  provider: z.string(),
  type: TaskTypeSchema,
  status: TaskStatusSchema,
  description: z.string(),
  amount: z.string().nullable(),
  assignedAgentId: z.string().nullable(),
  timeline: z.array(TimelineEventSchema).default([]),
  ehrSync: EhrSyncSchema.default({ status: 'pending', lastSync: null }),
  unread: z.boolean().default(true),
  time: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Task = z.infer<typeof TaskSchema>

// Task with patient data (API response)
export const TaskWithPatientSchema = TaskSchema.extend({
  patient: PatientSchema,
})
export type TaskWithPatient = z.infer<typeof TaskWithPatientSchema>

// New task (for creation)
export const NewTaskSchema = z.object({
  patientId: z.string(),
  provider: z.string(),
  type: TaskTypeSchema,
  status: TaskStatusSchema.optional().default('pending'),
  description: z.string(),
  amount: z.string().optional(),
  assignedAgentId: z.string().optional(),
  timeline: z.array(TimelineEventSchema).optional(),
  ehrSync: EhrSyncSchema.optional(),
  unread: z.boolean().optional(),
  time: z.string().optional(),
})
export type NewTask = z.infer<typeof NewTaskSchema>

// Task filters
export const TaskFiltersSchema = z.object({
  statuses: z.array(TaskStatusSchema).optional(),
  agent: z.union([z.string(), z.literal('all'), z.literal('me')]).optional(),
  type: z.union([TaskTypeSchema, z.literal('all')]).optional(),
  search: z.string().optional(),
})
export type TaskFilters = z.infer<typeof TaskFiltersSchema>
