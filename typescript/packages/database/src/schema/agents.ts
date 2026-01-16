import { pgTable, text, timestamp, integer, jsonb, boolean, real } from 'drizzle-orm/pg-core'

// Agent type
export type AgentType = 'ai' | 'staff'

// Specialty type
export type AgentSpecialty = 'general' | 'cardiology' | 'dental' | 'dermatology' | 'gastroenterology' | 'ophthalmology' | 'orthopedics' | 'pediatrics' | 'surgery' | 'other'

// Model provider type
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'together-ai' | 'custom-llm'

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

// Analysis schema for structured data extraction from calls
export interface AnalysisSchemaProperty {
  type: 'string' | 'boolean' | 'number' | 'object' | 'array'
  description?: string
  enum?: string[]
  format?: string
  properties?: Record<string, AnalysisSchemaProperty>
  required?: string[]
  items?: AnalysisSchemaProperty
}

export interface AnalysisSchema {
  type: 'object'
  properties: Record<string, AnalysisSchemaProperty>
  required?: string[]
}

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
  vapiAssistantId: text('vapi_assistant_id'), // VAPI assistant ID or squad ID

  // Voice configuration (AI agents only)
  voiceId: text('voice_id'),           // ElevenLabs voice ID
  voiceProvider: text('voice_provider').default('11labs'),
  voiceSpeed: real('voice_speed').default(0.9), // Voice speed (0.5-2.0, default 0.9)

  // Model configuration
  model: text('model').default('gpt-4o-mini'), // LLM model ID
  modelProvider: text('model_provider').$type<ModelProvider>().default('openai'),

  // Call behavior
  waitForGreeting: boolean('wait_for_greeting').default(true), // Wait for patient to say hello first

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

  // Analysis schema for structured data extraction from calls
  // Defines what questions/data to extract during the call
  analysisSchema: jsonb('analysis_schema').$type<AnalysisSchema>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TypeScript types
export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
