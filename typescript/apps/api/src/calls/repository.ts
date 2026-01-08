import { eq, desc } from 'drizzle-orm'
import { db, calls, type Call, type NewCall, type CallStatus, type TranscriptMessage } from '@repo/database'

export const callRepository = {
  // Get all calls
  async findAll(): Promise<Call[]> {
    return db.select().from(calls).orderBy(desc(calls.createdAt))
  },

  // Get call by ID
  async findById(id: string): Promise<Call | undefined> {
    const results = await db.select().from(calls).where(eq(calls.id, id)).limit(1)
    return results[0]
  },

  // Get calls by task ID
  async findByTaskId(taskId: number): Promise<Call[]> {
    return db.select().from(calls).where(eq(calls.taskId, taskId)).orderBy(desc(calls.createdAt))
  },

  // Create call
  async create(data: NewCall): Promise<Call> {
    const results = await db.insert(calls).values(data).returning()
    return results[0]
  },

  // Update call
  async update(id: string, data: Partial<NewCall>): Promise<Call | undefined> {
    const results = await db.update(calls).set(data).where(eq(calls.id, id)).returning()
    return results[0]
  },

  // Update call status
  async updateStatus(id: string, status: CallStatus): Promise<Call | undefined> {
    return this.update(id, { status })
  },

  // Append to transcript messages
  async appendMessage(id: string, message: TranscriptMessage): Promise<Call | undefined> {
    const call = await this.findById(id)
    if (!call) return undefined

    const messages = [...(call.messages || []), message]
    return this.update(id, { messages })
  },

  // End call with reason
  async endCall(id: string, endedReason: string, duration?: number): Promise<Call | undefined> {
    return this.update(id, {
      status: 'ended',
      endedReason,
      duration,
      endedAt: new Date(),
    })
  },

  // Delete call
  async delete(id: string): Promise<boolean> {
    const results = await db.delete(calls).where(eq(calls.id, id)).returning()
    return results.length > 0
  },
}
