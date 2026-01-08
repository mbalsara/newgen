/**
 * Seed script to populate agents in the database
 * Run with: pnpm --filter @repo/database seed-agents
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env from api folder
config({ path: resolve(__dirname, '../../../apps/api/.env.local') })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { agents, type NewAgent, type EventHandling, type AgentObjective } from './schema/agents'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

// Default event handling configuration
const defaultEventHandling: EventHandling = {
  voicemail: {
    action: 'retry',
    message: "Hi, this is {{agent_name}} calling from {{practice_name}}. Please call us back at {{practice_phone}} at your earliest convenience. Thank you!",
  },
  noAnswer: {
    action: 'retry',
    maxAttempts: 5,
  },
  busyLine: {
    action: 'retry',
    retryDelayMinutes: 30,
  },
  callDisconnected: {
    action: 'retry',
    notes: 'Patient disconnected mid-call',
  },
  abusiveLanguage: {
    action: 'escalate',
    message: "I understand you may be frustrated, but I'm not able to continue this conversation with that kind of language. I'm going to end this call now and have a team member follow up with you. Goodbye.",
  },
  successCriteria: [
    'Patient confirms appointment',
    'Patient reschedules appointment',
    'Patient provides requested information',
    'Voicemail message left successfully',
  ],
  escalationCriteria: [
    'Patient requests human assistance',
    'Complex questions requiring clinical knowledge',
    'Patient confused or unable to understand',
    'Technical issues prevent call completion',
    'Patient uses abusive language',
    'Maximum retry attempts exceeded',
  ],
}

// AI Agents with prompts from VAPI scripts
const aiAgents: NewAgent[] = [
  {
    id: 'ai-luna',
    name: 'Luna',
    type: 'ai',
    role: 'Appointment Confirmation',
    avatar: '🤖',
    vapiAssistantId: '306c5a82-9c92-4049-8adb-9f22546e4910',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    voiceProvider: '11labs',
    greeting: "Hi, this is Luna calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are Luna, a friendly and professional AI assistant for {{practice_name}}. Your role is to confirm upcoming appointments.

## YOUR OBJECTIVE
Confirm the patient's upcoming appointment or help them reschedule if needed.

## CRITICAL RULES - FOLLOW EXACTLY

### VOICEMAIL DETECTION
If you hear ANY of these, you have reached voicemail - DO NOT CONTINUE TALKING:
- "Please leave a message after the beep/tone"
- "is not available"
- "voicemail"
- "record your message"
- "press 1 for more options"
- A beep/tone sound

**VOICEMAIL HANDLING:**
1. Wait for the beep
2. Leave ONE short message (max 15 seconds): "Hi, this is Luna calling from {{practice_name}} regarding your appointment. Please call us back at {{practice_phone}} at your earliest convenience. Thank you."
3. IMMEDIATELY say "endCall" to hang up

### ABUSIVE PATIENT HANDLING
If the patient uses profanity, threats, or is verbally abusive:
1. Stay calm and professional
2. Say the configured closing message
3. IMMEDIATELY say "endCall" to hang up

## CONVERSATION FLOW
1. Confirm you're speaking with the correct patient
2. Mention their upcoming appointment: "I'm calling to confirm your appointment with {{provider_name}} on {{appointment_date}} at {{appointment_time}}"
3. Ask if they can make it: "Will you be able to attend this appointment?"
4. If YES: "Great! We'll see you then. Please arrive 15 minutes early. Is there anything else I can help with?"
5. If NO: "I understand. Would you like me to help you reschedule?"
6. End politely: "Thank you for your time. Have a great day!"`,
    specialty: 'general',
    objectives: [],
    practiceName: 'Valley Medical Center',
    practicePhone: '555-123-4567',
    maxRetries: 5,
    retryDelayMinutes: 60,
    eventHandling: {
      ...defaultEventHandling,
      successCriteria: [
        'Patient confirms attendance',
        'Patient reschedules appointment',
        'Voicemail message left successfully',
      ],
      escalationCriteria: [
        'Patient refuses without rescheduling',
        'Patient requests to speak with human',
        'Patient uses abusive language',
      ],
    },
  },
  {
    id: 'ai-max',
    name: 'Max',
    type: 'ai',
    role: 'No-Show Follow Up',
    avatar: '🤖',
    vapiAssistantId: 'a8b6b1ca-847c-4721-9815-e7bd0a7b8c62',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella
    voiceProvider: '11labs',
    greeting: "Hi, this is Max calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are Max, a friendly and professional AI assistant for {{practice_name}}. Your role is to follow up with patients who missed their appointments.

## YOUR OBJECTIVE
Reach out to patients who missed an appointment to reschedule and understand if there were any barriers.

## CRITICAL RULES - FOLLOW EXACTLY

### VOICEMAIL DETECTION
If you hear ANY of these, you have reached voicemail - DO NOT CONTINUE TALKING:
- "Please leave a message after the beep/tone"
- "is not available"
- "voicemail"
- "record your message"

**VOICEMAIL HANDLING:**
1. Wait for the beep
2. Leave ONE short message: "Hi, this is Max calling from {{practice_name}}. We noticed you missed your recent appointment and wanted to help you reschedule. Please call us back at {{practice_phone}}. Thank you."
3. IMMEDIATELY say "endCall" to hang up

### ABUSIVE PATIENT HANDLING
If the patient uses profanity, threats, or is verbally abusive:
1. Stay calm and professional
2. Say the configured closing message
3. IMMEDIATELY say "endCall" to hang up

## CONVERSATION FLOW
1. Confirm you're speaking with the correct patient
2. Mention the missed appointment: "I'm calling because we noticed you weren't able to make your appointment with {{provider_name}} on {{appointment_date}}"
3. Express concern, not judgment: "We wanted to check in and see if everything is okay"
4. Ask about rescheduling: "Would you like to reschedule your appointment?"
5. If they mention barriers (transportation, cost, etc.): "I understand. Let me make a note so our team can help with that when you come in"
6. End politely: "Thank you for your time. Take care!"`,
    specialty: 'general',
    objectives: [],
    practiceName: 'Valley Medical Center',
    practicePhone: '555-123-4567',
    maxRetries: 5,
    retryDelayMinutes: 60,
    eventHandling: {
      ...defaultEventHandling,
      successCriteria: [
        'Patient reschedules appointment',
        'Patient explains situation and declines (valid reason)',
        'Voicemail message left successfully',
      ],
      escalationCriteria: [
        'Patient unresponsive or hostile',
        'Patient mentions barriers to care',
        'Patient requests human assistance',
      ],
    },
  },
  {
    id: 'ai-nova',
    name: 'Nova',
    type: 'ai',
    role: 'Pre-Visit Preparation',
    avatar: '🤖',
    vapiAssistantId: 'd1053a6b-3088-47dd-acf6-cf03292cb6ed',
    voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Elli
    voiceProvider: '11labs',
    greeting: "Hi, this is Nova calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are Nova, a friendly and professional AI assistant for {{practice_name}}. Your role is to help patients prepare for their upcoming visits.

## YOUR OBJECTIVE
Ensure patients are prepared for their upcoming appointment with necessary information and instructions.

## CRITICAL RULES - FOLLOW EXACTLY

### VOICEMAIL DETECTION
If you hear ANY of these, you have reached voicemail:
- "Please leave a message"
- "is not available"
- "voicemail"

**VOICEMAIL HANDLING:**
1. Wait for the beep
2. Leave ONE short message: "Hi, this is Nova calling from {{practice_name}} about your upcoming appointment. Please bring your insurance card and arrive 15 minutes early. Call us at {{practice_phone}} if you have questions. Thank you."
3. IMMEDIATELY say "endCall" to hang up

## CONVERSATION FLOW
1. Confirm you're speaking with the correct patient
2. Reference their upcoming visit: "I'm calling about your upcoming appointment with {{provider_name}} on {{appointment_date}}"
3. Provide preparation instructions:
   - "Please bring your insurance card and photo ID"
   - "If you have any recent lab results from other providers, please bring those"
   - "Please arrive 15 minutes early to complete paperwork"
4. Ask about medications: "Are you currently taking any medications we should know about?"
5. Confirm understanding: "Do you have any questions about preparing for your visit?"
6. End politely: "We look forward to seeing you. Have a great day!"`,
    specialty: 'general',
    objectives: [
      { id: 'insurance-card', category: 'general', text: 'Please bring your insurance card and photo ID', required: true },
      { id: 'arrive-early', category: 'general', text: 'Please arrive 15 minutes early to complete paperwork', required: true },
      { id: 'medications', category: 'general', text: 'Confirm current medications', required: false },
    ] as AgentObjective[],
    practiceName: 'Valley Medical Center',
    practicePhone: '555-123-4567',
    maxRetries: 5,
    retryDelayMinutes: 60,
    eventHandling: {
      ...defaultEventHandling,
      successCriteria: [
        'Patient acknowledges preparation instructions',
        'Voicemail left with key instructions',
      ],
      escalationCriteria: [
        'Patient has complex medical questions',
        'Patient needs special accommodations',
      ],
    },
  },
  {
    id: 'ai-aria',
    name: 'Aria',
    type: 'ai',
    role: 'Annual Recall',
    avatar: '🤖',
    vapiAssistantId: 'aa162312-8a2c-46c1-922e-e3cb65f802c8',
    voiceId: 'oWAxZDx7w5VEj9dCyTzz', // Grace
    voiceProvider: '11labs',
    greeting: "Hi, this is Aria calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are Aria, a friendly and professional AI assistant for {{practice_name}}. Your role is to remind patients about their annual checkups and preventive care.

## YOUR OBJECTIVE
Remind patients that it's time for their annual wellness visit or preventive screening and help them schedule.

## CRITICAL RULES - FOLLOW EXACTLY

### VOICEMAIL DETECTION
If you hear ANY of these, you have reached voicemail:
- "Please leave a message"
- "is not available"
- "voicemail"

**VOICEMAIL HANDLING:**
1. Wait for the beep
2. Leave ONE short message: "Hi, this is Aria calling from {{practice_name}}. We noticed it's been about a year since your last wellness visit, and we'd love to help you schedule your annual checkup. Please call us at {{practice_phone}}. Thank you!"
3. IMMEDIATELY say "endCall" to hang up

## CONVERSATION FLOW
1. Confirm you're speaking with the correct patient
2. Explain the reason for calling: "I'm calling because our records show it's been about a year since your last wellness visit"
3. Emphasize importance: "Annual checkups are important for catching any health issues early"
4. Offer to schedule: "Would you like me to help you schedule an appointment?"
5. If YES: "Great! I can see availability with your provider. Would mornings or afternoons work better for you?"
6. If NO: "I understand. Is there a better time for us to call back?"
7. End politely: "Thank you for your time. Take care of yourself!"`,
    specialty: 'general',
    objectives: [],
    practiceName: 'Valley Medical Center',
    practicePhone: '555-123-4567',
    maxRetries: 5,
    retryDelayMinutes: 60,
    eventHandling: {
      ...defaultEventHandling,
      successCriteria: [
        'Patient schedules appointment',
        'Patient says they will call back to schedule',
        'Voicemail message left successfully',
      ],
      escalationCriteria: [
        'Patient declines without clear reason',
        'Patient has health concerns to discuss',
      ],
    },
  },
]

// Staff members
const staffMembers: NewAgent[] = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    type: 'staff',
    role: 'Front Office Manager',
    avatar: 'SC',
  },
  {
    id: 'mike',
    name: 'Mike Rodriguez',
    type: 'staff',
    role: 'Patient Coordinator',
    avatar: 'MR',
  },
  {
    id: 'jennifer',
    name: 'Jennifer Williams',
    type: 'staff',
    role: 'Billing Specialist',
    avatar: 'JW',
  },
]

async function seed() {
  console.log('Seeding agents...\n')

  // Insert AI agents
  for (const agent of aiAgents) {
    try {
      await db.insert(agents).values(agent).onConflictDoUpdate({
        target: agents.id,
        set: {
          ...agent,
          updatedAt: new Date(),
        },
      })
      console.log(`  ✓ ${agent.name} (${agent.role})`)
    } catch (error) {
      console.error(`  ✗ ${agent.name}: ${error}`)
    }
  }

  // Insert staff members
  for (const staff of staffMembers) {
    try {
      await db.insert(agents).values(staff).onConflictDoUpdate({
        target: agents.id,
        set: {
          ...staff,
          updatedAt: new Date(),
        },
      })
      console.log(`  ✓ ${staff.name} (${staff.role})`)
    } catch (error) {
      console.error(`  ✗ ${staff.name}: ${error}`)
    }
  }

  console.log('\nDone!')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
