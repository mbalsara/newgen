import { taskRepository, type TaskFilters, type TaskWithPatient } from './repository'
import type { Task, NewTask, TimelineEvent, TaskStatus } from '@repo/database'

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
}
