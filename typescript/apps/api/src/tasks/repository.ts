import { eq, and, like, or, inArray, desc } from 'drizzle-orm'
import { db, tasks, patients, type Task, type NewTask, type TimelineEvent, type TaskStatus, type TaskType, type Patient, type RetryAttempt } from '@repo/database'

export interface TaskFilters {
  statuses?: TaskStatus[]
  agent?: string | 'all' | 'me'
  type?: TaskType | 'all'
  search?: string
}

// Task with patient info joined
export interface TaskWithPatient extends Task {
  patient: Patient
}

export const taskRepository = {
  // Get all tasks with patient info
  async findAll(filters?: TaskFilters): Promise<TaskWithPatient[]> {
    // Get tasks with patient join
    const results = await db
      .select({
        task: tasks,
        patient: patients,
      })
      .from(tasks)
      .innerJoin(patients, eq(tasks.patientId, patients.id))
      .orderBy(desc(tasks.updatedAt))

    // Apply filters in memory for now (could optimize with dynamic query)
    let filtered = results.map(r => ({ ...r.task, patient: r.patient }))

    if (filters?.statuses && filters.statuses.length > 0) {
      filtered = filtered.filter(t => filters.statuses!.includes(t.status))
    }

    if (filters?.agent && filters.agent !== 'all') {
      filtered = filtered.filter(t => t.assignedAgentId === filters.agent)
    }

    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type)
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(t =>
        t.patient.name.toLowerCase().includes(searchLower) ||
        t.patient.id.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  },

  // Get task by ID with patient info
  async findById(id: number): Promise<TaskWithPatient | undefined> {
    const results = await db
      .select({
        task: tasks,
        patient: patients,
      })
      .from(tasks)
      .innerJoin(patients, eq(tasks.patientId, patients.id))
      .where(eq(tasks.id, id))
      .limit(1)

    if (results.length === 0) return undefined
    return { ...results[0].task, patient: results[0].patient }
  },

  // Get tasks by patient ID
  async findByPatientId(patientId: string): Promise<TaskWithPatient[]> {
    const results = await db
      .select({
        task: tasks,
        patient: patients,
      })
      .from(tasks)
      .innerJoin(patients, eq(tasks.patientId, patients.id))
      .where(eq(tasks.patientId, patientId))
      .orderBy(desc(tasks.createdAt))

    return results.map(r => ({ ...r.task, patient: r.patient }))
  },

  // Get tasks by agent ID
  async findByAgentId(agentId: string): Promise<TaskWithPatient[]> {
    const results = await db
      .select({
        task: tasks,
        patient: patients,
      })
      .from(tasks)
      .innerJoin(patients, eq(tasks.patientId, patients.id))
      .where(eq(tasks.assignedAgentId, agentId))
      .orderBy(desc(tasks.updatedAt))

    return results.map(r => ({ ...r.task, patient: r.patient }))
  },

  // Create task
  async create(data: NewTask): Promise<Task> {
    const results = await db.insert(tasks).values(data).returning()
    return results[0]
  },

  // Update task
  async update(id: number, data: Partial<NewTask>): Promise<Task | undefined> {
    const results = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
    return results[0]
  },

  // Update task status
  async updateStatus(id: number, status: TaskStatus): Promise<Task | undefined> {
    return this.update(id, { status })
  },

  // Add timeline event
  async addTimelineEvent(id: number, event: TimelineEvent): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    if (result.length === 0) return undefined

    const task = result[0]
    const timeline = [...(task.timeline || []), event]
    return this.update(id, { timeline })
  },

  // Mark task as read
  async markAsRead(id: number): Promise<Task | undefined> {
    return this.update(id, { unread: false })
  },

  // Mark task as unread
  async markAsUnread(id: number): Promise<Task | undefined> {
    return this.update(id, { unread: true })
  },

  // Delete task
  async delete(id: number): Promise<boolean> {
    const results = await db.delete(tasks).where(eq(tasks.id, id)).returning()
    return results.length > 0
  },

  // Get task counts by status
  async getStatusCounts(): Promise<Record<TaskStatus | 'total', number>> {
    const allTasks = await db.select().from(tasks)
    const counts: Record<string, number> = {
      total: allTasks.length,
      'in-progress': 0,
      'scheduled': 0,
      'escalated': 0,
      'pending': 0,
      'completed': 0,
    }

    for (const task of allTasks) {
      if (task.status && counts[task.status] !== undefined) {
        counts[task.status]++
      }
    }

    return counts as Record<TaskStatus | 'total', number>
  },

  // Seed tasks
  async seedTasks(taskList: NewTask[]): Promise<Task[]> {
    const results = await db.insert(tasks).values(taskList).returning()
    return results
  },

  // Add retry attempt to history
  async addRetryAttempt(id: number, attempt: RetryAttempt): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
    if (result.length === 0) return undefined

    const task = result[0]
    const retryHistory = [...(task.retryHistory || []), attempt]
    const retryCount = (task.retryCount || 0) + 1

    return this.update(id, {
      retryHistory,
      retryCount,
      lastAttemptAt: new Date(),
    })
  },

  // Schedule retry for task
  async scheduleRetry(id: number, nextRetryAt: Date): Promise<Task | undefined> {
    return this.update(id, { nextRetryAt })
  },

  // Get tasks pending retry
  async findPendingRetries(): Promise<TaskWithPatient[]> {
    const now = new Date()
    const results = await db
      .select({
        task: tasks,
        patient: patients,
      })
      .from(tasks)
      .innerJoin(patients, eq(tasks.patientId, patients.id))
      .orderBy(desc(tasks.nextRetryAt))

    // Filter for tasks with pending retries that are due
    return results
      .filter(r => r.task.nextRetryAt && new Date(r.task.nextRetryAt) <= now)
      .map(r => ({ ...r.task, patient: r.patient }))
  },

  // Clear retry schedule
  async clearRetrySchedule(id: number): Promise<Task | undefined> {
    return this.update(id, { nextRetryAt: null })
  },
}
