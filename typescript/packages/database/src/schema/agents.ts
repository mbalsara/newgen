import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// Agents table - AI voice agents and staff members
export const agents = pgTable('agents', {
  id: text('id').primaryKey(), // e.g., 'ai-luna', 'sarah'
  name: text('name').notNull(),
  type: text('type').notNull(), // 'ai' | 'staff'
  role: text('role').notNull(), // e.g., 'Appointment Confirmation', 'Front Office'
  avatar: text('avatar'), // emoji for AI, initials for staff
  vapiAssistantId: text('vapi_assistant_id'), // VAPI assistant ID (AI agents only)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// TypeScript types
export type Agent = typeof agents.$inferSelect
export type NewAgent = typeof agents.$inferInsert
