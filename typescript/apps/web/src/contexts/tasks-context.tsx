import * as React from 'react'
import type {
  Task as FrontendTask,
  TaskFilters,
  PatientBehaviorFlag,
  PatientFlagReason,
} from '@/lib/task-types'
import { api, type TaskWithPatient, type Task as ApiTask, type Agent } from '@/lib/api-client'
import { useCurrentUser } from '@/contexts/user-context'

// Convert API task (with patient) to frontend task format
function convertApiTaskToFrontend(apiTask: TaskWithPatient): FrontendTask {
  // Build patient name from firstName and lastName
  const patientName = `${apiTask.patient.firstName} ${apiTask.patient.lastName}`.trim()

  return {
    id: apiTask.id,
    patient: {
      id: apiTask.patient.id,
      name: patientName,
      phone: apiTask.patient.phone || '',
      dob: apiTask.patient.dob || '',
    },
    provider: apiTask.provider,
    type: apiTask.type,
    status: apiTask.status,
    assignedAgent: apiTask.assignedAgentId || '',
    time: apiTask.time || '',
    unread: apiTask.unread,
    amount: apiTask.amount ?? undefined,
    description: apiTask.description,
    ehrSync: apiTask.ehrSync,
    // Cast timeline through unknown since API returns generic type
    timeline: apiTask.timeline as unknown as FrontendTask['timeline'],
  }
}

// Merge API task update with existing frontend task (keeps patient data)
function mergeTaskUpdate(existingTask: FrontendTask, updatedTask: ApiTask): FrontendTask {
  return {
    ...existingTask,
    status: updatedTask.status,
    assignedAgent: updatedTask.assignedAgentId || '',
    time: updatedTask.time || existingTask.time,
    unread: updatedTask.unread,
    amount: updatedTask.amount ?? existingTask.amount,
    description: updatedTask.description,
    ehrSync: updatedTask.ehrSync,
    timeline: updatedTask.timeline as unknown as FrontendTask['timeline'],
  }
}

interface TasksState {
  tasks: FrontendTask[]
  selectedTaskId: number | null
  filters: TaskFilters
  patientFlags: Record<string, PatientBehaviorFlag>
  syncingTasks: Record<number, boolean>
  expandedEvents: Record<string, boolean>
  editingObjective: { taskId: number; eventId: string; itemIndex: number } | null
  refreshing: boolean
  loading: boolean
  error: string | null
}

interface TasksContextValue extends TasksState {
  // Agents
  agents: Agent[]
  getAgent: (id: string) => Agent | undefined
  getAIAgents: () => Agent[]
  getStaffAgents: () => Agent[]

  // Selection
  selectTask: (id: number) => void
  clearSelection: () => void
  getSelectedTask: () => FrontendTask | undefined

  // Filters
  setFilters: (filters: Partial<TaskFilters>) => void
  clearFilters: () => void
  getFilteredTasks: () => FrontendTask[]
  getActiveFilterCount: () => number

  // Task actions
  markTaskRead: (id: number) => void
  markTaskDone: (id: number) => void
  reopenTask: (id: number) => void
  escalateTask: (id: number, reason: string, assignTo: string) => void
  assignTask: (taskId: number, agentId: string) => void
  addNoteToTask: (taskId: number, note: string) => void
  deleteTask: (id: number) => Promise<void>
  createTask: (data: { patientId: string; type: string; assignedAgentId?: string; description?: string; amount?: string }) => Promise<void>

  // Patient flags
  flagPatient: (patientId: string, reason: PatientFlagReason, notes: string, flaggedBy: string) => void
  removePatientFlag: (patientId: string) => void
  isPatientFlagged: (patientId: string) => boolean
  getPatientFlag: (patientId: string) => PatientBehaviorFlag | undefined

  // Call completion handling
  handleCallCompletion: (
    taskId: number,
    callId: string
  ) => Promise<{ action: 'completed' | 'escalated' | 'flagged'; message: string }>

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
    scheduled: FrontendTask[]
    inProgress: FrontendTask[]
    needsAttention: FrontendTask[]
    completed: FrontendTask[]
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
  const [tasks, setTasks] = React.useState<FrontendTask[]>([])
  const [selectedTaskId, setSelectedTaskId] = React.useState<number | null>(null)
  const [filters, setFiltersState] = React.useState<TaskFilters>(initialFilters)
  const [patientFlags, setPatientFlags] = React.useState<Record<string, PatientBehaviorFlag>>({})
  const [syncingTasks, setSyncingTasks] = React.useState<Record<number, boolean>>({})
  const [expandedEvents, setExpandedEvents] = React.useState<Record<string, boolean>>({})
  const [editingObjective, setEditingObjective] = React.useState<{
    taskId: number
    eventId: string
    itemIndex: number
  } | null>(null)
  const [refreshing, setRefreshing] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Agents cache - stores full agent data from API
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [agentsMap, setAgentsMap] = React.useState<Record<string, Agent>>({})

  // Load tasks from API on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load tasks and agents in parallel
        const [apiTasks, agentsList] = await Promise.all([
          api.tasks.list(),
          api.agents.list(),
        ])

        // Store agents and build lookup map
        setAgents(agentsList)
        const agentMap: Record<string, Agent> = {}
        for (const agent of agentsList) {
          agentMap[agent.id] = agent
        }
        setAgentsMap(agentMap)

        // Convert and set tasks
        const frontendTasks = apiTasks.map(convertApiTaskToFrontend)
        setTasks(frontendTasks)

        // Select first task if any
        if (frontendTasks.length > 0 && !selectedTaskId) {
          setSelectedTaskId(frontendTasks[0].id)
        }
      } catch (err) {
        console.error('Error loading tasks:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tasks')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Selection
  const selectTask = React.useCallback(async (id: number) => {
    setSelectedTaskId(id)
    // Mark as read via API
    try {
      await api.tasks.markAsRead(id)
      setTasks(prev =>
        prev.map(task => (task.id === id ? { ...task, unread: false } : task))
      )
    } catch (err) {
      console.error('Error marking task as read:', err)
    }
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
  const markTaskRead = React.useCallback(async (id: number) => {
    try {
      await api.tasks.markAsRead(id)
      setTasks(prev =>
        prev.map(task => (task.id === id ? { ...task, unread: false } : task))
      )
    } catch (err) {
      console.error('Error marking task as read:', err)
    }
  }, [])

  const markTaskDone = React.useCallback(async (id: number) => {
    try {
      const updatedTask = await api.tasks.complete(id)
      setTasks(prev =>
        prev.map(task => (task.id === id ? mergeTaskUpdate(task, updatedTask) : task))
      )
    } catch (err) {
      console.error('Error completing task:', err)
    }
  }, [])

  const reopenTask = React.useCallback(async (id: number) => {
    try {
      const updatedTask = await api.tasks.update(id, { status: 'in-progress' })
      setTasks(prev =>
        prev.map(task => (task.id === id ? mergeTaskUpdate(task, updatedTask) : task))
      )
    } catch (err) {
      console.error('Error reopening task:', err)
    }
  }, [])

  const escalateTask = React.useCallback(async (id: number, reason: string, assignTo: string) => {
    try {
      const updatedTask = await api.tasks.escalate(id, assignTo, reason)
      setTasks(prev =>
        prev.map(task => (task.id === id ? mergeTaskUpdate(task, updatedTask) : task))
      )
    } catch (err) {
      console.error('Error escalating task:', err)
    }
  }, [])

  const assignTask = React.useCallback(async (taskId: number, agentId: string) => {
    try {
      const agent = agentsMap[agentId]
      const agentName = agent?.name || agentId
      const updatedTask = await api.tasks.reassign(taskId, agentId, agentName)
      setTasks(prev =>
        prev.map(task => (task.id === taskId ? mergeTaskUpdate(task, updatedTask) : task))
      )
    } catch (err) {
      console.error('Error assigning task:', err)
    }
  }, [agentsMap])

  const addNoteToTask = React.useCallback(async (taskId: number, note: string) => {
    try {
      const updatedTask = await api.tasks.addNote(taskId, note)
      setTasks(prev =>
        prev.map(task => (task.id === taskId ? mergeTaskUpdate(task, updatedTask) : task))
      )
    } catch (err) {
      console.error('Error adding note:', err)
    }
  }, [])

  const deleteTask = React.useCallback(async (id: number) => {
    try {
      await api.tasks.delete(id)
      setTasks(prev => prev.filter(task => task.id !== id))
      // Clear selection if deleted task was selected
      if (selectedTaskId === id) {
        setSelectedTaskId(null)
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      throw err
    }
  }, [selectedTaskId])

  const createTask = React.useCallback(async (data: {
    patientId: string
    type: string
    assignedAgentId?: string
    description?: string
    amount?: string
  }) => {
    try {
      await api.tasks.create({
        patientId: data.patientId,
        provider: 'Manual Entry',
        type: data.type as any,
        status: 'pending',
        description: data.description || '',
        assignedAgentId: data.assignedAgentId,
        amount: data.amount,
      })
      // Refresh to get the new task with patient data
      await refresh()
    } catch (err) {
      console.error('Error creating task:', err)
      throw err
    }
  }, [])

  // Patient flags (kept local for now, could be moved to backend)
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

  // Handle call completion - now uses backend API
  const handleCallCompletion = React.useCallback(
    async (
      taskId: number,
      callId: string
    ): Promise<{ action: 'completed' | 'escalated' | 'flagged'; message: string }> => {
      try {
        // Process call completion on backend
        const result = await api.calls.processCompletion(callId)

        // Refresh the task to get updated data
        const updatedTask = await api.tasks.getById(taskId)
        setTasks(prev =>
          prev.map(task => (task.id === taskId ? convertApiTaskToFrontend(updatedTask) : task))
        )

        // Handle patient flag if needed
        if (result.action === 'flagged') {
          const task = tasks.find(t => t.id === taskId)
          if (task) {
            flagPatient(task.patient.id, 'abusive-language', 'Detected during call', 'AI Agent')
          }
        }

        return result
      } catch (err) {
        console.error('Error processing call completion:', err)
        return { action: 'escalated', message: 'Error processing call - requires manual review' }
      }
    },
    [tasks, flagPatient]
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
              // Cast to any for timeline manipulation, then back
              const objectivesEvent = event as unknown as { items: Array<{ text: string; status: string; patientResponse: string }> }
              const items = [...objectivesEvent.items]
              items[itemIndex] = { ...items[itemIndex], patientResponse: response, status }
              return { ...event, items } as typeof event
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
              // Cast to any for timeline manipulation, then back
              const nextStepsEvent = event as unknown as { items: Array<{ text: string; done: boolean }> }
              const items = [...nextStepsEvent.items]
              items[itemIndex] = { ...items[itemIndex], done: !items[itemIndex].done }
              return { ...event, items } as typeof event
            }),
          }
        })
      )
    },
    []
  )

  // Refresh - fetches fresh data from API
  const refresh = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const apiTasks = await api.tasks.list()
      const frontendTasks = apiTasks.map(convertApiTaskToFrontend)
      setTasks(frontendTasks)
    } catch (err) {
      console.error('Error refreshing tasks:', err)
    } finally {
      setRefreshing(false)
    }
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

  // Get agent by ID
  const getAgent = React.useCallback((id: string): Agent | undefined => {
    return agentsMap[id]
  }, [agentsMap])

  // Get AI agents only
  const getAIAgents = React.useCallback((): Agent[] => {
    return agents.filter(a => a.type === 'ai')
  }, [agents])

  // Get staff agents only
  const getStaffAgents = React.useCallback((): Agent[] => {
    return agents.filter(a => a.type === 'staff')
  }, [agents])

  // Stats
  const getStats = React.useCallback(() => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const aiHandled = tasks.filter(t => agentsMap[t.assignedAgent]?.type === 'ai').length
    const aiRate = tasks.length > 0 ? Math.round((aiHandled / tasks.length) * 100) : 0
    // Mock money saved calculation: $12.50 (manual) - $0.85 (AI) = $11.65 per AI task
    const moneySaved = aiHandled * 11.65

    return { completed, aiRate, moneySaved }
  }, [tasks, agentsMap])

  const value: TasksContextValue = {
    tasks,
    selectedTaskId,
    filters,
    patientFlags,
    syncingTasks,
    expandedEvents,
    editingObjective,
    refreshing,
    loading,
    error,
    agents,
    getAgent,
    getAIAgents,
    getStaffAgents,
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
    deleteTask,
    createTask,
    flagPatient,
    removePatientFlag,
    isPatientFlagged,
    getPatientFlag,
    handleCallCompletion,
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
