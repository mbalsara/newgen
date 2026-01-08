import { z } from 'zod'

// Agent type enum
export const AgentTypeSchema = z.enum(['ai', 'staff'])
export type AgentType = z.infer<typeof AgentTypeSchema>

// Agent schema
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: AgentTypeSchema,
  role: z.string(),
  avatar: z.string().nullable(),
  vapiAssistantId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Agent = z.infer<typeof AgentSchema>

// New agent (for creation)
export const NewAgentSchema = AgentSchema.omit({
  createdAt: true,
  updatedAt: true,
})

export type NewAgent = z.infer<typeof NewAgentSchema>

// Agent update (partial)
export const AgentUpdateSchema = NewAgentSchema.partial()
export type AgentUpdate = z.infer<typeof AgentUpdateSchema>
