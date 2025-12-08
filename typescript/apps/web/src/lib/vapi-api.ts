/**
 * VAPI API Utilities
 *
 * Functions for interacting with VAPI API to manage agents, voices, and calls.
 */

import type { Agent, VapiVoice, VoiceGender, VapiCallStats, AgentFormData } from './agent-types'

const VAPI_API_KEY = import.meta.env.VITE_VAPI_API_KEY || ''
const VAPI_BASE_URL = 'https://api.vapi.ai'

// Helper for VAPI requests
async function vapiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const response = await fetch(`${VAPI_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`VAPI API Error: ${response.status} - ${error}`)
  }

  // DELETE returns empty response
  if (method === 'DELETE') {
    return {} as T
  }

  return response.json()
}

// 11Labs voices available in VAPI (curated list with gender and preview URLs)
// Preview URLs are from 11Labs public voice library
const ELEVENLABS_VOICES: VapiVoice[] = [
  // Female voices
  { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', provider: '11labs', gender: 'female', accent: 'American', description: 'Calm, professional', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/6edb9076-c3e4-420c-b6ab-11d43fe341c8.mp3' },
  { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', provider: '11labs', gender: 'female', accent: 'American', description: 'Soft, gentle', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04e049f5-d561-4c24-a79d-6c8a66eabb5c.mp3' },
  { voiceId: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', provider: '11labs', gender: 'female', accent: 'American', description: 'Young, energetic', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/f9fd64c3-5d62-45cd-b0dc-ad722ee3284e.mp3' },
  { voiceId: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', provider: '11labs', gender: 'female', accent: 'American', description: 'Childlike', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/jBpfuIE2acCO8z3wKNLl/3a7e4339-78fa-404e-8d10-c3ef5587935b.mp3' },
  { voiceId: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', provider: '11labs', gender: 'female', accent: 'American (Southern)', description: 'Mature, warm', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/oWAxZDx7w5VEj9dCyTzz/84a36d1c-e182-41a8-8c55-dbdd15cd6e72.mp3' },
  { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', provider: '11labs', gender: 'female', accent: 'British', description: 'Warm, youthful', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pFZP5JQG7iQjIQuC4Bku/0aca4af1-0cdf-455e-9536-234646c90c75.mp3' },
  { voiceId: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', provider: '11labs', gender: 'female', accent: 'American', description: 'Witchy, mystical', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/z9fAnlkpzviPz146aGWa/cbc60443-7b61-4ebb-b8e1-5c03237ea01d.mp3' },
  { voiceId: 'piTKgcLEGmPE4e6mEKli', name: 'Nicole', provider: '11labs', gender: 'female', accent: 'American', description: 'Whisper, ASMR', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/piTKgcLEGmPE4e6mEKli/c269a54a-e2bc-44d0-bb46-4ed2666d6340.mp3' },

  // Male voices
  { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', provider: '11labs', gender: 'male', accent: 'American', description: 'Well-rounded, calm', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/38d8f8f0-1122-4333-b323-0b87478d506a.mp3' },
  { voiceId: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', provider: '11labs', gender: 'male', accent: 'American', description: 'Crisp, authoritative', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/66bc6a9f-fc6c-4c13-b4a4-fecf4e7a1e97.mp3' },
  { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', provider: '11labs', gender: 'male', accent: 'American', description: 'Deep, narration', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/e0b45450-78db-49b9-aaa4-d5358a6871bd.mp3' },
  { voiceId: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', provider: '11labs', gender: 'male', accent: 'American', description: 'Raspy, young', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/b018fcb5-7979-4c43-a46c-361e8e56e4ff.mp3' },
  { voiceId: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', provider: '11labs', gender: 'male', accent: 'American', description: 'Deep, engaging', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/07248d53-8cff-4753-9c9f-24ac5ee3e677.mp3' },
  { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', provider: '11labs', gender: 'male', accent: 'Australian', description: 'Natural, conversational', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/IKne3meq5aSn9XLyUdCD/102de6f2-22ed-43e0-a1f1-111fa75c5481.mp3' },
  { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', provider: '11labs', gender: 'male', accent: 'British', description: 'Warm, storytelling', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/JBFqnCBsd6RMkjVDRZzb/e6206d1a-0721-4b00-9516-53c4126b0c4b.mp3' },
  { voiceId: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', provider: '11labs', gender: 'male', accent: 'Transatlantic', description: 'Intense, powerful', previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/N2lVS1w4EtoT3dr4eOWO/ac833bd8-ffda-4938-9ebc-b0f99ca25481.mp3' },
]

/**
 * Get available 11Labs voices filtered by gender
 */
export function getVoices(gender?: VoiceGender): VapiVoice[] {
  if (!gender) return ELEVENLABS_VOICES
  return ELEVENLABS_VOICES.filter(v => v.gender === gender)
}

/**
 * Get a voice by ID
 */
export function getVoiceById(voiceId: string): VapiVoice | undefined {
  return ELEVENLABS_VOICES.find(v => v.voiceId === voiceId)
}

/**
 * Get preview URL for 11Labs voice
 */
export function getVoicePreviewUrl(voiceId: string): string {
  return `https://api.elevenlabs.io/v1/voices/${voiceId}/preview`
}

/**
 * Fetch all assistants from VAPI
 */
export async function fetchAssistants(): Promise<unknown[]> {
  return vapiRequest<unknown[]>('/assistant')
}

/**
 * Fetch all squads from VAPI
 */
export async function fetchSquads(): Promise<unknown[]> {
  return vapiRequest<unknown[]>('/squad')
}

/**
 * Fetch all calls from VAPI (for stats) - single API call
 */
export async function fetchAllCalls(): Promise<Array<{ assistantId?: string; duration?: number }>> {
  try {
    return await vapiRequest<Array<{ assistantId?: string; duration?: number }>>('/call')
  } catch {
    return []
  }
}

/**
 * Get call statistics aggregated by assistant ID
 */
export async function getAllCallStats(): Promise<Map<string, VapiCallStats>> {
  const statsMap = new Map<string, VapiCallStats>()

  try {
    const calls = await fetchAllCalls()

    for (const call of calls) {
      if (!call.assistantId) continue

      const existing = statsMap.get(call.assistantId) || { totalCalls: 0, totalMinutes: 0 }
      const duration = call.duration || 0

      statsMap.set(call.assistantId, {
        totalCalls: existing.totalCalls + 1,
        totalMinutes: Math.round((existing.totalMinutes + duration / 60) * 10) / 10,
      })
    }
  } catch {
    // Return empty map on error
  }

  return statsMap
}

/**
 * Fetch all agents (assistants) formatted for our UI
 */
export async function fetchAgents(): Promise<Agent[]> {
  try {
    // Fetch assistants, squads, and call stats in parallel (only 3 API calls total)
    const [assistants, squads, callStatsMap] = await Promise.all([
      fetchAssistants() as Promise<Array<{
        id: string
        name: string
        voice?: { voiceId?: string }
        createdAt?: string
        updatedAt?: string
        metadata?: {
          agentType?: string
          voiceGender?: string
          callDirection?: string
        }
      }>>,
      fetchSquads() as Promise<Array<{
        id: string
        name: string
        members?: Array<{ assistantId?: string }>
      }>>,
      getAllCallStats()
    ])

    // Build a map of assistantId -> squad info
    const assistantToSquad = new Map<string, { squadId: string; squadName: string }>()
    for (const squad of squads) {
      if (squad.members) {
        for (const member of squad.members) {
          if (member.assistantId) {
            assistantToSquad.set(member.assistantId, {
              squadId: squad.id,
              squadName: squad.name,
            })
          }
        }
      }
    }

    const agents: Agent[] = []

    for (const assistant of assistants) {
      // Get voice info
      const voiceId = assistant.voice?.voiceId || ''
      const voice = getVoiceById(voiceId)

      // Get squad info
      const squadInfo = assistantToSquad.get(assistant.id)

      // Get call stats from the pre-fetched map
      const callStats = callStatsMap.get(assistant.id) || { totalCalls: 0, totalMinutes: 0 }

      agents.push({
        id: assistant.id,
        name: assistant.name,
        agentType: (assistant.metadata?.agentType as Agent['agentType']) || 'receptionist',
        voiceId,
        voiceName: voice?.name || 'Unknown',
        voiceGender: voice?.gender || (assistant.metadata?.voiceGender as Agent['voiceGender']) || 'female',
        callDirection: (assistant.metadata?.callDirection as Agent['callDirection']) || 'inbound',
        callCount: callStats.totalCalls,
        totalMinutes: callStats.totalMinutes,
        createdAt: assistant.createdAt || new Date().toISOString(),
        updatedAt: assistant.updatedAt || new Date().toISOString(),
        squadId: squadInfo?.squadId,
        squadName: squadInfo?.squadName,
      })
    }

    return agents
  } catch (error) {
    console.error('Error fetching agents:', error)
    return []
  }
}

/**
 * Create a new assistant in VAPI
 */
export async function createAgent(data: AgentFormData): Promise<{ id: string }> {
  const voice = getVoiceById(data.voiceId)

  const assistant = {
    name: data.name,
    model: {
      provider: 'google',
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      maxTokens: 500,
      systemPrompt: `You are a helpful ${data.agentType} assistant.`,
    },
    voice: {
      provider: '11labs',
      voiceId: data.voiceId,
    },
    transcriber: {
      provider: 'deepgram',
      model: 'nova-2-medical',
      language: 'en',
    },
    metadata: {
      agentType: data.agentType,
      voiceGender: voice?.gender || data.voiceGender,
      callDirection: data.callDirection,
    },
    // Call duration settings
    silenceTimeoutSeconds: 60,      // 60 seconds of silence before ending
    maxDurationSeconds: 3600,       // 1 hour max call duration
    responseDelaySeconds: 0.5,      // Slight delay before responding
    backgroundSound: 'off',
  }

  return vapiRequest<{ id: string }>('/assistant', 'POST', assistant)
}

/**
 * Update an existing assistant
 */
export async function updateAgent(id: string, data: Partial<AgentFormData>): Promise<{ id: string }> {
  const updates: Record<string, unknown> = {
    // Always update call settings to ensure they're current
    silenceTimeoutSeconds: 60,
    maxDurationSeconds: 3600,
    responseDelaySeconds: 0.5,
    backgroundSound: 'off',
  }

  if (data.name) {
    updates.name = data.name
  }

  if (data.voiceId) {
    updates.voice = {
      provider: '11labs',
      voiceId: data.voiceId,
    }
  }

  if (data.agentType || data.voiceGender || data.callDirection) {
    const voice = data.voiceId ? getVoiceById(data.voiceId) : undefined
    updates.metadata = {
      agentType: data.agentType,
      voiceGender: voice?.gender || data.voiceGender,
      callDirection: data.callDirection,
    }
  }

  return vapiRequest<{ id: string }>(`/assistant/${id}`, 'PATCH', updates)
}

/**
 * Delete an assistant
 */
export async function deleteAgent(id: string): Promise<void> {
  await vapiRequest(`/assistant/${id}`, 'DELETE')
}

/**
 * Create a test call to an agent
 */
export async function testAgent(assistantId: string, phoneNumber?: string): Promise<{ id: string }> {
  const callConfig: Record<string, unknown> = {
    assistantId,
    type: phoneNumber ? 'outboundPhoneCall' : 'webCall',
  }

  if (phoneNumber) {
    callConfig.customer = { number: phoneNumber }
  }

  return vapiRequest<{ id: string }>('/call', 'POST', callConfig)
}

/**
 * Get web call URL for testing in browser
 */
export function getWebCallUrl(assistantId: string): string {
  return `https://vapi.ai/call/${assistantId}`
}

// ============================================================================
// SQUAD MANAGEMENT
// ============================================================================

export interface Squad {
  id: string
  name: string
  members: Array<{
    assistantId: string
    assistantDestinations?: Array<{
      type: string
      assistantName: string
      message: string
      description: string
    }>
  }>
}

/**
 * Fetch all squads formatted for UI
 */
export async function getSquads(): Promise<Squad[]> {
  try {
    const squads = await fetchSquads() as Squad[]
    return squads
  } catch (error) {
    console.error('Error fetching squads:', error)
    return []
  }
}

/**
 * Get a single squad by ID
 */
export async function getSquad(squadId: string): Promise<Squad | null> {
  try {
    const squad = await vapiRequest<Squad>(`/squad/${squadId}`)
    return squad
  } catch (error) {
    console.error('Error fetching squad:', error)
    return null
  }
}

/**
 * Add an assistant to a squad
 */
export async function addAgentToSquad(squadId: string, assistantId: string): Promise<void> {
  const squad = await getSquad(squadId)
  if (!squad) {
    throw new Error('Squad not found')
  }

  // Check if already a member
  const existingMember = squad.members.find(m => m.assistantId === assistantId)
  if (existingMember) {
    return // Already in squad
  }

  // Add new member
  const updatedMembers = [
    ...squad.members,
    {
      assistantId,
      assistantDestinations: [],
    }
  ]

  await vapiRequest(`/squad/${squadId}`, 'PATCH', {
    members: updatedMembers,
  })
}

/**
 * Remove an assistant from a squad
 */
export async function removeAgentFromSquad(squadId: string, assistantId: string): Promise<void> {
  const squad = await getSquad(squadId)
  if (!squad) {
    throw new Error('Squad not found')
  }

  // Filter out the member
  const updatedMembers = squad.members.filter(m => m.assistantId !== assistantId)

  await vapiRequest(`/squad/${squadId}`, 'PATCH', {
    members: updatedMembers,
  })
}

/**
 * Update agent's squad membership (handles add/remove)
 */
export async function updateAgentSquad(
  assistantId: string,
  newSquadId: string | null,
  currentSquadId: string | null
): Promise<void> {
  // Remove from current squad if exists
  if (currentSquadId && currentSquadId !== newSquadId) {
    await removeAgentFromSquad(currentSquadId, assistantId)
  }

  // Add to new squad if specified
  if (newSquadId && newSquadId !== currentSquadId) {
    await addAgentToSquad(newSquadId, assistantId)
  }
}
