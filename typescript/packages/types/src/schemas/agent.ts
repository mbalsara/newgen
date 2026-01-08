import { z } from 'zod'

// Agent type enum
export const AgentTypeSchema = z.enum(['ai', 'staff'])
export type AgentType = z.infer<typeof AgentTypeSchema>

// Specialty enum
export const AgentSpecialtySchema = z.enum([
  'general',
  'cardiology',
  'dental',
  'dermatology',
  'gastroenterology',
  'ophthalmology',
  'orthopedics',
  'pediatrics',
  'surgery',
  'other',
])
export type AgentSpecialty = z.infer<typeof AgentSpecialtySchema>

// Objective category enum
export const ObjectiveCategorySchema = z.enum([
  'general',
  'demographics',
  'insurance',
  'pharmacy',
  'financial',
  'pre-visit',
  'custom',
])
export type ObjectiveCategory = z.infer<typeof ObjectiveCategorySchema>

// Agent objective schema
export const AgentObjectiveSchema = z.object({
  id: z.string(),
  category: ObjectiveCategorySchema,
  text: z.string(),
  required: z.boolean(),
  specialties: z.array(AgentSpecialtySchema).optional(),
  taskTypes: z.array(z.string()).optional(),
})
export type AgentObjective = z.infer<typeof AgentObjectiveSchema>

// Event action enum
export const EventActionSchema = z.enum(['complete', 'retry', 'escalate', 'none'])
export type EventAction = z.infer<typeof EventActionSchema>

// Event handling configuration
export const EventHandlingSchema = z.object({
  voicemail: z.object({
    action: EventActionSchema,
    message: z.string(),
  }),
  noAnswer: z.object({
    action: EventActionSchema,
    maxAttempts: z.number(),
  }),
  busyLine: z.object({
    action: EventActionSchema,
    retryDelayMinutes: z.number(),
  }),
  callDisconnected: z.object({
    action: EventActionSchema,
    notes: z.string().optional(),
  }),
  abusiveLanguage: z.object({
    action: EventActionSchema,
    message: z.string(),
  }),
  successCriteria: z.array(z.string()),
  escalationCriteria: z.array(z.string()),
})
export type EventHandling = z.infer<typeof EventHandlingSchema>

// Agent schema
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AgentTypeSchema,
  role: z.string(),
  avatar: z.string().nullable(),
  vapiAssistantId: z.string().nullable(),

  // Voice configuration
  voiceId: z.string().nullable(),
  voiceProvider: z.string().nullable().default('11labs'),

  // Greeting & Prompt
  greeting: z.string().nullable(),
  systemPrompt: z.string().nullable(),

  // Specialty & Objectives
  specialty: AgentSpecialtySchema.nullable().default('general'),
  objectives: z.array(AgentObjectiveSchema).default([]),

  // Practice/Tenant info
  practiceName: z.string().nullable(),
  practicePhone: z.string().nullable(),

  // Behavior settings
  maxRetries: z.number().default(5),
  retryDelayMinutes: z.number().default(60),

  // Escalation/Fallback
  fallbackStaffId: z.string().nullable(),
  fallbackStaffIds: z.array(z.string()).default([]),

  // Event handling
  eventHandling: EventHandlingSchema.nullable(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Agent = z.infer<typeof AgentSchema>

// New agent (for creation)
export const NewAgentSchema = AgentSchema.omit({
  createdAt: true,
  updatedAt: true,
}).partial({
  voiceId: true,
  voiceProvider: true,
  greeting: true,
  systemPrompt: true,
  specialty: true,
  objectives: true,
  practiceName: true,
  practicePhone: true,
  maxRetries: true,
  retryDelayMinutes: true,
  fallbackStaffId: true,
  fallbackStaffIds: true,
  eventHandling: true,
})

export type NewAgent = z.infer<typeof NewAgentSchema>

// Agent update (partial)
export const AgentUpdateSchema = NewAgentSchema.partial()
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>
