import type { VoiceAgent, FlagReasonOption, StatusOption } from './task-types'

// Extended VoiceAgent with Vapi ID for AI agents
export interface AIVoiceAgent extends VoiceAgent {
  vapiAssistantId?: string
}

// AI Agents with their real Vapi assistant IDs
export const aiAgents: AIVoiceAgent[] = [
  {
    id: 'ai-luna',
    name: 'Luna',
    type: 'ai',
    role: 'Appointment Confirmation',
    avatar: '🤖',
    vapiAssistantId: '306c5a82-9c92-4049-8adb-9f22546e4910'
  },
  {
    id: 'ai-max',
    name: 'Max',
    type: 'ai',
    role: 'No-Show Follow Up',
    avatar: '🤖',
    vapiAssistantId: 'a8b6b1ca-847c-4721-9815-e7bd0a7b8c62'
  },
  {
    id: 'ai-nova',
    name: 'Nova',
    type: 'ai',
    role: 'Pre-Visit Preparation',
    avatar: '🤖',
    vapiAssistantId: 'd1053a6b-3088-47dd-acf6-cf03292cb6ed'
  },
  {
    id: 'ai-aria',
    name: 'Aria',
    type: 'ai',
    role: 'Annual Recall',
    avatar: '🤖',
    vapiAssistantId: 'aa162312-8a2c-46c1-922e-e3cb65f802c8'
  },
]

// Staff Members
export const staffMembers: VoiceAgent[] = [
  { id: 'sarah', name: 'Sarah M.', type: 'staff', role: 'Front Office', avatar: 'SM' },
  { id: 'john', name: 'John D.', type: 'staff', role: 'Back Office', avatar: 'JD' },
  { id: 'maria', name: 'Maria G.', type: 'staff', role: 'Billing', avatar: 'MG' },
  { id: 'tom', name: 'Tom R.', type: 'staff', role: 'Front Office', avatar: 'TR' },
  { id: 'lisa', name: 'Lisa K.', type: 'staff', role: 'Scheduling', avatar: 'LK' },
  { id: 'mike', name: 'Mike P.', type: 'staff', role: 'Back Office', avatar: 'MP' },
]

// All agents combined
export const allAgents: VoiceAgent[] = [...aiAgents, ...staffMembers]

// Get agent by ID
export function getAgent(id: string): VoiceAgent | undefined {
  return allAgents.find(a => a.id === id)
}

// Get AI agent by ID (with Vapi assistant ID)
export function getAIAgent(id: string): AIVoiceAgent | undefined {
  return aiAgents.find(a => a.id === id)
}

// Get Vapi assistant ID for an agent
export function getVapiAssistantId(agentId: string): string | undefined {
  const agent = aiAgents.find(a => a.id === agentId)
  return agent?.vapiAssistantId
}

// Filter agents by search query
export function getFilteredAgents(query: string): { ai: VoiceAgent[]; staff: VoiceAgent[] } {
  const q = query.toLowerCase().trim()
  if (!q) return { ai: aiAgents, staff: staffMembers }
  return {
    ai: aiAgents.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)),
    staff: staffMembers.filter(a => a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)),
  }
}

// Flag reason options
export const flagReasons: FlagReasonOption[] = [
  { id: 'abusive-language', label: 'Abusive Language', description: 'Used profanity or offensive language' },
  { id: 'verbal-threats', label: 'Verbal Threats', description: 'Made threatening statements' },
  { id: 'harassment', label: 'Harassment', description: 'Harassing or intimidating behavior' },
  { id: 'discriminatory', label: 'Discriminatory Remarks', description: 'Made discriminatory or hateful comments' },
  { id: 'other', label: 'Other Concern', description: 'Other behavioral concern' },
]

// Status options for filters
export const statusOptions: StatusOption[] = [
  { id: 'all', label: 'All Status', color: 'bg-gray-100 text-gray-600' },
  { id: 'in-progress', label: 'Active', color: 'bg-amber-100 text-amber-700' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700' },
  { id: 'escalated', label: 'Escalated', color: 'bg-red-100 text-red-700' },
  { id: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-600' },
  { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
]

// Get status color classes
export function getStatusColor(status: string): { dot: string; badge: string } {
  switch (status) {
    case 'in-progress':
      return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' }
    case 'scheduled':
      return { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' }
    case 'escalated':
      return { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' }
    case 'pending':
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
    case 'completed':
      return { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' }
    default:
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
  }
}

// Get status label
export function getStatusLabel(status: string): string {
  const option = statusOptions.find(s => s.id === status)
  return option?.label || status
}
