/**
 * Agent Types and Interfaces
 */

export type AgentType = 'receptionist' | 'eligibility' | 'authorization'

export type VoiceGender = 'male' | 'female'

export type CallDirection = 'inbound' | 'outbound'

export interface VapiVoice {
  voiceId: string
  name: string
  provider: string
  gender: VoiceGender
  previewUrl?: string
  accent?: string
  description?: string
}

export interface Agent {
  id: string
  name: string
  agentType: AgentType
  voiceId: string
  voiceName: string
  voiceGender: VoiceGender
  callDirection: CallDirection
  callCount: number
  totalMinutes: number
  createdAt: string
  updatedAt: string
  squadId?: string
  squadName?: string
}

export interface AgentFormData {
  name: string
  agentType: AgentType
  voiceGender: VoiceGender
  voiceId: string
  callDirection: CallDirection
}

export interface VapiCallStats {
  totalCalls: number
  totalMinutes: number
}

// Agent type labels for display
export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  receptionist: 'Receptionist',
  eligibility: 'Eligibility',
  authorization: 'Authorization',
}

// Voice gender labels for display
export const VOICE_GENDER_LABELS: Record<VoiceGender, string> = {
  male: 'Male',
  female: 'Female',
}

// Call direction labels for display
export const CALL_DIRECTION_LABELS: Record<CallDirection, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
}
