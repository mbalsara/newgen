/**
 * Reset VAPI and Database - Full sync
 *
 * This script:
 * 1. Deletes ALL VAPI squads and assistants
 * 2. Creates new VAPI assistants for each AI agent
 * 3. Updates the database with new VAPI assistant IDs
 * 4. Creates squads for agents that need multi-agent handoffs
 *
 * Run with: pnpm --filter @repo/api reset-vapi
 */

import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { VapiClient, Vapi } from '@vapi-ai/server-sdk'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import postgres from 'postgres'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local from api directory
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Initialize VAPI client
const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY! })

// Initialize database
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}
const client = postgres(connectionString)
const db = drizzle(client)

// Import schema - need to define inline since we can't easily import from @repo/database
const { pgTable, text, boolean, jsonb, timestamp, real, integer } = await import('drizzle-orm/pg-core')

const agents = pgTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  role: text('role'),
  avatar: text('avatar'),
  vapiAssistantId: text('vapi_assistant_id'),
  voiceId: text('voice_id'),
  voiceProvider: text('voice_provider'),
  voiceSpeed: real('voice_speed'),
  model: text('model'),
  modelProvider: text('model_provider'),
  waitForGreeting: boolean('wait_for_greeting'),
  greeting: text('greeting'),
  systemPrompt: text('system_prompt'),
  specialty: text('specialty'),
  objectives: jsonb('objectives'),
  practiceName: text('practice_name'),
  practicePhone: text('practice_phone'),
  maxRetries: integer('max_retries'),
  retryDelayMinutes: integer('retry_delay_minutes'),
  eventHandling: jsonb('event_handling'),
  fallbackStaffId: text('fallback_staff_id'),
  fallbackStaffIds: jsonb('fallback_staff_ids'),
  analysisSchema: jsonb('analysis_schema'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// Webhook base URL - fail if not set
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL
if (!WEBHOOK_BASE_URL) {
  console.error('WEBHOOK_BASE_URL environment variable is not set')
  process.exit(1)
}

// Voice configuration
const VOICE_CONFIG = {
  provider: '11labs' as const,
  voiceId: '21m00Tcm4TlvDq8ikWAM',
  stability: 0.75,
  similarityBoost: 0.75,
  speed: 0.9,
}

// Model configuration
const MODEL_CONFIG = {
  provider: 'openai' as const,
  model: 'gpt-4o-mini',
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

// Agents that need squads - NOTE: Squads are created at runtime by squad-manager
// This script only creates standalone assistants
const SQUAD_AGENTS: string[] = []

/**
 * Delete all VAPI resources
 */
async function deleteAllVapiResources(): Promise<{ squadsDeleted: number; assistantsDeleted: number }> {
  console.log('\n[Step 1] Deleting all VAPI resources...\n')

  let squadsDeleted = 0
  let assistantsDeleted = 0

  // Delete all squads first
  try {
    const squads = await vapiClient.squads.list()
    for (const squad of squads) {
      try {
        await vapiClient.squads.delete({ id: squad.id })
        console.log(`  ✓ Deleted squad: ${squad.name}`)
        squadsDeleted++
      } catch (err) {
        console.log(`  ✗ Failed to delete squad: ${squad.name}`)
      }
    }
  } catch (err) {
    console.error('  Error listing squads:', err)
  }

  // Delete all assistants
  try {
    const assistants = await vapiClient.assistants.list()
    for (const assistant of assistants) {
      try {
        await vapiClient.assistants.delete({ id: assistant.id })
        console.log(`  ✓ Deleted assistant: ${assistant.name}`)
        assistantsDeleted++
      } catch (err) {
        console.log(`  ✗ Failed to delete assistant: ${assistant.name}`)
      }
    }
  } catch (err) {
    console.error('  Error listing assistants:', err)
  }

  console.log(`\n  Total: ${squadsDeleted} squads, ${assistantsDeleted} assistants deleted\n`)
  return { squadsDeleted, assistantsDeleted }
}

/**
 * Get scheduler tools for squad overrides
 */
function getSchedulerTools() {
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
      server: { url: `${WEBHOOK_BASE_URL}/api/scheduling/check-availability` },
      // No messages - let the LLM vary its language naturally
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
      // No messages - let the LLM vary its language naturally
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
      server: { url: `${WEBHOOK_BASE_URL}/api/scheduling/send-sms-confirmation` },
      // No messages - let the LLM vary its language naturally
    },
  ]
}

/**
 * Create a VAPI assistant for an agent
 */
async function createVapiAssistant(agent: typeof agents.$inferSelect): Promise<string | null> {
  if (agent.type !== 'ai' || !agent.systemPrompt) {
    return null
  }

  // Skip scheduling assistant - it's created as part of squads
  if (agent.id === 'ai-reschedule') {
    return null
  }

  const needsSquad = SQUAD_AGENTS.includes(agent.id)

  // Use agent's system prompt directly - no meta-instructions that could be spoken
  const systemPrompt = agent.systemPrompt

  // Build tools - add handoff for squad agents
  const tools = needsSquad ? [
    {
      type: 'transferCall',
      function: {
        name: 'handoff_to_scheduler',
        description: 'Hand off to the scheduling assistant when patient wants to reschedule, change their appointment, come in sooner, or cannot make their current appointment.',
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Brief reason for rescheduling',
            },
          },
        },
      },
      destinations: [
        {
          type: 'assistant',
          assistantName: 'Shared Scheduler',
          message: '',
          description: 'Handle scheduling requests',
        },
      ],
    },
  ] : undefined

  try {
    const assistant = await vapiClient.assistants.create({
      name: agent.name,
      voice: {
        provider: (agent.voiceProvider as '11labs') || '11labs',
        voiceId: agent.voiceId || '21m00Tcm4TlvDq8ikWAM',
        stability: 0.75,
        similarityBoost: 0.75,
        speed: agent.voiceSpeed || 0.9,
      },
      model: {
        provider: (agent.modelProvider as 'openai') || 'openai',
        model: agent.model || 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }],
        tools,
      } as unknown as Vapi.CreateAssistantDtoModel,
      firstMessage: agent.greeting || undefined,
      firstMessageMode: agent.waitForGreeting ? 'assistant-waits-for-user' : 'assistant-speaks-first',
      endCallMessage: 'Thank you for your time. Take care!',
      analysisPlan: agent.analysisSchema ? {
        structuredDataSchema: agent.analysisSchema as Vapi.JsonSchema,
      } : undefined,
    })

    return assistant.id
  } catch (error) {
    console.error(`  ✗ Failed to create assistant for ${agent.name}:`, error)
    return null
  }
}

/**
 * Create the shared scheduler assistant
 * Everything baked in - no overrides needed in squad
 */
async function createSharedScheduler(): Promise<string> {
  const scheduler = await vapiClient.assistants.create({
    name: 'Shared Scheduler',
    voice: VOICE_CONFIG,
    model: {
      ...MODEL_CONFIG,
      messages: [{ role: 'system', content: SCHEDULER_SYSTEM_PROMPT }],
      tools: getSchedulerTools(),
    } as unknown as Vapi.CreateAssistantDtoModel,
    // Speak immediately after transfer - don't wait
    firstMessage: 'Sure, let me check what we have available.',
    firstMessageMode: 'assistant-speaks-first',
  })

  console.log(`  ✓ Created Shared Scheduler: ${scheduler.id}`)
  return scheduler.id
}

/**
 * Create a squad for an agent
 */
async function createSquad(
  agent: typeof agents.$inferSelect,
  primaryAssistantId: string,
  schedulerId: string
): Promise<string> {
  const squadName = `${agent.name.toLowerCase().replace(/\s+/g, '-')}-squad`

  // Build scheduler tools WITH handoff to this agent
  const schedulerToolsWithHandoff = [
    ...getSchedulerTools(),
    {
      type: 'transferCall',
      function: {
        name: 'handoff_to_primary',
        description: 'Hand off back to the primary agent to continue the call after scheduling is complete.',
        parameters: {
          type: 'object',
          properties: {
            outcome: {
              type: 'string',
              enum: ['booked', 'callback_requested', 'kept_original'],
            },
            summary: { type: 'string' },
          },
          required: ['outcome'],
        },
      },
      destinations: [
        {
          type: 'assistant',
          assistantName: agent.name,
          message: '',
          description: 'Return to primary agent',
        },
      ],
    },
  ]

  const squad = await vapiClient.squads.create({
    name: squadName,
    members: [
      {
        assistantId: primaryAssistantId,
        assistantDestinations: [
          { type: 'assistant', assistantName: 'Shared Scheduler', message: '', description: 'Scheduling' },
        ],
      },
      {
        assistantId: schedulerId,
        assistantOverrides: {
          model: {
            ...MODEL_CONFIG,
            messages: [{ role: 'system', content: SCHEDULER_SYSTEM_PROMPT }],
            tools: schedulerToolsWithHandoff,
          } as unknown as Vapi.AssistantOverridesModel,
        },
        assistantDestinations: [
          { type: 'assistant', assistantName: agent.name, message: '', description: 'Return to primary' },
        ],
      },
    ],
  })

  console.log(`  ✓ Created squad: ${squadName} (${squad.id})`)
  return squad.id
}

/**
 * Main function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║           VAPI + Database Full Reset                        ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`\nWebhook URL: ${WEBHOOK_BASE_URL}`)

  // Step 1: Delete all VAPI resources
  await deleteAllVapiResources()

  // Step 2: Get all AI agents from database
  console.log('[Step 2] Loading agents from database...\n')
  const allAgents = await db.select().from(agents).where(eq(agents.type, 'ai'))
  console.log(`  Found ${allAgents.length} AI agents\n`)

  // Step 3: Create Shared Scheduler first (needed for squads)
  console.log('[Step 3] Creating Shared Scheduler...\n')
  const schedulerId = await createSharedScheduler()

  // Step 4: Create VAPI assistants for each agent and update database
  console.log('\n[Step 4] Creating VAPI assistants and updating database...\n')

  for (const agent of allAgents) {
    const assistantId = await createVapiAssistant(agent)

    if (assistantId) {
      // Update database with new assistant ID
      await db.update(agents)
        .set({ vapiAssistantId: assistantId, updatedAt: new Date() })
        .where(eq(agents.id, agent.id))

      console.log(`  ✓ ${agent.name}: ${assistantId}`)

      // Create squad if needed
      if (SQUAD_AGENTS.includes(agent.id)) {
        console.log(`    Creating squad for ${agent.name}...`)
        await createSquad(agent, assistantId, schedulerId)
      }
    } else if (agent.id === 'ai-reschedule') {
      // Update scheduling assistant with shared scheduler ID
      await db.update(agents)
        .set({ vapiAssistantId: schedulerId, updatedAt: new Date() })
        .where(eq(agents.id, agent.id))
      console.log(`  ✓ ${agent.name}: ${schedulerId} (shared scheduler)`)
    } else {
      console.log(`  - ${agent.name}: skipped (no system prompt)`)
    }
  }

  // Step 5: Verify webhook endpoints are reachable
  console.log('\n[Step 5] Verifying webhook endpoints...\n')

  try {
    const healthUrl = `${WEBHOOK_BASE_URL}/api/scheduling/health`
    console.log(`  Checking: ${healthUrl}`)

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`  ✓ API is reachable`)
      console.log(`  ✓ Webhook URL: ${data.webhookBaseUrl}`)

      // Test one of the scheduling endpoints with a mock request
      const testUrl = `${WEBHOOK_BASE_URL}/api/scheduling/check-availability`
      console.log(`  Testing: ${testUrl}`)

      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            toolCallList: [{
              id: 'test-call-id',
              name: 'check_availability',
              arguments: { providerId: 'test' }
            }]
          }
        })
      })

      if (testResponse.ok) {
        const testData = await testResponse.json()
        if (testData.results && testData.results[0]?.toolCallId === 'test-call-id') {
          console.log(`  ✓ check-availability endpoint working correctly`)
        } else {
          console.log(`  ⚠ check-availability responded but format may be incorrect`)
          console.log(`    Response:`, JSON.stringify(testData).substring(0, 200))
        }
      } else {
        console.log(`  ✗ check-availability returned ${testResponse.status}`)
      }
    } else {
      console.log(`  ✗ API health check failed: ${response.status}`)
      console.log(`  Make sure the API server is running!`)
    }
  } catch (error) {
    console.log(`  ✗ Could not reach API: ${error}`)
    console.log(`  Make sure the API server is running and WEBHOOK_BASE_URL is correct!`)
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║                    Reset Complete!                          ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  // Close database connection
  await client.end()
}

main().catch((error) => {
  console.error('Reset failed:', error)
  process.exit(1)
})
