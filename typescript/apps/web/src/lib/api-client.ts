/**
 * API Client for backend communication
 * Uses shared types from @repo/types
 */

import type {
  Agent,
  Patient,
  Task,
  TaskWithPatient,
  TaskStatus,
  TaskFilters,
  Call,
  CallStatus,
  CallStatusResponse,
  StartOutboundCall,
  OutboundCallResponse,
  TimelineEvent,
  EhrSync,
  TranscriptMessage,
} from '@repo/types'

// Re-export types for convenience
export type {
  Agent,
  Patient,
  Task,
  TaskWithPatient,
  TaskStatus,
  TaskFilters,
  Call,
  CallStatus,
  CallStatusResponse,
  StartOutboundCall,
  OutboundCallResponse,
  TimelineEvent,
  EhrSync,
  TranscriptMessage,
}

// Extend Window interface for runtime env config
declare global {
  interface Window {
    __ENV__?: {
      VITE_API_URL?: string
      VITE_VAPI_PUBLIC_KEY?: string
    }
  }
}

// Get API base URL from runtime env config, env vars, or default to '/api' (works with Vite proxy)
function getApiBase(): string {
  // First check runtime env config (for Docker/production)
  if (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) {
    const url = window.__ENV__.VITE_API_URL
    // Skip placeholder values
    if (url && !url.startsWith('__')) {
      return url
    }
  }
  // Then check Vite env vars (for development)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Default to relative path (works with Vite proxy in dev)
  return '/api'
}

const API_BASE = getApiBase()

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// API Client
// ============================================================================

export const api = {
  // -------------------------------------------------------------------------
  // Agents API
  // -------------------------------------------------------------------------
  agents: {
    list: (): Promise<Agent[]> => fetchAPI('/agents'),

    grouped: (): Promise<{ ai: Agent[]; staff: Agent[] }> =>
      fetchAPI('/agents/grouped'),

    aiAgents: (): Promise<Agent[]> => fetchAPI('/agents/ai'),

    staff: (): Promise<Agent[]> => fetchAPI('/agents/staff'),

    getById: (id: string): Promise<Agent> => fetchAPI(`/agents/${id}`),

    create: (data: Partial<Agent>): Promise<Agent> =>
      fetchAPI('/agents', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Agent>): Promise<Agent> =>
      fetchAPI(`/agents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      fetchAPI(`/agents/${id}`, {
        method: 'DELETE',
      }),
  },

  // -------------------------------------------------------------------------
  // Tasks API
  // -------------------------------------------------------------------------
  tasks: {
    list: (filters?: TaskFilters): Promise<TaskWithPatient[]> => {
      const params = new URLSearchParams()
      if (filters?.statuses?.length) {
        params.set('status', filters.statuses.join(','))
      }
      if (filters?.agent && filters.agent !== 'all') {
        params.set('agent', filters.agent)
      }
      if (filters?.type && filters.type !== 'all') {
        params.set('type', filters.type)
      }
      if (filters?.search) {
        params.set('search', filters.search)
      }
      const query = params.toString()
      return fetchAPI(`/tasks${query ? `?${query}` : ''}`)
    },

    counts: (): Promise<Record<TaskStatus | 'total', number>> =>
      fetchAPI('/tasks/counts'),

    getById: (id: number): Promise<TaskWithPatient> => fetchAPI(`/tasks/${id}`),

    create: (data: Partial<Task>): Promise<Task> =>
      fetchAPI('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<Task>): Promise<Task> =>
      fetchAPI(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    complete: (id: number, description?: string): Promise<Task> =>
      fetchAPI(`/tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify({ description }),
      }),

    escalate: (id: number, assignedTo: string, reason: string): Promise<Task> =>
      fetchAPI(`/tasks/${id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ assignedTo, reason }),
      }),

    addNote: (id: number, content: string): Promise<Task> =>
      fetchAPI(`/tasks/${id}/note`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    markAsRead: (id: number): Promise<Task> =>
      fetchAPI(`/tasks/${id}/read`, {
        method: 'POST',
      }),

    reassign: (id: number, agentId: string, agentName: string): Promise<Task> =>
      fetchAPI(`/tasks/${id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ agentId, agentName }),
      }),

    delete: (id: number): Promise<{ success: boolean }> =>
      fetchAPI(`/tasks/${id}`, {
        method: 'DELETE',
      }),
  },

  // -------------------------------------------------------------------------
  // Calls API
  // -------------------------------------------------------------------------
  calls: {
    list: (): Promise<Call[]> => fetchAPI('/calls'),

    getById: (id: string): Promise<Call> => fetchAPI(`/calls/${id}`),

    getStatus: (id: string): Promise<CallStatusResponse> => fetchAPI(`/calls/${id}/status`),

    getByTask: (taskId: number): Promise<Call[]> => fetchAPI(`/calls/task/${taskId}`),

    startOutbound: (params: StartOutboundCall): Promise<OutboundCallResponse> =>
      fetchAPI('/calls/outbound', {
        method: 'POST',
        body: JSON.stringify(params),
      }),

    end: (id: string): Promise<{ success: boolean }> =>
      fetchAPI(`/calls/${id}/end`, {
        method: 'POST',
      }),

    processCompletion: (id: string): Promise<{
      action: 'completed' | 'escalated' | 'flagged'
      message: string
    }> =>
      fetchAPI(`/calls/${id}/process`, {
        method: 'POST',
      }),
  },

  // -------------------------------------------------------------------------
  // Health Check
  // -------------------------------------------------------------------------
  health: {
    check: (): Promise<{ status: string; timestamp: string }> =>
      fetchAPI('/health'),
  },
}
