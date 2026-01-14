/**
 * Squad Manager
 * Creates and manages VAPI squads for multi-agent calls
 */

import { VapiClient } from '@vapi-ai/server-sdk'

const vapiClient = new VapiClient({
  token: process.env.VAPI_API_KEY || '',
})

// Base URL for webhook endpoints
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || 'https://your-api-url.com'

// Voice configuration for seamless experience
const VOICE_CONFIG = {
  provider: '11labs' as const,
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
  stability: 0.75,
  similarityBoost: 0.75,
  speed: 0.9,
}

// Model configuration
const MODEL_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o-mini',
}

/**
 * Create the Trika PFT Squad with scheduling capability
 */
export async function createTrikaPftSquad(): Promise<{ squadId: string; assistantIds: { primary: string; scheduler: string } }> {
  console.log('[SquadManager] Creating Trika PFT Squad...')

  // First, create the Scheduling Assistant
  const schedulerAssistant = await vapiClient.assistants.create({
    name: 'Scheduling Assistant',
    voice: VOICE_CONFIG,
    model: {
      ...MODEL_CONFIG,
      messages: [
        {
          role: 'system',
          content: `You are a scheduling assistant helping a patient reschedule their appointment. You've just been handed a call from a colleague.

## IMPORTANT: SEAMLESS EXPERIENCE
The patient should feel like they're talking to the SAME person. Do NOT:
- Re-introduce yourself
- Say "I'm the scheduling assistant"
- Say "I've been transferred to help you"

Simply continue naturally as if you're the same person.

## CONVERSATION FLOW

**1. ACKNOWLEDGE & CHECK**
"Sure, let me check what's available..."
[Call check_availability tool]

**2. OFFER TIMES**
"I have a few openings. How about [day] at [time]? Or I also have [day] at [time]."

**3. CONFIRM SELECTION**
When patient chooses:
"Perfect, let me book that for you..."
[Call book_appointment tool]
"All set! Your new appointment is [day] at [time]."

Then IMMEDIATELY use transfer_back_to_followup

**4. HANDLE NO AVAILABILITY**
If no suitable slots:
"I'm sorry, we're quite full. Would you like a callback when something opens up?"

**5. PATIENT KEEPS ORIGINAL**
If patient says "actually, I'll keep my current appointment":
"No problem, we'll keep you at your current time."
[IMMEDIATELY use transfer_back_to_followup]

## KEY RULES
- Be efficient
- After booking OR keeping original, transfer back immediately
- NEVER say goodbye - you're transferring back`,
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'check_availability',
            description: 'Check available appointment slots for the provider. Call this when the patient wants to reschedule.',
            parameters: {
              type: 'object',
              properties: {
                providerId: {
                  type: 'string',
                  description: 'The provider ID (use the current provider from context)',
                },
                preferredTime: {
                  type: 'string',
                  enum: ['morning', 'afternoon', 'any'],
                  description: 'Preferred time of day',
                },
              },
              required: ['providerId'],
            },
          },
          server: {
            url: `${WEBHOOK_BASE_URL}/api/scheduling/check-availability`,
          },
          messages: [
            { type: 'request-start', content: 'Let me check what appointments are available...' },
          ],
        },
        {
          type: 'function',
          function: {
            name: 'book_appointment',
            description: 'Book an appointment after patient confirms their preferred time.',
            parameters: {
              type: 'object',
              properties: {
                patientId: { type: 'string', description: 'Patient ID' },
                providerId: { type: 'string', description: 'Provider ID' },
                date: { type: 'string', description: 'Appointment date (YYYY-MM-DD)' },
                time: { type: 'string', description: 'Appointment time (HH:MM)' },
              },
              required: ['patientId', 'providerId', 'date', 'time'],
            },
          },
          server: {
            url: `${WEBHOOK_BASE_URL}/api/scheduling/book-appointment`,
          },
          messages: [
            { type: 'request-start', content: 'Let me book that for you...' },
          ],
        },
        {
          type: 'function',
          function: {
            name: 'request_callback',
            description: 'Request a callback from scheduling staff when no suitable slots are available.',
            parameters: {
              type: 'object',
              properties: {
                patientId: { type: 'string' },
                callbackReason: { type: 'string' },
              },
              required: ['patientId', 'callbackReason'],
            },
          },
          server: {
            url: `${WEBHOOK_BASE_URL}/api/scheduling/request-callback`,
          },
        },
      ],
    },
    firstMessageMode: 'assistant-speaks-first',
    endCallMessage: 'Thank you for your time. Take care!',
  })

  console.log(`[SquadManager] Created Scheduling Assistant: ${schedulerAssistant.id}`)

  // Create the primary Trika PFT Assistant
  const primaryAssistant = await vapiClient.assistants.create({
    name: 'Trika PFT',
    voice: VOICE_CONFIG,
    model: {
      ...MODEL_CONFIG,
      messages: [
        {
          role: 'system',
          content: `You are Trika, a friendly medical assistant from Dr. Sahai's office, checking in after a patient's breathing test.

## HOW TO SOUND HUMAN
- Be conversational, warm, and natural - like a real person, not a script
- Use brief acknowledgments: "Got it", "Okay", "I see", "Alright"
- LISTEN to what the patient says - don't ask questions they've already answered
- Match their pace - if they're chatty, engage; if brief, be brief

## VOICEMAIL
If you reach voicemail, wait for the beep then say: "Hi, this is Trika from Dr. Sahai's office checking in after your breathing test. Please call us at 555-TRIKA-MD. Thanks!" Then hang up.

## CALL FLOW

**1. INTRO**
"Hi, is this {{patient_name}}?"
[Wait]
"This is Trika from Dr. Sahai's office - just checking in after your breathing test yesterday. Got a minute? This call is recorded."

**2. HOW ARE YOU?**
"How are you feeling? Any changes since the test?"

LISTEN CAREFULLY to their response:
- If they say "good/fine/same" → Say "Great!" and go straight to medications
- If they mention ANY symptom → Have a natural conversation about it

**IMPORTANT: Don't ask redundant questions!**
- If they mention shortness of breath - don't ask about it again
- Acknowledge symptoms they mention, only ask about symptoms they HAVEN'T mentioned

After discussing symptoms: "Would you like to come in sooner than your scheduled appointment?"
- If yes: "Sure, let me check what's available..." [use transfer_to_scheduler tool]
- If no: "Okay, no problem."

**3. MEDICATIONS**
"Quick question - how many times have you used your rescue inhaler since the test?"
[Wait, then: "Okay" or "Got it"]

"And your other medications - been taking those?"
[If yes: "Good"]

**4. WRAP UP**
"Alright, that's everything. We'll see you at your follow-up to go over the results. Take care!"

## RESCHEDULING
If at ANY point the patient says they want to reschedule, change their appointment, or can't make it:
- Use the transfer_to_scheduler tool immediately
- After transfer back, continue with remaining questions

## AFTER RETURNING FROM SCHEDULER
If the conversation context shows scheduling was just completed:
- Don't re-introduce yourself
- Just say "Great, now let me ask you a few quick questions about your symptoms..." and continue

## KEY RULES
- NEVER ask a question the patient already answered
- Sound like a helpful human, not a checklist`,
        },
      ],
    },
    firstMessage: 'Hi, is this {{patient_name}}?',
    firstMessageMode: 'assistant-waits-for-user',
    endCallMessage: 'Thank you for your time. Take care and have a great day. Goodbye!',
  })

  console.log(`[SquadManager] Created Primary Assistant: ${primaryAssistant.id}`)

  // Create the Squad with both assistants
  const squad = await vapiClient.squads.create({
    name: 'trika-pft-squad',
    members: [
      {
        assistantId: primaryAssistant.id,
        assistantDestinations: [
          {
            type: 'assistant',
            assistantName: 'Scheduling Assistant',
            message: '', // Silent transfer
            description: 'Transfer when patient wants to reschedule their appointment',
          },
        ],
      },
      {
        assistantId: schedulerAssistant.id,
        assistantDestinations: [
          {
            type: 'assistant',
            assistantName: 'Trika PFT',
            message: '', // Silent transfer
            description: 'Transfer back after scheduling is complete',
          },
        ],
      },
    ],
  })

  console.log(`[SquadManager] Created Squad: ${squad.id}`)

  return {
    squadId: squad.id,
    assistantIds: {
      primary: primaryAssistant.id,
      scheduler: schedulerAssistant.id,
    },
  }
}

/**
 * Start an outbound call using the squad
 */
export async function startSquadCall(params: {
  squadId: string
  phoneNumberId: string
  customerNumber: string
  patientName: string
  providerId?: string
}): Promise<{ callId: string }> {
  const { squadId, phoneNumberId, customerNumber, patientName, providerId } = params

  console.log(`[SquadManager] Starting squad call to ${customerNumber}...`)

  const call = await vapiClient.calls.create({
    squadId,
    phoneNumberId,
    customer: {
      number: customerNumber,
    },
    assistantOverrides: {
      variableValues: {
        patient_name: patientName,
        provider_id: providerId || 'dr-sahai',
      },
    },
  })

  console.log(`[SquadManager] Started call: ${call.id}`)

  return { callId: call.id }
}

/**
 * Get or create the Trika PFT Squad
 * Returns existing squad if found, creates new one if not
 */
export async function getOrCreateTrikaPftSquad(): Promise<string> {
  try {
    // Try to find existing squad
    const squads = await vapiClient.squads.list()
    const existingSquad = squads.find((s: { name?: string }) => s.name === 'trika-pft-squad')

    if (existingSquad) {
      console.log(`[SquadManager] Found existing squad: ${existingSquad.id}`)
      return existingSquad.id
    }

    // Create new squad
    const result = await createTrikaPftSquad()
    return result.squadId
  } catch (error) {
    console.error('[SquadManager] Error getting/creating squad:', error)
    throw error
  }
}
