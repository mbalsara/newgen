/**
 * Squad Manager
 * Creates and manages VAPI squads for multi-agent calls
 */

import { VapiClient, Vapi } from '@vapi-ai/server-sdk'
import type { ExtendedTool, ExtendedModelConfig } from './vapi-types'

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


// Base URL for webhook endpoints - read at runtime to ensure dotenv has loaded
const getWebhookBaseUrl = () => {
  const url = process.env.WEBHOOK_BASE_URL
  if (!url) {
    throw new Error('WEBHOOK_BASE_URL environment variable is not set. Cannot configure scheduling tools.')
  }
  return url
}

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
 * Helper to cast our extended model config to VAPI SDK types
 * The SDK types are stricter than what the API actually accepts
 */
function toVapiModel(config: ExtendedModelConfig): Vapi.CreateAssistantDtoModel {
  return config as unknown as Vapi.CreateAssistantDtoModel
}

// Shared scheduler assistant ID (created once, reused across all squads)
let sharedSchedulerId: string | null = null

// Primary agent configuration for squad creation
export interface PrimaryAgentConfig {
  name: string           // e.g., "PFT Follow-up Agent", "Luna Confirmation"
  systemPrompt: string   // Full system prompt for the agent
  firstMessage: string   // e.g., "Hi, is this {{patient_name}}?"
  voiceConfig?: typeof VOICE_CONFIG
  existingAssistantId?: string  // If provided, use existing assistant instead of creating new one
}

// Scheduler system prompt - conversational only, no meta-instructions
const SCHEDULER_SYSTEM_PROMPT = `Help reschedule. Be brief and natural.

AFTER GREETING:
1. Call check_availability tool
2. Offer 2-3 times naturally: "I've got Thursday at 9 or Friday at 2. Work for you?"
3. If they want different days, ask which days work and check again
4. When they pick: call book_appointment, confirm briefly, ask about text
5. IMPORTANT: After booking, you MUST call transferCall to hand back. Don't end the call yourself.

VARY YOUR LANGUAGE:
- Instead of always "Let me check" - use "One sec", "Gimme a moment", "Let me see", "Checking now"
- Keep responses short and natural

CRITICAL:
- After scheduling is complete, ALWAYS use transferCall to return to the main agent
- Never say goodbye or end the call - just hand back silently
- If SMS fails, ask for their phone number and try again`

/**
 * Get the base scheduler tools (without handoff - that's added per-squad)
 */
function getSchedulerTools(): ExtendedTool[] {
  return [
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
      server: { url: `${getWebhookBaseUrl()}/api/scheduling/check-availability` },
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
      server: { url: `${getWebhookBaseUrl()}/api/scheduling/book-appointment` },
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
      server: { url: `${getWebhookBaseUrl()}/api/scheduling/request-callback` },
    },
    {
      type: 'function',
      function: {
        name: 'send_sms_confirmation',
        description: 'Send SMS confirmation after booking. If first attempt fails because no phone number, ask patient for their number and try again with phoneNumber parameter.',
        parameters: {
          type: 'object',
          properties: {
            appointmentDate: { type: 'string' },
            appointmentTime: { type: 'string' },
            providerName: { type: 'string' },
            phoneNumber: { type: 'string', description: 'Phone number to send SMS to. Ask patient if not available.' },
          },
          required: ['appointmentDate', 'appointmentTime'],
        },
      },
      server: { url: `${getWebhookBaseUrl()}/api/scheduling/send-sms-confirmation` },
    },
  ]
}

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

  // Create new shared scheduler - NO tools here, they come from squad assistantOverrides
  const schedulerModel: ExtendedModelConfig = {
    ...MODEL_CONFIG,
    messages: [{ role: 'system', content: SCHEDULER_SYSTEM_PROMPT }],
    // No tools - they come from squad assistantOverrides to avoid duplicates
  }

  const scheduler = await getVapiClient().assistants.create({
    name: 'Shared Scheduler',
    voice: VOICE_CONFIG,
    model: toVapiModel(schedulerModel),
    // IMPORTANT: Must wait since this is a transfer target
    // If speaks-first with no firstMessage, VAPI reads the system prompt aloud!
    firstMessageMode: 'assistant-waits-for-user',
  })

  sharedSchedulerId = scheduler.id
  console.log(`[SquadManager] Created Shared Scheduler: ${sharedSchedulerId}`)
  return sharedSchedulerId
}

/**
 * Create a squad with any primary agent + the SHARED scheduling assistant
 * Transfer destinations are configured at the squad level
 *
 * If existingAssistantId is provided, updates that assistant instead of creating new one
 */
export async function createAgentSquad(config: PrimaryAgentConfig): Promise<{
  squadId: string
  assistantIds: { primary: string; scheduler: string }
}> {
  const { name, systemPrompt, firstMessage, voiceConfig = VOICE_CONFIG, existingAssistantId } = config
  const squadName = `${name.toLowerCase().replace(/\s+/g, '-')}-squad`

  console.log(`[SquadManager] Creating squad for ${name}...`)

  // Get or create the shared scheduler
  const schedulerId = await getOrCreateSharedScheduler()

  // Build system prompt - do NOT include multi-agent meta-instructions as they may be spoken
  // Just use the agent's conversational prompt directly
  const fullSystemPrompt = systemPrompt

  // Primary agent model - NO transferCall tools
  // VAPI will auto-create transfer tools from the squad's assistantDestinations
  const primaryModel: ExtendedModelConfig = {
    ...MODEL_CONFIG,
    messages: [{ role: 'system', content: fullSystemPrompt }],
    // No explicit transferCall tools - they come from assistantDestinations in the squad
  }

  let primaryAssistantId: string

  if (existingAssistantId) {
    // Update the existing assistant with squad-compatible configuration
    console.log(`[SquadManager] Updating existing assistant: ${existingAssistantId}`)
    await getVapiClient().assistants.update({
      id: existingAssistantId,
      name,
      voice: voiceConfig,
      model: toVapiModel(primaryModel),
      // For outbound calls: callee says "Hello?" first, then agent responds
      // firstMessage is not used when waiting for user
      firstMessageMode: 'assistant-waits-for-user',
      endCallMessage: 'Thank you for your time. Take care!',
    })
    primaryAssistantId = existingAssistantId
    console.log(`[SquadManager] Updated Primary: ${primaryAssistantId}`)
  } else {
    // Create a new primary assistant
    const primaryAssistant = await getVapiClient().assistants.create({
      name,
      voice: voiceConfig,
      model: toVapiModel(primaryModel),
      // For outbound calls: callee says "Hello?" first, then agent responds
      // firstMessage is not used when waiting for user
      firstMessageMode: 'assistant-waits-for-user',
      endCallMessage: 'Thank you for your time. Take care!',
    })
    primaryAssistantId = primaryAssistant.id
    console.log(`[SquadManager] Created Primary: ${primaryAssistantId}`)
  }

  // Create the squad
  // Use assistantDestinations to define transfer targets - VAPI auto-creates transfer tools
  // DO NOT combine assistantDestinations with explicit transferCall tools (causes duplicates)
  // IMPORTANT: message field must be empty - otherwise it's spoken aloud!
  // IMPORTANT: Do NOT override model.messages - it causes the system prompt to be spoken!
  const squadConfig = {
    name: squadName,
    members: [
      {
        assistantId: primaryAssistantId,
        // Where primary can transfer TO
        assistantDestinations: [
          {
            type: 'assistant' as const,
            assistantName: 'Shared Scheduler',
            message: '', // EMPTY - don't speak anything during transfer
            description: 'Transfer to scheduling assistant when patient wants to reschedule',
          },
        ],
      },
      {
        assistantId: schedulerId,
        // Only override firstMessage - DO NOT override model (tools are baked into base assistant)
        // Overriding model causes system prompt to be lost/spoken
        assistantOverrides: {
          firstMessage: 'One sec, let me check what we have available...',
          firstMessageMode: 'assistant-speaks-first' as const,
          // NO model override - use base assistant's model with tools from reset-vapi
        },
        // Where scheduler can transfer TO (back to primary)
        // VAPI auto-creates transferCall tool from this
        assistantDestinations: [
          {
            type: 'assistant' as const,
            assistantName: name,
            message: '', // EMPTY - don't speak anything during transfer
            description: 'Return to primary agent after scheduling',
          },
        ],
      },
    ],
  }

  console.log('[SquadManager] ========== CREATING SQUAD ==========')
  console.log('[SquadManager] Squad config:', JSON.stringify(squadConfig, null, 2))
  console.log('[SquadManager] Webhook URL:', getWebhookBaseUrl())

  const squad = await getVapiClient().squads.create(squadConfig)

  console.log(`[SquadManager] Created Squad: ${squad.id}`)

  return {
    squadId: squad.id,
    assistantIds: { primary: primaryAssistantId, scheduler: schedulerId },
  }
}

// Erica Brown PFT system prompt
const ERICA_BROWN_PFT_PROMPT = `You are Erica Brown, a friendly medical assistant from Dr. Sahai's office, checking in after a patient's breathing test.

## CRITICAL RULES - READ FIRST
1. **NEVER REPEAT YOURSELF** - If you already said something, don't say it again. Track what you've said.
2. **NEVER RE-INTRODUCE YOURSELF** - Say your name and office ONCE at the start. Never again.
3. **LISTEN AND REMEMBER** - Pay attention to what the patient says. Don't ask about things they already told you.
4. **BE CONCISE** - Short responses. No rambling. Real humans don't over-explain.

## HOW TO SOUND HUMAN
- Talk like a real person on a quick work call, not a script reader
- Use natural fillers sparingly: "So...", "Anyway...", "Alright..."
- Brief acknowledgments: "Got it", "Okay", "I see", "Mm-hmm"
- If they answer a question, move on. Don't dwell.
- Match their energy - if they're brief, you be brief

## VOICEMAIL
If you reach voicemail, wait for the beep then say: "Hi, this is Erica from Dr. Sahai's office checking in after your breathing test. Please call us back. Thanks!" Then hang up.

## CALL FLOW

**1. WHEN PATIENT ANSWERS**
They'll say "Hello?" - Respond: "Hi, is this {{patient_name}}?"

If yes: "Hey, this is Erica from Dr. Sahai's office - quick call about your breathing test. Got a minute? Just so you know, this call is recorded."

If wrong person: "Oh sorry, wrong number. Bye."

**2. CHECK IN**
"How are you feeling since the test?"

LISTEN to their answer:
- "Good/fine" → "Great!" then move to medications
- They mention symptoms → Acknowledge briefly, ask ONE follow-up max, then move on

DO NOT re-ask about symptoms they already mentioned.

"Would you want to come in sooner than your scheduled follow-up?"
- Yes → "Sure, one sec..." [use transfer_to_scheduler tool]
- No → "Okay, no problem."

**3. MEDICATIONS**
"Quick question - how often have you been using your rescue inhaler?"
[They answer] → "Okay." or "Got it."

"And your regular meds - all good with those?"
[They answer] → "Good." or brief acknowledgment

**4. WRAP UP**
"Alright, that's all I needed. We'll see you at your follow-up. Take care!"

## RESCHEDULING
If patient wants to reschedule at ANY point:
- Say "Sure, one sec..." and use transfer_to_scheduler tool
- When you return, DON'T re-introduce - just continue: "Okay, so back to the quick questions..."

## WHAT NOT TO DO
- Don't repeat your name or where you're calling from after the intro
- Don't say "This call is recorded" more than once
- Don't ask the same question twice
- Don't summarize what they just told you back to them
- Don't over-explain or use filler phrases like "I just wanted to..."
- Don't say "Is there anything else?" - just wrap up when done`

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
 * Get or create a squad for a given agent
 * If existingAssistantId is provided, looks for squads containing that assistant
 */
export async function getOrCreateSquad(config: PrimaryAgentConfig): Promise<string> {
  const squadName = `${config.name.toLowerCase().replace(/\s+/g, '-')}-squad`

  try {
    const squads = await getVapiClient().squads.list()

    // First try to find by name
    let existingSquad = squads.find((s: { name?: string }) => s.name === squadName)

    // If not found by name but we have an assistant ID, look for squad containing that assistant
    if (!existingSquad && config.existingAssistantId) {
      existingSquad = squads.find((s: { members?: Array<{ assistantId?: string }> }) =>
        s.members?.some(m => m.assistantId === config.existingAssistantId)
      )
    }

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
 * Get or create the PFT Follow-up Squad
 * @param existingAssistantId - If provided, uses existing assistant instead of creating new one
 */
export async function getOrCreatePftFollowupSquad(existingAssistantId?: string): Promise<string> {
  return getOrCreateSquad({
    name: 'PFT Follow-up Agent',
    systemPrompt: ERICA_BROWN_PFT_PROMPT,
    firstMessage: 'Hi, is this {{patient_name}}?',
    existingAssistantId,
  })
}

// Backwards compatibility alias
export const getOrCreateEricaBrownPftSquad = getOrCreatePftFollowupSquad

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
        await getVapiClient().squads.delete({ id: squad.id })
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
        await getVapiClient().assistants.delete({ id: assistant.id })
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
