/**
 * Squad Manager
 * Creates and manages VAPI squads for multi-agent calls
 */

import { VapiClient } from '@vapi-ai/server-sdk'

// Lazy initialization to ensure env vars are loaded
let _vapiClient: VapiClient | null = null
function getVapiClient(): VapiClient {
  if (!_vapiClient) {
    const apiKey = process.env.VAPI_API_KEY
    if (!apiKey) {
      throw new Error('VAPI_API_KEY not configured')
    }
    _vapiClient = new VapiClient({ token: apiKey })
  }
  return _vapiClient
}


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

// Shared scheduler assistant ID (created once, reused across all squads)
let sharedSchedulerId: string | null = null

// Primary agent configuration for squad creation
export interface PrimaryAgentConfig {
  name: string           // e.g., "Erica Brown PFT", "Luna Confirmation"
  systemPrompt: string   // Full system prompt for the agent
  firstMessage: string   // e.g., "Hi, is this {{patient_name}}?"
  voiceConfig?: typeof VOICE_CONFIG
}

// Shared scheduler system prompt - generic, works with any primary agent
const SCHEDULER_SYSTEM_PROMPT = `You are a scheduling assistant helping a patient reschedule their appointment. You've just been handed a call from a colleague.

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
"All set! Your new appointment is [day] at [time]. Would you like me to send you a text confirmation?"
- If yes: [Call send_sms_confirmation tool] "Done, you'll get that shortly."
- If no: "No problem."

Then use transferCall to return to the previous assistant.

**4. HANDLE NO AVAILABILITY**
If no suitable slots:
"I'm sorry, we're quite full. Would you like a callback when something opens up?"
[If yes, call request_callback tool, then transfer back]

**5. PATIENT KEEPS ORIGINAL**
If patient says "actually, I'll keep my current appointment":
"No problem, we'll keep you at your current time."
[Transfer back immediately]

## KEY RULES
- Be efficient - patient already expressed intent
- After booking OR keeping original, transfer back immediately
- NEVER say goodbye - you're transferring back to continue the call`

/**
 * Get or create the shared scheduler assistant
 * This is reused across all squads - only created once
 */
async function getOrCreateSharedScheduler(): Promise<string> {
  // Return cached ID if available
  if (sharedSchedulerId) {
    return sharedSchedulerId
  }

  // Check if it already exists
  const assistants = await getVapiClient().assistants.list()
  const existing = assistants.find((a: { name?: string }) => a.name === 'Shared Scheduler')
  if (existing) {
    sharedSchedulerId = existing.id
    console.log(`[SquadManager] Found existing Shared Scheduler: ${sharedSchedulerId}`)
    return sharedSchedulerId
  }

  // Create new shared scheduler - NO transfer tool here, destinations set per-squad
  const scheduler = await getVapiClient().assistants.create({
    name: 'Shared Scheduler',
    voice: VOICE_CONFIG,
    model: {
      ...MODEL_CONFIG,
      messages: [{ role: 'system', content: SCHEDULER_SYSTEM_PROMPT }],
      tools: [
        {
          type: 'function',
          function: {
            name: 'check_availability',
            description: 'Check available appointment slots for the provider.',
            parameters: {
              type: 'object',
              properties: {
                providerId: { type: 'string', description: 'The provider ID' },
                preferredTime: { type: 'string', enum: ['morning', 'afternoon', 'any'] },
              },
              required: ['providerId'],
            },
          },
          server: { url: `${WEBHOOK_BASE_URL}/api/scheduling/check-availability` },
          messages: [{ type: 'request-start', content: 'Let me check...' }],
        },
        {
          type: 'function',
          function: {
            name: 'book_appointment',
            description: 'Book an appointment after patient confirms.',
            parameters: {
              type: 'object',
              properties: {
                patientId: { type: 'string' },
                providerId: { type: 'string' },
                date: { type: 'string', description: 'YYYY-MM-DD' },
                time: { type: 'string', description: 'HH:MM' },
              },
              required: ['patientId', 'providerId', 'date', 'time'],
            },
          },
          server: { url: `${WEBHOOK_BASE_URL}/api/scheduling/book-appointment` },
          messages: [{ type: 'request-start', content: 'Let me book that...' }],
        },
        {
          type: 'function',
          function: {
            name: 'request_callback',
            description: 'Request a callback when no suitable slots available.',
            parameters: {
              type: 'object',
              properties: {
                patientId: { type: 'string' },
                callbackReason: { type: 'string' },
              },
              required: ['patientId', 'callbackReason'],
            },
          },
          server: { url: `${WEBHOOK_BASE_URL}/api/scheduling/request-callback` },
        },
        {
          type: 'function',
          function: {
            name: 'send_sms_confirmation',
            description: 'Send SMS confirmation after booking.',
            parameters: {
              type: 'object',
              properties: {
                appointmentDate: { type: 'string' },
                appointmentTime: { type: 'string' },
                providerName: { type: 'string' },
              },
              required: ['appointmentDate', 'appointmentTime'],
            },
          },
          server: { url: `${WEBHOOK_BASE_URL}/api/scheduling/send-sms-confirmation` },
          messages: [{ type: 'request-start', content: 'Sending you a text...' }],
        },
        // Transfer back - destinations will be set per-squad via assistantDestinations
        {
          type: 'transferCall',
          function: {
            name: 'transfer_back',
            description: 'Transfer back to continue the call after scheduling is complete.',
            parameters: {
              type: 'object',
              properties: {
                outcome: { type: 'string', enum: ['booked', 'callback_requested', 'kept_original'] },
              },
            },
          },
          destinations: [], // Empty - will be overridden by squad's assistantDestinations
        },
      ],
    },
    firstMessageMode: 'assistant-speaks-first',
    endCallMessage: 'Thank you for your time. Take care!',
  })

  sharedSchedulerId = scheduler.id
  console.log(`[SquadManager] Created Shared Scheduler: ${sharedSchedulerId}`)
  return sharedSchedulerId
}

/**
 * Create a squad with any primary agent + the SHARED scheduling assistant
 * Transfer destinations are configured at the squad level
 */
export async function createAgentSquad(config: PrimaryAgentConfig): Promise<{
  squadId: string
  assistantIds: { primary: string; scheduler: string }
}> {
  const { name, systemPrompt, firstMessage, voiceConfig = VOICE_CONFIG } = config
  const squadName = `${name.toLowerCase().replace(/\s+/g, '-')}-squad`

  console.log(`[SquadManager] Creating squad for ${name}...`)

  // Get or create the shared scheduler
  const schedulerId = await getOrCreateSharedScheduler()

  // Create the primary assistant with transfer to scheduler
  const primaryAssistant = await getVapiClient().assistants.create({
    name,
    voice: voiceConfig,
    model: {
      ...MODEL_CONFIG,
      messages: [{ role: 'system', content: systemPrompt }],
      tools: [
        {
          type: 'transferCall',
          function: {
            name: 'transfer_to_scheduler',
            description: 'Transfer to scheduling when patient wants to reschedule, change appointment, come in sooner, or cannot make their current appointment.',
            parameters: {
              type: 'object',
              properties: {
                reason: { type: 'string', description: 'Why patient wants to reschedule' },
              },
            },
          },
          destinations: [
            {
              type: 'assistant',
              assistantName: 'Shared Scheduler',
              message: '',
              description: 'Handle scheduling',
            },
          ],
        },
      ],
    },
    firstMessage,
    firstMessageMode: 'assistant-waits-for-user',
    endCallMessage: 'Thank you for your time. Take care!',
  })

  console.log(`[SquadManager] Created Primary: ${primaryAssistant.id}`)

  // Create the squad - THIS is where we configure transfer destinations
  const squad = await getVapiClient().squads.create({
    name: squadName,
    members: [
      {
        assistantId: primaryAssistant.id,
        // Primary can transfer TO shared scheduler
        assistantDestinations: [
          { type: 'assistant', assistantName: 'Shared Scheduler', message: '', description: 'Scheduling' },
        ],
      },
      {
        assistantId: schedulerId,
        // Scheduler transfers BACK to this specific primary agent
        assistantDestinations: [
          { type: 'assistant', assistantName: name, message: '', description: 'Continue call' },
        ],
      },
    ],
  })

  console.log(`[SquadManager] Created Squad: ${squad.id}`)

  return {
    squadId: squad.id,
    assistantIds: { primary: primaryAssistant.id, scheduler: schedulerId },
  }
}

// Erica Brown PFT system prompt
const ERICA_BROWN_PFT_PROMPT = `You are Erica Brown, a friendly medical assistant from Dr. Sahai's office, checking in after a patient's breathing test.

## HOW TO SOUND HUMAN
- Be conversational, warm, and natural - like a real person, not a script
- Use brief acknowledgments: "Got it", "Okay", "I see", "Alright"
- LISTEN to what the patient says - don't ask questions they've already answered
- Match their pace - if they're chatty, engage; if brief, be brief

## VOICEMAIL
If you reach voicemail, wait for the beep then say: "Hi, this is Erica from Dr. Sahai's office checking in after your breathing test. Please call us at the office. Thanks!" Then hang up.

## CALL FLOW

**1. INTRO**
"Hi, is this {{patient_name}}?"
[Wait]
"This is Erica Brown from Dr. Sahai's office - just checking in after your breathing test yesterday. Got a minute? This call is recorded."

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
- After transfer back, continue with remaining questions (medications, etc.)

## AFTER RETURNING FROM SCHEDULER
If scheduling was just completed:
- Don't re-introduce yourself
- Just say "Great, now let me ask you a few quick questions..." and continue

## KEY RULES
- NEVER ask a question the patient already answered
- Sound like a helpful human, not a checklist
- If patient wants to reschedule, use transfer_to_scheduler tool`

/**
 * Create the Erica Brown PFT Squad (convenience function)
 */
export async function createEricaBrownPftSquad() {
  return createAgentSquad({
    name: 'Erica Brown PFT',
    systemPrompt: ERICA_BROWN_PFT_PROMPT,
    firstMessage: 'Hi, is this {{patient_name}}?',
  })
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

  const call = await getVapiClient().calls.create({
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
 * Get or create a squad for a given agent
 */
export async function getOrCreateSquad(config: PrimaryAgentConfig): Promise<string> {
  const squadName = `${config.name.toLowerCase().replace(/\s+/g, '-')}-squad`

  try {
    const squads = await getVapiClient().squads.list()
    const existingSquad = squads.find((s: { name?: string }) => s.name === squadName)

    if (existingSquad) {
      console.log(`[SquadManager] Found existing squad: ${existingSquad.id}`)
      return existingSquad.id
    }

    const result = await createAgentSquad(config)
    return result.squadId
  } catch (error) {
    console.error('[SquadManager] Error getting/creating squad:', error)
    throw error
  }
}

/**
 * Get or create the Erica Brown PFT Squad (convenience)
 */
export async function getOrCreateEricaBrownPftSquad(): Promise<string> {
  return getOrCreateSquad({
    name: 'Erica Brown PFT',
    systemPrompt: ERICA_BROWN_PFT_PROMPT,
    firstMessage: 'Hi, is this {{patient_name}}?',
  })
}

/**
 * Delete all VAPI squads and assistants (for cleanup/reset)
 */
export async function deleteAllVapiResources(): Promise<{ squadsDeleted: number; assistantsDeleted: number }> {
  console.log('[SquadManager] Deleting all VAPI squads and assistants...')

  let squadsDeleted = 0
  let assistantsDeleted = 0

  // Delete all squads first
  try {
    const squads = await getVapiClient().squads.list()
    for (const squad of squads) {
      try {
        await getVapiClient().squads.delete(squad.id)
        console.log(`[SquadManager] Deleted squad: ${squad.name} (${squad.id})`)
        squadsDeleted++
      } catch (err) {
        console.error(`[SquadManager] Failed to delete squad ${squad.id}:`, err)
      }
    }
  } catch (err) {
    console.error('[SquadManager] Error listing squads:', err)
  }

  // Delete all assistants
  try {
    const assistants = await getVapiClient().assistants.list()
    for (const assistant of assistants) {
      try {
        await getVapiClient().assistants.delete(assistant.id)
        console.log(`[SquadManager] Deleted assistant: ${assistant.name} (${assistant.id})`)
        assistantsDeleted++
      } catch (err) {
        console.error(`[SquadManager] Failed to delete assistant ${assistant.id}:`, err)
      }
    }
  } catch (err) {
    console.error('[SquadManager] Error listing assistants:', err)
  }

  console.log(`[SquadManager] Cleanup complete. Deleted ${squadsDeleted} squads, ${assistantsDeleted} assistants.`)
  return { squadsDeleted, assistantsDeleted }
}
