import type { TranscriptMessage, CallEndedReason } from '@repo/database'
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js'
import { VapiClient, Vapi } from '@vapi-ai/server-sdk'

// Re-export VAPI types for use in other modules
export type VapiCall = Vapi.Call
export type VapiAnalysis = Vapi.Analysis
export type VapiArtifact = Vapi.Artifact

// VAPI client - lazy initialization
let vapiClient: VapiClient | null = null

function getVapiClient(): VapiClient {
  if (!vapiClient) {
    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      throw new Error('VAPI_API_KEY not configured')
    }
    vapiClient = new VapiClient({ token: apiKey })
  }
  return vapiClient
}

// Webhook URL for VAPI to call back (set via env for local/cloud)
const getWebhookBaseUrl = () => process.env.WEBHOOK_BASE_URL || process.env.API_URL || ''

// Validate and format phone number to E.164 format for VAPI
// Returns { valid: true, e164: "+1..." } or { valid: false, error: "..." }
export function validateAndFormatPhone(
  phone: string,
  defaultCountry: 'US' | 'CA' | 'GB' | 'AU' = 'US'
): { valid: true; e164: string } | { valid: false; error: string } {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' }
  }

  // Try to parse the phone number
  const parsed = parsePhoneNumberFromString(phone, defaultCountry)

  if (!parsed) {
    return { valid: false, error: 'Could not parse phone number' }
  }

  if (!parsed.isValid()) {
    return { valid: false, error: `Invalid phone number for ${parsed.country || defaultCountry}` }
  }

  // Return E.164 format (e.g., "+16503035820")
  return { valid: true, e164: parsed.format('E.164') }
}

// Simple check if phone is valid (for quick validation)
export function isPhoneValid(phone: string, defaultCountry: 'US' | 'CA' | 'GB' | 'AU' = 'US'): boolean {
  return isValidPhoneNumber(phone, defaultCountry)
}

// Abusive language patterns
const ABUSIVE_PATTERNS = [
  /\b(fuck|fucking|fucked|fck)\b/i,
  /\b(shit|shitty|bullshit)\b/i,
  /\b(ass|asshole|a\*\*hole)\b/i,
  /\b(bitch|b\*tch)\b/i,
  /\b(damn|dammit)\b/i,
  /\b(crap|crappy)\b/i,
  /\b(stupid|idiot|moron|dumb)\b/i,
  /\b(hate you|go to hell|screw you)\b/i,
  /\b(threat|kill|hurt|sue)\b/i,
]

// Call ended reason descriptions
export function getCallEndedReasonDescription(reason?: CallEndedReason): {
  title: string
  description: string
  canRetry: boolean
  isSuccess: boolean
} {
  switch (reason) {
    case 'assistant-ended-call':
      return {
        title: 'Call Completed',
        description: 'The AI assistant successfully completed the call.',
        canRetry: false,
        isSuccess: true,
      }
    case 'voicemail':
      return {
        title: 'Voicemail Left',
        description: 'A voicemail message was left for the patient.',
        canRetry: true,
        isSuccess: true,
      }
    case 'customer-ended-call':
      return {
        title: 'Patient Ended Call',
        description: 'The patient ended the call.',
        canRetry: true,
        isSuccess: false,
      }
    case 'customer-did-not-answer':
      return {
        title: 'No Answer',
        description: 'The patient did not answer the call.',
        canRetry: true,
        isSuccess: false,
      }
    case 'customer-busy':
      return {
        title: 'Line Busy',
        description: 'The patient\'s line was busy.',
        canRetry: true,
        isSuccess: false,
      }
    case 'manually-canceled':
      return {
        title: 'Call Cancelled',
        description: 'The call was cancelled.',
        canRetry: true,
        isSuccess: false,
      }
    case 'silence-timed-out':
      return {
        title: 'Silence Timeout',
        description: 'The call ended due to silence timeout.',
        canRetry: true,
        isSuccess: false,
      }
    case 'exceeded-max-duration':
      return {
        title: 'Max Duration Exceeded',
        description: 'The call exceeded the maximum duration.',
        canRetry: true,
        isSuccess: false,
      }
    case 'assistant-error':
    case 'assistant-did-not-give-response':
    case 'assistant-request-failed':
    case 'pipeline-error':
      return {
        title: 'Technical Error',
        description: 'A technical error occurred during the call.',
        canRetry: true,
        isSuccess: false,
      }
    default:
      return {
        title: 'Call Ended',
        description: reason || 'The call has ended.',
        canRetry: true,
        isSuccess: false,
      }
  }
}

// Check for abusive language in transcript
export function detectAbusiveLanguage(messages: TranscriptMessage[]): boolean {
  for (const msg of messages) {
    if (msg.speaker === 'patient') {
      for (const pattern of ABUSIVE_PATTERNS) {
        if (pattern.test(msg.text)) {
          return true
        }
      }
    }
  }
  return false
}

// Result type for getCallStatus - matches VAPI SDK Call type but simplified
export interface VapiCallStatus {
  id: string
  status: string
  endedReason?: Vapi.CallEndedReason
  transcript?: string
  recordingUrl?: string
  stereoRecordingUrl?: string
  messages?: Vapi.CallMessagesItem[]
  artifact?: Vapi.Artifact
  analysis?: Vapi.Analysis
  summary?: string
}

// VAPI API calls using official SDK
export const vapiApi = {
  // Start an outbound call
  async startCall(params: {
    assistantId: string
    phoneNumber: string
    customerNumber: string
    assistantOverrides?: Vapi.AssistantOverrides
  }): Promise<{ id: string; status: string } | null> {
    try {
      const client = getVapiClient()

      // Validate and format phone number to E.164
      const phoneResult = validateAndFormatPhone(params.customerNumber)
      if (!phoneResult.valid) {
        console.error('Invalid phone number:', phoneResult.error)
        return null
      }

      // Build assistant overrides with server URL if configured
      let assistantOverrides = params.assistantOverrides
      const webhookBaseUrl = getWebhookBaseUrl()
      if (webhookBaseUrl) {
        assistantOverrides = {
          ...assistantOverrides,
          server: {
            url: `${webhookBaseUrl}/api/calls/webhook`,
          },
        }
      }

      // Build request using SDK types
      const callRequest: Vapi.CreateCallDto = {
        assistantId: params.assistantId,
        phoneNumberId: params.phoneNumber,
        customer: {
          number: phoneResult.e164,
        },
        assistantOverrides,
      }

      const response = await client.calls.create(callRequest)
      // Response can be Call or CallBatchResponse, we expect Call for single call
      const call = response as Vapi.Call
      console.log('[VAPI SDK] Call created:', call.id)

      return { id: call.id, status: call.status || 'queued' }
    } catch (error) {
      console.error('VAPI start call error:', error)
      return null
    }
  },

  // Get call status using SDK
  async getCallStatus(callId: string): Promise<VapiCallStatus | null> {
    try {
      const client = getVapiClient()
      const callData = await client.calls.get({ id: callId })

      // Log raw SDK response for debugging
      console.log('[VAPI SDK] Call data keys:', Object.keys(callData))
      if (callData.analysis) {
        console.log('[VAPI SDK] analysis:', JSON.stringify(callData.analysis))
      }
      if (callData.artifact) {
        console.log('[VAPI SDK] artifact keys:', Object.keys(callData.artifact))
        if (callData.artifact.structuredOutputs) {
          console.log('[VAPI SDK] structuredOutputs:', JSON.stringify(callData.artifact.structuredOutputs))
        }
      }

      // Return call data - SDK types match our interface
      return {
        id: callData.id,
        status: callData.status || 'unknown',
        endedReason: callData.endedReason,
        transcript: callData.artifact?.transcript,
        recordingUrl: callData.artifact?.recordingUrl,
        stereoRecordingUrl: callData.artifact?.stereoRecordingUrl,
        messages: callData.messages,
        artifact: callData.artifact,
        analysis: callData.analysis,
        summary: callData.analysis?.summary,
      }
    } catch (error) {
      console.error('VAPI get call status error:', error)
      return null
    }
  },

  // End a call using SDK
  async endCall(callId: string): Promise<boolean> {
    try {
      const client = getVapiClient()
      await client.calls.delete({ id: callId })
      return true
    } catch (error) {
      console.error('VAPI end call error:', error)
      return false
    }
  },
}

// Parse VAPI messages to TranscriptMessage format
export function parseVapiMessages(vapiData: VapiCallStatus): TranscriptMessage[] {
  // Try different sources for messages - SDK types use Vapi.CallMessagesItem[] and Vapi.ArtifactMessagesItem[]
  const rawMessages = vapiData.messages || vapiData.artifact?.messages || []

  if (rawMessages.length === 0 && vapiData.artifact?.transcript) {
    // Parse from transcript string
    const lines = vapiData.artifact.transcript.split('\n').filter(Boolean)
    return lines.map((line) => {
      const isAI = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('assistant:')
      const text = line.replace(/^(ai|assistant|user|patient|human):\s*/i, '')
      return {
        speaker: isAI ? 'ai' as const : 'patient' as const,
        text,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
    })
  }

  // Extract text from message items - VAPI messages can have different types
  return rawMessages.map((msg) => {
    // Handle different message types from VAPI SDK
    const msgAny = msg as { role?: string; message?: string; time?: number; content?: string }
    const role = msgAny.role || 'user'
    const text = msgAny.message || msgAny.content || ''
    const time = msgAny.time

    return {
      speaker: role === 'assistant' || role === 'bot' ? 'ai' as const : 'patient' as const,
      text,
      time: time
        ? new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }
  })
}

// Determine if call should complete or escalate task
export function shouldCompleteTask(endedReason?: string): boolean {
  const successReasons = [
    'assistant-ended-call',
    'voicemail',
  ]
  return endedReason ? successReasons.includes(endedReason) : false
}
