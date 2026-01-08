import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'

// Agent type
export type AgentType = 'ai' | 'staff'

// Specialty type
export type AgentSpecialty = 'general' | 'cardiology' | 'dental' | 'dermatology' | 'gastroenterology' | 'ophthalmology' | 'orthopedics' | 'pediatrics' | 'surgery' | 'other'

// Objective category
export type ObjectiveCategory = 'general' | 'demographics' | 'insurance' | 'pharmacy' | 'financial' | 'pre-visit' | 'custom'

// Agent objective configuration
export interface AgentObjective {
  id: string
  category: ObjectiveCategory
  text: string                   // The objective prompt text
  required: boolean              // Must be confirmed for task completion
  specialties?: AgentSpecialty[] // Only apply to these specialties (null = all)
  taskTypes?: string[]           // Only apply to these task types (null = all)
}

// Event action types
export type EventAction = 'complete' | 'retry' | 'escalate' | 'none'

// Event handling configuration
export interface EventHandling {
  voicemail: {
    action: EventAction
    message: string  // Message to leave on voicemail
  }
  noAnswer: {
    action: EventAction
    maxAttempts: number
  }
  busyLine: {
    action: EventAction
    retryDelayMinutes: number
  }
  callDisconnected: {
    action: EventAction
    notes?: string
  }
  abusiveLanguage: {
    action: EventAction
    message: string  // Closing message before hanging up
  }
  successCriteria: string[]  // List of conditions that mark call as successful
  escalationCriteria: string[]  // List of conditions that require human follow-up
}

// Agents table - AI voice agents and staff members
export const agents = pgTable('agents', {
  id: text('id').primaryKey(), // e.g., 'ai-luna', 'sarah'
  name: text('name').notNull(),
  type: text('type').notNull().$type<AgentType>(), // 'ai' | 'staff'
  role: text('role').notNull(), // e.g., 'Appointment Confirmation', 'Front Office'
  avatar: text('avatar'), // emoji for AI, initials for staff
  vapiAssistantId: text('vapi_assistant_id'), // VAPI assistant ID (AI agents only)

  // Voice configuration (AI agents only)
  voiceId: text('voice_id'),           // ElevenLabs voice ID
  voiceProvider: text('voice_provider').default('11labs'),

  // Greeting & Prompt
  greeting: text('greeting'),          // First message template with {{variables}}
  systemPrompt: text('system_prompt'), // Advanced prompt (full override)

  // Specialty & Objectives
  specialty: text('specialty').$type<AgentSpecialty>().default('general'),
  objectives: jsonb('objectives').$type<AgentObjective[]>().default([]),

  // Practice/Tenant info
  practiceName: text('practice_name'),
  practicePhone: text('practice_phone'),

  // Behavior settings
  maxRetries: integer('max_retries').default(5),
  retryDelayMinutes: integer('retry_delay_minutes').default(60),

  // Escalation/Fallback
  fallbackStaffId: text('fallback_staff_id'),      // Primary staff to escalate to
  fallbackStaffIds: jsonb('fallback_staff_ids').$type<string[]>().default([]), // Backup list

  // Event handling configuration
  eventHandling: jsonb('event_handling').$type<EventHandling>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TypeScript types
export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
