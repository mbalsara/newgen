import * as React from 'react'
import type {
  Task,
  TaskFilters,
  TaskStatus,
  PatientBehaviorFlag,
  PatientFlagReason,
} from '@/lib/task-types'
import { mockTasks, patientFlags as initialPatientFlags } from '@/lib/mock-tasks'
import { getAgent } from '@/lib/mock-agents'
import { useCurrentUser } from '@/contexts/user-context'

interface TasksState {
  tasks: Task[]
  selectedTaskId: number | null
  filters: TaskFilters
  patientFlags: Record<string, PatientBehaviorFlag>
  syncingTasks: Record<number, boolean>
  expandedEvents: Record<string, boolean>
  editingObjective: { taskId: number; eventId: string; itemIndex: number } | null
  refreshing: boolean
}

interface TasksContextValue extends TasksState {
  // Selection
  selectTask: (id: number) => void
  clearSelection: () => void
  getSelectedTask: () => Task | undefined

  // Filters
  setFilters: (filters: Partial<TaskFilters>) => void
  clearFilters: () => void
  getFilteredTasks: () => Task[]
  getActiveFilterCount: () => number

  // Task actions
  markTaskRead: (id: number) => void
  markTaskDone: (id: number) => void
  reopenTask: (id: number) => void
  escalateTask: (id: number, reason: string, assignTo: string) => void
  assignTask: (taskId: number, agentId: string) => void
  addNoteToTask: (taskId: number, note: string) => void

  // Patient flags
  flagPatient: (patientId: string, reason: PatientFlagReason, notes: string, flaggedBy: string) => void
  removePatientFlag: (patientId: string) => void
  isPatientFlagged: (patientId: string) => boolean
  getPatientFlag: (patientId: string) => PatientBehaviorFlag | undefined

  // EHR Sync
  syncTask: (taskId: number) => Promise<void>
  isSyncing: (taskId: number) => boolean

  // Timeline events
  toggleEventExpanded: (eventId: string) => void
  isEventExpanded: (eventId: string) => boolean
  setEditingObjective: (value: { taskId: number; eventId: string; itemIndex: number } | null) => void
  updateObjective: (
    taskId: number,
    eventId: string,
    itemIndex: number,
    response: string,
    status: 'confirmed' | 'needs-attention'
  ) => void
  toggleNextStep: (taskId: number, eventId: string, itemIndex: number) => void

  // Refresh
  refresh: () => Promise<void>

  // Queue data
  getQueueData: () => {
    scheduled: Task[]
    inProgress: Task[]
    needsAttention: Task[]
    completed: Task[]
  }

  // Stats
  getStats: () => {
    completed: number
    aiRate: number
    moneySaved: number
  }
}

const TasksContext = React.createContext<TasksContextValue | null>(null)

const initialFilters: TaskFilters = {
  statuses: [],  // All statuses
  agent: 'me',   // My assigned tasks
  type: 'all',
  search: '',
}

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCurrentUser()
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks)
  const [selectedTaskId, setSelectedTaskId] = React.useState<number | null>(mockTasks[0]?.id ?? null)
  const [filters, setFiltersState] = React.useState<TaskFilters>(initialFilters)
  const [patientFlags, setPatientFlags] = React.useState<Record<string, PatientBehaviorFlag>>(initialPatientFlags)
  const [syncingTasks, setSyncingTasks] = React.useState<Record<number, boolean>>({})
  const [expandedEvents, setExpandedEvents] = React.useState<Record<string, boolean>>({})
  const [editingObjective, setEditingObjective] = React.useState<{
    taskId: number
    eventId: string
    itemIndex: number
  } | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)

  // Selection
  const selectTask = React.useCallback((id: number) => {
    setSelectedTaskId(id)
    // Mark as read when selected
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, unread: false } : task))
    )
  }, [])

  const clearSelection = React.useCallback(() => {
    setSelectedTaskId(null)
  }, [])

  const getSelectedTask = React.useCallback(() => {
    return tasks.find(t => t.id === selectedTaskId)
  }, [tasks, selectedTaskId])

  // Filters
  const setFilters = React.useCallback((newFilters: Partial<TaskFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = React.useCallback(() => {
    setFiltersState(initialFilters)
  }, [])

  const getFilteredTasks = React.useCallback(() => {
    return tasks.filter(task => {
      // If statuses array has items, filter by them; empty array means all
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false
      // Agent filter: 'me' = current user, 'all' = no filter, else specific agent
      if (filters.agent === 'me') {
        if (task.assignedAgent !== currentUser.id) return false
      } else if (filters.agent !== 'all') {
        if (task.assignedAgent !== filters.agent) return false
      }
      if (filters.type !== 'all' && task.type !== filters.type) return false
      if (filters.search) {
        const search = filters.search.toLowerCase()
        if (!task.patient.name.toLowerCase().includes(search)) return false
      }
      return true
    })
  }, [tasks, filters, currentUser.id])

  const getActiveFilterCount = React.useCallback(() => {
    let count = 0
    if (filters.statuses.length > 0) count++
    if (filters.agent !== 'all') count++
    if (filters.type !== 'all') count++
    return count
  }, [filters])

  // Task actions
  const markTaskRead = React.useCallback((id: number) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, unread: false } : task))
    )
  }, [])

  const markTaskDone = React.useCallback((id: number) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== id) return task
        const completedEvent = {
          id: `completed-${id}-${Date.now()}`,
          type: 'completed' as const,
          timestamp: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          title: 'Task Completed',
          description: 'Task marked as completed.',
        }
        return {
          ...task,
          status: 'completed' as TaskStatus,
          timeline: [...task.timeline, completedEvent],
        }
      })
    )
  }, [])

  const reopenTask = React.useCallback((id: number) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== id) return task
        // Remove the last completed event if exists
        const timeline = task.timeline.filter(
          (e, i) => !(e.type === 'completed' && i === task.timeline.length - 1)
        )
        return { ...task, status: 'in-progress' as TaskStatus, timeline }
      })
    )
  }, [])

  const escalateTask = React.useCallback(
    (id: number, reason: string, assignTo: string) => {
      const agent = getAgent(assignTo)
      setTasks(prev =>
        prev.map(task => {
          if (task.id !== id) return task
          const escalatedEvent = {
            id: `escalated-${id}-${Date.now()}`,
            type: 'escalated' as const,
            timestamp: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            title: 'Escalated to Staff',
            assignedTo: agent?.name || assignTo,
            reason,
          }
          return {
            ...task,
            status: 'escalated' as TaskStatus,
            assignedAgent: assignTo,
            timeline: [...task.timeline, escalatedEvent],
          }
        })
      )
    },
    []
  )

  const assignTask = React.useCallback((taskId: number, agentId: string) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, assignedAgent: agentId } : task))
    )
  }, [])

  const addNoteToTask = React.useCallback((taskId: number, note: string) => {
    const now = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task
        const noteEvent = {
          id: `note-${taskId}-${Date.now()}`,
          type: 'note' as const,
          timestamp: now,
          title: 'Note Added',
          content: note,
        }
        return { ...task, timeline: [...task.timeline, noteEvent] }
      })
    )
  }, [])

  // Patient flags
  const flagPatient = React.useCallback(
    (patientId: string, reason: PatientFlagReason, notes: string, flaggedBy: string) => {
      const now = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      setPatientFlags(prev => ({
        ...prev,
        [patientId]: { flagged: true, reason, notes, flaggedBy, flaggedAt: now },
      }))

      // Add flag event to task timeline if task exists for this patient
      setTasks(prev =>
        prev.map(task => {
          if (task.patient.id !== patientId) return task
          const flagEvent = {
            id: `flag-${task.id}-${Date.now()}`,
            type: 'flag' as const,
            timestamp: now,
            title: 'Patient Flagged',
            reason: reason.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            notes,
            flaggedBy,
          }
          return { ...task, timeline: [...task.timeline, flagEvent] }
        })
      )
    },
    []
  )

  const removePatientFlag = React.useCallback((patientId: string) => {
    setPatientFlags(prev => {
      const newFlags = { ...prev }
      delete newFlags[patientId]
      return newFlags
    })
  }, [])

  const isPatientFlagged = React.useCallback(
    (patientId: string) => {
      return !!patientFlags[patientId]?.flagged
    },
    [patientFlags]
  )

  const getPatientFlag = React.useCallback(
    (patientId: string) => {
      return patientFlags[patientId]
    },
    [patientFlags]
  )

  // EHR Sync
  const syncTask = React.useCallback(async (taskId: number) => {
    setSyncingTasks(prev => ({ ...prev, [taskId]: true }))
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== taskId) return task
        return {
          ...task,
          ehrSync: {
            status: 'synced',
            lastSync: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
          },
        }
      })
    )
    setSyncingTasks(prev => ({ ...prev, [taskId]: false }))
  }, [])

  const isSyncing = React.useCallback(
    (taskId: number) => {
      return !!syncingTasks[taskId]
    },
    [syncingTasks]
  )

  // Timeline events
  const toggleEventExpanded = React.useCallback((eventId: string) => {
    setExpandedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }, [])

  const isEventExpanded = React.useCallback(
    (eventId: string) => {
      return !!expandedEvents[eventId]
    },
    [expandedEvents]
  )

  const updateObjective = React.useCallback(
    (
      taskId: number,
      eventId: string,
      itemIndex: number,
      response: string,
      status: 'confirmed' | 'needs-attention'
    ) => {
      setTasks(prev =>
        prev.map(task => {
          if (task.id !== taskId) return task
          return {
            ...task,
            timeline: task.timeline.map(event => {
              if (event.id !== eventId || event.type !== 'objectives') return event
              const items = [...event.items]
              items[itemIndex] = { ...items[itemIndex], patientResponse: response, status }
              return { ...event, items }
            }),
          }
        })
      )
      setEditingObjective(null)
    },
    []
  )

  const toggleNextStep = React.useCallback(
    (taskId: number, eventId: string, itemIndex: number) => {
      setTasks(prev =>
        prev.map(task => {
          if (task.id !== taskId) return task
          return {
            ...task,
            timeline: task.timeline.map(event => {
              if (event.id !== eventId || event.type !== 'next-steps') return event
              const items = [...event.items]
              items[itemIndex] = { ...items[itemIndex], done: !items[itemIndex].done }
              return { ...event, items }
            }),
          }
        })
      )
    },
    []
  )

  // Refresh
  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }, [])

  // Queue data
  const getQueueData = React.useCallback(() => {
    const filtered = getFilteredTasks()
    return {
      scheduled: filtered.filter(t => t.status === 'scheduled'),
      inProgress: filtered.filter(t => t.status === 'in-progress'),
      needsAttention: filtered.filter(t => t.status === 'escalated' || t.status === 'pending'),
      completed: filtered.filter(t => t.status === 'completed'),
    }
  }, [getFilteredTasks])

  // Stats
  const getStats = React.useCallback(() => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const aiHandled = tasks.filter(t => getAgent(t.assignedAgent)?.type === 'ai').length
    const aiRate = tasks.length > 0 ? Math.round((aiHandled / tasks.length) * 100) : 0
    // Mock money saved calculation: $12.50 (manual) - $0.85 (AI) = $11.65 per AI task
    const moneySaved = aiHandled * 11.65

    return { completed, aiRate, moneySaved }
  }, [tasks])

  const value: TasksContextValue = {
    tasks,
    selectedTaskId,
    filters,
    patientFlags,
    syncingTasks,
    expandedEvents,
    editingObjective,
    refreshing,
    selectTask,
    clearSelection,
    getSelectedTask,
    setFilters,
    clearFilters,
    getFilteredTasks,
    getActiveFilterCount,
    markTaskRead,
    markTaskDone,
    reopenTask,
    escalateTask,
    assignTask,
    addNoteToTask,
    flagPatient,
    removePatientFlag,
    isPatientFlagged,
    getPatientFlag,
    syncTask,
    isSyncing,
    toggleEventExpanded,
    isEventExpanded,
    setEditingObjective,
    updateObjective,
    toggleNextStep,
    refresh,
    getQueueData,
    getStats,
  }

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}

export function useTasks() {
  const context = React.useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}
