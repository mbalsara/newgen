import { pgTable, serial, text, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { agents } from './agents'
import { patients } from './patients'

// Task status type
export type TaskStatus = 'in-progress' | 'scheduled' | 'escalated' | 'pending' | 'completed'

// Task type
export type TaskType = 'confirmation' | 'no-show' | 'pre-visit' | 'post-visit' | 'recall' | 'collections'

// EHR sync status
export type EhrSyncStatus = 'synced' | 'pending' | 'failed' | 'syncing'

// EHR sync info
export interface EhrSync {
  status: EhrSyncStatus
  lastSync: string | null
  error?: string
}

// Timeline event types (stored as JSONB)
export interface BaseTimelineEvent {
  id: string
  type: string
  timestamp: string
  title: string
}

export interface TranscriptMessage {
  speaker: 'ai' | 'patient'
  text: string
  time: string
  flagged?: boolean
}

// Timeline events union (simplified for DB storage)
export type TimelineEvent = BaseTimelineEvent & Record<string, unknown>

// Retry attempt history
export interface RetryAttempt {
  attemptNumber: number
  callId: string
  timestamp: string
  outcome: string  // 'no-answer', 'voicemail', 'busy', 'disconnected', 'failed'
  duration: number // in seconds
  notes?: string
}

// Tasks table
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  // Patient reference (normalized)
  patientId: text('patient_id').notNull().references(() => patients.id),
  // Task details
  provider: text('provider').notNull(),
  type: text('type').notNull().$type<TaskType>(),
  status: text('status').notNull().$type<TaskStatus>().default('pending'),
  description: text('description').notNull(),
  amount: text('amount'), // For collections tasks
  // Assignment
  assignedAgentId: text('assigned_agent_id').references(() => agents.id),
  // Timeline and EHR sync (JSONB)
  timeline: jsonb('timeline').$type<TimelineEvent[]>().default([]),
  ehrSync: jsonb('ehr_sync').$type<EhrSync>().default({ status: 'pending', lastSync: null }),
  // Retry tracking
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(5),
  lastAttemptAt: timestamp('last_attempt_at'),
  nextRetryAt: timestamp('next_retry_at'),
  retryHistory: jsonb('retry_history').$type<RetryAttempt[]>().default([]),
  // Meta
  unread: boolean('unread').default(true),
  time: text('time'), // Display time like "2m ago"
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TypeScript types
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
