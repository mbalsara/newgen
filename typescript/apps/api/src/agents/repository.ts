import { eq } from 'drizzle-orm'
import { db, agents, type Agent, type NewAgent } from '@repo/database'

export const agentRepository = {
  // Get all agents
  async findAll(): Promise<Agent[]> {
    return db.select().from(agents).orderBy(agents.name)
  },

  // Get AI agents only
  async findAIAgents(): Promise<Agent[]> {
    return db.select().from(agents).where(eq(agents.type, 'ai')).orderBy(agents.name)
  },

  // Get staff only
  async findStaff(): Promise<Agent[]> {
    return db.select().from(agents).where(eq(agents.type, 'staff')).orderBy(agents.name)
  },

  // Get agent by ID
  async findById(id: string): Promise<Agent | undefined> {
    const results = await db.select().from(agents).where(eq(agents.id, id)).limit(1)
    return results[0]
  },

  // Get agent by VAPI assistant ID
  async findByVapiAssistantId(vapiId: string): Promise<Agent | undefined> {
    const results = await db.select().from(agents).where(eq(agents.vapiAssistantId, vapiId)).limit(1)
    return results[0]
  },

  // Create agent
  async create(data: NewAgent): Promise<Agent> {
    const results = await db.insert(agents).values(data).returning()
    return results[0]
  },

  // Update agent
  async update(id: string, data: Partial<NewAgent>): Promise<Agent | undefined> {
    const results = await db
      .update(agents)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agents.id, id))
      .returning()
    return results[0]
  },

  // Delete agent
  async delete(id: string): Promise<boolean> {
    const results = await db.delete(agents).where(eq(agents.id, id)).returning()
    return results.length > 0
  },

  // Seed agents (for initial data)
  async seedAgents(agentList: NewAgent[]): Promise<Agent[]> {
    const results = await db
      .insert(agents)
      .values(agentList)
      .onConflictDoNothing()
      .returning()
    return results
  },
}
