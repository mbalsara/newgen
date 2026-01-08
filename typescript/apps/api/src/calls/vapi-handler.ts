import type { TranscriptMessage, CallEndedReason } from '@repo/database'
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js'

// VAPI API configuration
const VAPI_API_KEY = process.env.VAPI_API_KEY || ''
const VAPI_BASE_URL = 'https://api.vapi.ai'
// Webhook URL for VAPI to call back (set via env for local/cloud)
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || process.env.API_URL || ''

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

// VAPI API calls
export const vapiApi = {
  // Start an outbound call
  async startCall(params: {
    assistantId: string
    phoneNumber: string
    customerNumber: string
    assistantOverrides?: {
      variableValues?: Record<string, string>
    }
  }): Promise<{ id: string; status: string } | null> {
    if (!VAPI_API_KEY) {
      console.error('VAPI_API_KEY not configured')
      return null
    }

    try {
      // Validate and format phone number to E.164
      const phoneResult = validateAndFormatPhone(params.customerNumber)
      if (!phoneResult.valid) {
        console.error('Invalid phone number:', phoneResult.error)
        return null
      }

      // Build request body
      const requestBody: Record<string, unknown> = {
        assistantId: params.assistantId,
        phoneNumberId: params.phoneNumber, // VAPI phone number ID
        customer: {
          number: phoneResult.e164, // Patient phone number in E.164 format
        },
        assistantOverrides: params.assistantOverrides,
      }

      // Add webhook URL if configured (for receiving call events)
      if (WEBHOOK_BASE_URL) {
        requestBody.serverUrl = `${WEBHOOK_BASE_URL}/api/calls/webhook`
      }

      const response = await fetch(`${VAPI_BASE_URL}/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('VAPI start call failed:', error)
        return null
      }

      return response.json()
    } catch (error) {
      console.error('VAPI start call error:', error)
      return null
    }
  },

  // Get call status
  async getCallStatus(callId: string): Promise<{
    id: string
    status: string
    endedReason?: string
    transcript?: string
    messages?: Array<{
      role: string
      message: string
      time?: number
      endTime?: number
    }>
    artifact?: {
      messages?: Array<{
        role: string
        message: string
        time?: number
        endTime?: number
      }>
      transcript?: string
    }
  } | null> {
    if (!VAPI_API_KEY) {
      console.error('VAPI_API_KEY not configured')
      return null
    }

    try {
      const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('VAPI get call status failed:', error)
        return null
      }

      return response.json()
    } catch (error) {
      console.error('VAPI get call status error:', error)
      return null
    }
  },

  // End a call
  async endCall(callId: string): Promise<boolean> {
    if (!VAPI_API_KEY) {
      console.error('VAPI_API_KEY not configured')
      return false
    }

    try {
      const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      return response.ok
    } catch (error) {
      console.error('VAPI end call error:', error)
      return false
    }
  },
}

// Parse VAPI messages to TranscriptMessage format
export function parseVapiMessages(vapiData: {
  messages?: Array<{ role: string; message: string; time?: number }>
  artifact?: {
    messages?: Array<{ role: string; message: string; time?: number }>
    transcript?: string
  }
  transcript?: string
}): TranscriptMessage[] {
  // Try different sources for messages
  const rawMessages = vapiData.messages || vapiData.artifact?.messages || []

  if (rawMessages.length === 0 && vapiData.artifact?.transcript) {
    // Parse from transcript string
    const lines = vapiData.artifact.transcript.split('\n').filter(Boolean)
    return lines.map((line, idx) => {
      const isAI = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('assistant:')
      const text = line.replace(/^(ai|assistant|user|patient|human):\s*/i, '')
      return {
        speaker: isAI ? 'ai' as const : 'patient' as const,
        text,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      }
    })
  }

  return rawMessages.map((msg) => ({
    speaker: msg.role === 'assistant' || msg.role === 'bot' ? 'ai' as const : 'patient' as const,
    text: msg.message,
    time: msg.time
      ? new Date(msg.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  }))
}

// Determine if call should complete or escalate task
export function shouldCompleteTask(endedReason?: string): boolean {
  const successReasons = [
    'assistant-ended-call',
    'voicemail',
  ]
  return endedReason ? successReasons.includes(endedReason) : false
}
