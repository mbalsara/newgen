import { taskRepository, type TaskFilters, type TaskWithPatient } from './repository'
import type { Task, NewTask, TimelineEvent, TaskStatus, RetryAttempt } from '@repo/database'

// Generate unique ID for timeline events
function generateEventId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Format timestamp for timeline
function formatTimestamp(): string {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export const taskService = {
  // Get all tasks with filters
  async getTasks(filters?: TaskFilters): Promise<TaskWithPatient[]> {
    return taskRepository.findAll(filters)
  },

  // Get task by ID
  async getTaskById(id: number): Promise<TaskWithPatient | undefined> {
    return taskRepository.findById(id)
  },

  // Get tasks by patient
  async getTasksByPatient(patientId: string): Promise<TaskWithPatient[]> {
    return taskRepository.findByPatientId(patientId)
  },

  // Get tasks by agent
  async getTasksByAgent(agentId: string): Promise<TaskWithPatient[]> {
    return taskRepository.findByAgentId(agentId)
  },

  // Create task
  async createTask(data: NewTask): Promise<Task> {
    // Add created event to timeline
    const createdEvent: TimelineEvent = {
      id: generateEventId('created'),
      type: 'created',
      timestamp: formatTimestamp(),
      title: 'Task Created',
      description: data.description,
    }

    const taskData = {
      ...data,
      timeline: [createdEvent],
    }

    return taskRepository.create(taskData)
  },

  // Update task
  async updateTask(id: number, data: Partial<NewTask>): Promise<Task | undefined> {
    return taskRepository.update(id, data)
  },

  // Mark task as complete
  async completeTask(id: number, description?: string): Promise<Task | undefined> {
    const completedEvent: TimelineEvent = {
      id: generateEventId('completed'),
      type: 'completed',
      timestamp: formatTimestamp(),
      title: 'Task Completed',
      description: description || 'Task marked as complete',
    }

    await taskRepository.addTimelineEvent(id, completedEvent)
    return taskRepository.updateStatus(id, 'completed')
  },

  // Escalate task to staff
  async escalateTask(id: number, assignedTo: string, reason: string): Promise<Task | undefined> {
    const escalatedEvent: TimelineEvent = {
      id: generateEventId('escalated'),
      type: 'escalated',
      timestamp: formatTimestamp(),
      title: 'Escalated to Staff',
      assignedTo,
      reason,
    }

    await taskRepository.addTimelineEvent(id, escalatedEvent)
    return taskRepository.update(id, {
      status: 'escalated',
      assignedAgentId: assignedTo,
    })
  },

  // Add note to task
  async addNote(id: number, content: string): Promise<Task | undefined> {
    const noteEvent: TimelineEvent = {
      id: generateEventId('note'),
      type: 'note',
      timestamp: formatTimestamp(),
      title: 'Note Added',
      content,
    }

    return taskRepository.addTimelineEvent(id, noteEvent)
  },

  // Add call event to task timeline
  async addCallEvent(id: number, callData: {
    endedReason: string
    transcript?: string
  }): Promise<Task | undefined> {
    const callEvent: TimelineEvent = {
      id: generateEventId('call'),
      type: 'call',
      timestamp: formatTimestamp(),
      title: 'Outbound Call',
      endedReason: callData.endedReason,
      transcript: callData.transcript,
    }

    return taskRepository.addTimelineEvent(id, callEvent)
  },

  // Mark task as read
  async markAsRead(id: number): Promise<Task | undefined> {
    return taskRepository.markAsRead(id)
  },

  // Mark task as unread
  async markAsUnread(id: number): Promise<Task | undefined> {
    return taskRepository.markAsUnread(id)
  },

  // Update task status
  async updateStatus(id: number, status: TaskStatus): Promise<Task | undefined> {
    return taskRepository.updateStatus(id, status)
  },

  // Delete task
  async deleteTask(id: number): Promise<boolean> {
    return taskRepository.delete(id)
  },

  // Get status counts
  async getStatusCounts(): Promise<Record<TaskStatus | 'total', number>> {
    return taskRepository.getStatusCounts()
  },

  // Reassign task to new agent
  async reassignTask(id: number, agentId: string, agentName: string): Promise<Task | undefined> {
    const noteEvent: TimelineEvent = {
      id: generateEventId('note'),
      type: 'note',
      timestamp: formatTimestamp(),
      title: 'Task Reassigned',
      content: `Task reassigned to ${agentName}`,
    }

    await taskRepository.addTimelineEvent(id, noteEvent)
    return taskRepository.update(id, { assignedAgentId: agentId })
  },

  // Record a retry attempt
  async recordRetryAttempt(
    id: number,
    callId: string,
    outcome: string,
    duration: number,
    notes?: string
  ): Promise<Task | undefined> {
    const task = await taskRepository.findById(id)
    if (!task) return undefined

    const attemptNumber = (task.retryCount || 0) + 1

    const attempt: RetryAttempt = {
      attemptNumber,
      callId,
      timestamp: new Date().toISOString(),
      outcome,
      duration,
      notes,
    }

    // Add timeline event for retry
    const retryEvent: TimelineEvent = {
      id: generateEventId('retry-attempt'),
      type: 'retry-attempt',
      timestamp: formatTimestamp(),
      title: `Call Attempt #${attemptNumber}`,
      attemptNumber,
      callId,
      outcome,
      duration,
      notes,
    }

    await taskRepository.addTimelineEvent(id, retryEvent)
    return taskRepository.addRetryAttempt(id, attempt)
  },

  // Schedule a retry for a task
  async scheduleRetry(
    id: number,
    reason: string,
    delayMinutes: number = 60
  ): Promise<Task | undefined> {
    const task = await taskRepository.findById(id)
    if (!task) return undefined

    const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000)

    // Add timeline event for scheduled retry
    const scheduleEvent: TimelineEvent = {
      id: generateEventId('retry-scheduled'),
      type: 'retry-scheduled',
      timestamp: formatTimestamp(),
      title: 'Retry Scheduled',
      attemptNumber: (task.retryCount || 0) + 1,
      reason,
      scheduledFor: nextRetryAt.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    }

    await taskRepository.addTimelineEvent(id, scheduleEvent)
    return taskRepository.scheduleRetry(id, nextRetryAt)
  },

  // Add voicemail event
  async recordVoicemail(id: number, callId: string): Promise<Task | undefined> {
    const voicemailEvent: TimelineEvent = {
      id: generateEventId('voicemail'),
      type: 'voicemail',
      timestamp: formatTimestamp(),
      title: 'Voicemail Left',
      callId,
      description: 'A voicemail message was left for the patient.',
    }

    return taskRepository.addTimelineEvent(id, voicemailEvent)
  },

  // Check if task has exceeded max retries
  async hasExceededMaxRetries(id: number): Promise<boolean> {
    const task = await taskRepository.findById(id)
    if (!task) return false

    const maxRetries = task.maxRetries || 5
    return (task.retryCount || 0) >= maxRetries
  },

  // Get pending retry tasks
  async getPendingRetryTasks(): Promise<TaskWithPatient[]> {
    return taskRepository.findPendingRetries()
  },

  // Clear retry schedule when task is completed
  async clearRetrySchedule(id: number): Promise<Task | undefined> {
    return taskRepository.clearRetrySchedule(id)
  },
}
