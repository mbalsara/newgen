import { pgTable, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { tasks, type TranscriptMessage } from './tasks'
import { agents } from './agents'

// Call status type
export type CallStatus = 'queued' | 'ringing' | 'in-progress' | 'ended'

// Call ended reason (VAPI reasons)
export type CallEndedReason =
  | 'customer-did-not-answer'
  | 'customer-busy'
  | 'voicemail'
  | 'customer-ended-call'
  | 'assistant-ended-call'
  | 'assistant-error'
  | 'assistant-did-not-give-response'
  | 'assistant-request-failed'
  | 'manually-canceled'
  | 'silence-timed-out'
  | 'pipeline-error'
  | 'exceeded-max-duration'
  | 'phone-call-provider-closed-websocket'
  | 'unknown-error'
  | string // Allow other reasons

// Re-export TranscriptMessage from tasks for convenience
export type { TranscriptMessage } from './tasks'

// Calls table - tracks all outbound/inbound calls
export const calls = pgTable('calls', {
  id: text('id').primaryKey(), // VAPI call ID
  taskId: integer('task_id').references(() => tasks.id),
  agentId: text('agent_id').references(() => agents.id),
  phoneNumber: text('phone_number').notNull(),
  // Call status and outcome
  status: text('status').notNull().$type<CallStatus>().default('queued'),
  endedReason: text('ended_reason').$type<CallEndedReason>(),
  duration: integer('duration'), // in seconds
  // Transcript
  transcript: text('transcript'), // Full transcript as text
  messages: jsonb('messages').$type<TranscriptMessage[]>().default([]),
  // Abusive language detection
  hasAbusiveLanguage: boolean('has_abusive_language').default(false),
  // Timestamps
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// TypeScript types
export type Call = typeof calls.$inferSelect
export type NewCall = typeof calls.$inferInsert
