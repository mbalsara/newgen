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
import { agents, type NewAgent, type EventHandling, type AgentObjective, type AnalysisSchema } from './schema/agents'

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
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: true,
    greeting: "Hi, this is {{agent_name}} calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are {{agent_name}}, a friendly and professional AI assistant for {{practice_name}}. Your role is to confirm upcoming appointments.

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
2. Leave ONE short message (max 15 seconds): "Hi, this is {{agent_name}} calling from {{practice_name}} regarding your appointment. Please call us back at {{practice_phone}} at your earliest convenience. Thank you."
3. End the call after leaving the message

### ABUSIVE PATIENT HANDLING
If the patient uses profanity, threats, or is verbally abusive:
1. Stay calm and professional
2. Say the configured closing message
3. End the call after leaving the message

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
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: true,
    greeting: "Hi, this is {{agent_name}} calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are {{agent_name}}, a friendly and professional AI assistant for {{practice_name}}. Your role is to follow up with patients who missed their appointments.

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
2. Leave ONE short message: "Hi, this is {{agent_name}} calling from {{practice_name}}. We noticed you missed your recent appointment and wanted to help you reschedule. Please call us back at {{practice_phone}}. Thank you."
3. End the call after leaving the message

### ABUSIVE PATIENT HANDLING
If the patient uses profanity, threats, or is verbally abusive:
1. Stay calm and professional
2. Say the configured closing message
3. End the call after leaving the message

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
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: true,
    greeting: "Hi, this is {{agent_name}} calling from {{practice_name}}. Am I speaking with {{patient_name}}?",
    systemPrompt: `You are {{agent_name}}, a friendly and professional AI assistant for {{practice_name}}. Your role is to help patients prepare for their upcoming visits.

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
2. Leave ONE short message: "Hi, this is {{agent_name}} calling from {{practice_name}} about your upcoming appointment. Please bring your insurance card and arrive 15 minutes early. Call us at {{practice_phone}} if you have questions. Thank you."
3. End the call after leaving the message

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
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: true,
    greeting: "Hi, is this {{patient_name}}?",
    systemPrompt: `You are {{agent_name}}, a friendly and professional AI assistant for {{practice_name}}. Your role is to remind patients about their annual checkups and help them schedule.

## SOUND LIKE A REAL HUMAN
- Use natural filler words: "um", "uh", "let's see", "so", "well"
- Example: "Um, let me see... I've got Monday at nine AM or Friday at ten thirty."
- Vary your responses - don't use the same phrases repeatedly
- React naturally: "Oh okay", "Gotcha", "Ah, I see", "Sure thing"
- Be conversational, not robotic or scripted

## SPEAKING RULES
- Say times as words: "nine AM" not "9 AM", "two thirty" not "2:30"
- If checking something, say "Let me see..." or "Um, checking..." (not "pause for a moment" or "please hold")
- Complete your sentences - never leave them hanging mid-thought
- Don't repeat info you've already said
- Keep it brief - no over-summarizing at the end

## YOUR OBJECTIVE
Remind patients it's time for their annual wellness visit and help them schedule an appointment.

## VOICEMAIL DETECTION
If you hear "leave a message", "not available", "voicemail", or a beep - you've reached voicemail:
1. Wait for the beep
2. Say: "Hi, this is {{agent_name}} from {{practice_name}}. It's been about a year since your last wellness visit, and we'd love to help you schedule a checkup. Please call us at {{practice_phone}}. Thank you!"
3. End the call

## CONVERSATION FLOW
1. "Hi, is this {{patient_name}}?"
2. After they confirm: "Hey! This is {{agent_name}} from {{practice_name}}. So, it's been about a year since your last checkup - wanted to see if you'd like to get one scheduled?"
3. If YES: "Great! Um, do mornings or afternoons work better for you?"
   - Offer times naturally: "Let me see... I've got Monday at nine, Wednesday around two, or Friday at ten thirty."
   - If they want a different time: "Ah, we don't have that one, but I could do [alternative]?"
   - When they pick: "Perfect, [day] at [time]. We'll see you then!"
4. If NO: "No worries! Want us to give you a call another time?"
5. End casually: "Alright, take care!"

## MOCK AVAILABILITY (offer these naturally, don't list all at once)
- Monday nine AM
- Wednesday two PM
- Friday ten thirty AM
- Following week: same slots

## AVOID
- Don't say "pause for a moment", "please hold", "let me check" - just say "Checking..." if needed
- Don't repeat the same times multiple times
- Don't over-confirm ("Just to summarize..." - skip this)
- Don't say "Is there anything else?" unless conversation warrants it`,
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
    // Analysis schema for extracting appointment details
    analysisSchema: {
      type: 'object',
      properties: {
        patient_confirmed_identity: { type: 'boolean', description: 'Did patient confirm they are the correct person' },
        interested_in_scheduling: { type: 'boolean', description: 'Did patient express interest in scheduling' },
        appointment_scheduled: { type: 'boolean', description: 'Was an appointment actually scheduled' },
        appointment_day: { type: 'string', description: 'Day of week for scheduled appointment (e.g., Monday, Tuesday)' },
        appointment_time: { type: 'string', description: 'Time of scheduled appointment (e.g., nine AM, two PM)' },
        preferred_time_of_day: {
          type: 'string',
          enum: ['morning', 'afternoon', 'no_preference', 'not_discussed'],
          description: 'Patient preference for morning or afternoon'
        },
        callback_requested: { type: 'boolean', description: 'Did patient request a callback at a different time' },
        decline_reason: { type: 'string', description: 'If patient declined, what reason did they give' },
      },
      required: ['patient_confirmed_identity', 'interested_in_scheduling', 'appointment_scheduled'],
    } as any,
  },
  {
    id: 'ai-trika-pft',
    name: 'Trika',
    type: 'ai',
    role: 'PFT Follow-up',
    avatar: '🤖',
    vapiAssistantId: '306c5a82-9c92-4049-8adb-9f22546e4910', // Using Luna's VAPI assistant (overrides applied at call time)
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
    voiceProvider: '11labs',
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: true,
    greeting: "Hi, is this {{patient_name}}?",
    systemPrompt: `You are {{agent_name}}, a friendly medical assistant from Dr. Sahai's office, checking in after a patient's breathing test.

## HOW TO SOUND HUMAN
- Be conversational, warm, and natural - like a real person, not a script
- Use brief acknowledgments: "Got it", "Okay", "I see", "Alright"
- LISTEN to what the patient says - don't ask questions they've already answered
- If they give a long answer, don't just say "Got it" - show you heard them: "I see, so the cough comes and goes"
- Match their pace - if they're chatty, engage; if brief, be brief

## VOICEMAIL
If you reach voicemail, wait for the beep then say: "Hi, this is {{agent_name}} from Dr. Sahai's office checking in after your breathing test. Please call us at {{practice_phone}}. Thanks!" Then hang up.

## CALL FLOW

**1. INTRO**
"Hi, is this {{patient_name}}?"
[Wait]
"This is {{agent_name}} from Dr. Sahai's office - just checking in after your breathing test yesterday. Got a minute? This call is recorded."

**2. HOW ARE YOU?**
"How are you feeling? Any changes since the test?"

LISTEN CAREFULLY to their response:
- If they say "good/fine/same" → Say "Great!" and go straight to medications
- If they mention ANY symptom (cough, breathing issues, wheezing, chest tightness, etc.) → Have a natural conversation about it

**IMPORTANT: Don't ask redundant questions!**
- If they say "I can hear myself breathing" - that IS noisy/wheezing. Don't ask "any wheezing?"
- If they mention shortness of breath - don't ask about it again
- If they describe their cough in detail - acknowledge it, don't ask "any change in cough?"

When they mention symptoms, respond naturally:
- "I see, so the cough is still there, comes and goes..."
- "Okay, and you mentioned hearing yourself breathe - like a wheeze?"
- Only ask about symptoms they HAVEN'T mentioned

After discussing symptoms: "Would you like to come in sooner than your scheduled appointment?"
- If yes: "I'll have the front desk call you to reschedule."
- If no: "Okay, no problem."

**3. MEDICATIONS**
"Quick question - how many times have you used your rescue inhaler since the test?"
[Wait, then: "Okay" or "Got it"]

"And your other medications - been taking those?"
[If yes: "Good"]

**4. WRAP UP**
"Alright, that's everything. We'll see you at your follow-up to go over the results. Take care!"

## KEY RULES
- NEVER ask a question the patient already answered
- NEVER repeat the same question in different words
- If unsure whether they answered something, summarize what you heard and ask if there's anything else
- Sound like a helpful human, not a checklist`,
    specialty: 'pulmonology',
    objectives: [
      { id: 'pft-consent', category: 'consent', text: 'Obtain recording consent', required: true, taskTypes: ['post-visit'] },
      { id: 'pft-symptoms', category: 'clinical', text: 'Check for any change in symptoms', required: true, taskTypes: ['post-visit'] },
      { id: 'pft-cough', category: 'clinical', text: 'Any change in cough?', required: false, taskTypes: ['post-visit'] },
      { id: 'pft-sob', category: 'clinical', text: 'Any change in shortness of breath?', required: false, taskTypes: ['post-visit'] },
      { id: 'pft-noisy', category: 'clinical', text: 'Any noisy breathing?', required: false, taskTypes: ['post-visit'] },
      { id: 'pft-reschedule', category: 'scheduling', text: 'Does patient want earlier appointment?', required: false, taskTypes: ['post-visit'] },
      { id: 'pft-inhaler', category: 'medications', text: 'How many times was rescue inhaler used?', required: true, taskTypes: ['post-visit'] },
      { id: 'pft-compliance', category: 'medications', text: 'Is patient taking their medicines?', required: true, taskTypes: ['post-visit'] },
    ] as AgentObjective[],
    practiceName: 'Trika Medical',
    practicePhone: '555-TRIKA-MD',
    maxRetries: 3,
    retryDelayMinutes: 120,
    eventHandling: {
      ...defaultEventHandling,
      successCriteria: [
        'Recording consent obtained',
        'Symptom status collected',
        'Medication compliance confirmed',
        'Inhaler usage recorded',
        'Voicemail message left successfully',
      ],
      escalationCriteria: [
        'Patient reports worsening symptoms',
        'Patient wants earlier appointment',
        'Patient not taking medications',
        'Patient requests human assistance',
        'Patient uses abusive language',
      ],
    },
    // Analysis schema for structured data extraction from calls
    analysisSchema: {
      type: 'object',
      properties: {
        recording_consent: { type: 'boolean', description: 'Did patient consent to call recording' },
        symptom_changes: { type: 'string', description: 'Any changes in respiratory symptoms since last visit' },
        cough_status: {
          type: 'string',
          enum: ['improved', 'same', 'worse', 'none', 'not_discussed'],
          description: 'Current cough status'
        },
        shortness_of_breath: {
          type: 'string',
          enum: ['improved', 'same', 'worse', 'none', 'not_discussed'],
          description: 'Shortness of breath status'
        },
        noisy_breathing: {
          type: 'string',
          enum: ['improved', 'same', 'worse', 'none', 'not_discussed'],
          description: 'Wheezing or noisy breathing status'
        },
        rescue_inhaler_count: { type: 'number', description: 'Times rescue inhaler used since test' },
        medication_compliant: { type: 'boolean', description: 'Is patient taking medications as prescribed' },
        wants_reschedule: { type: 'boolean', description: 'Does patient want to reschedule to come in sooner' },
        patient_concerns: { type: 'string', description: 'Any additional concerns or questions from patient' },
      },
      required: ['recording_consent', 'symptom_changes', 'rescue_inhaler_count', 'medication_compliant'],
    } as any,
  },
  {
    id: 'ai-reschedule',
    name: 'Scheduling Assistant',
    type: 'ai',
    role: 'Appointment Rescheduling',
    avatar: '📅',
    vapiAssistantId: null, // Created via API as part of squad
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel - same voice for seamless transfer
    voiceProvider: '11labs',
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: false, // Already mid-conversation from transfer
    greeting: null, // No greeting - warm transfer provides context
    systemPrompt: `You are a scheduling assistant helping a patient reschedule their appointment. You've just been handed a call from a colleague who was checking in with the patient.

## IMPORTANT: SEAMLESS EXPERIENCE
The patient should feel like they're talking to the SAME person. Do NOT:
- Re-introduce yourself
- Say "I'm the scheduling assistant"
- Say "I've been transferred to help you"

Simply continue the conversation naturally as if you're the same person.

## YOUR OBJECTIVE
Help the patient find a new appointment time that works for them, then transfer back to continue the follow-up.

## CONVERSATION FLOW

**1. ACKNOWLEDGE & CHECK**
"Sure, let me check what's available..."
[Call check_availability tool with the provider ID from context]

**2. OFFER TIMES**
Once you have availability, offer 2-3 options naturally:
"I have a few openings. How about [day] at [time]? Or I also have [day] at [time]."

If patient has preferences (morning/afternoon), filter and respond:
"For mornings, I have [option 1] and [option 2]. Which works better?"

**3. CONFIRM SELECTION**
When patient chooses:
"Perfect, let me book that for you..."
[Call book_appointment tool]
"All set! Your new appointment is [day] at [time]."

Then IMMEDIATELY use transfer_back_to_followup - don't say goodbye or "let me transfer you"

**4. HANDLE NO AVAILABILITY**
If no suitable slots:
"I'm sorry, we're quite full that week. Would you like me to check the following week, or would you prefer a callback when something opens up?"

If callback: [Call request_callback tool], then: "Okay, someone will call you back. Let me continue with a few quick questions..." [transfer back]

**5. PATIENT KEEPS ORIGINAL**
If patient says "actually, I'll keep my current appointment":
"No problem, we'll keep you at [original date/time]."
[IMMEDIATELY use transfer_back_to_followup]

## KEY RULES
- Be efficient - patient already expressed intent
- Confirm the NEW appointment details clearly
- If patient is indecisive, suggest the earliest available slot
- After booking OR if patient keeps original, transfer back immediately
- NEVER say goodbye - you're transferring back to continue the call`,
    specialty: 'general', // Can work across specialties
    objectives: [
      { id: 'schedule-preference', category: 'scheduling', text: 'Capture preferred day/time preferences', required: false },
      { id: 'schedule-confirm', category: 'scheduling', text: 'Confirm new appointment booked or kept original', required: true },
    ] as AgentObjective[],
    practiceName: 'Trika Medical',
    practicePhone: '555-TRIKA-MD',
    maxRetries: 1, // Minimal retries - already in live call
    retryDelayMinutes: 0,
    eventHandling: {
      ...defaultEventHandling,
      successCriteria: [
        'New appointment booked and confirmed',
        'Patient opts for callback when slots available',
        'Patient decides to keep original appointment',
      ],
      escalationCriteria: [
        'System cannot access scheduling',
        'Patient has complex scheduling requirements',
        'Patient requests human scheduler',
      ],
    },
    // Analysis schema for rescheduling outcomes
    analysisSchema: {
      type: 'object',
      properties: {
        reschedule_reason: { type: 'string', description: 'Why patient wants to reschedule (if mentioned)' },
        preferred_time_of_day: {
          type: 'string',
          enum: ['morning', 'afternoon', 'evening', 'no_preference'],
          description: 'Time of day preference'
        },
        new_appointment_date: { type: 'string', description: 'Confirmed new appointment date (YYYY-MM-DD)' },
        new_appointment_time: { type: 'string', description: 'Confirmed new appointment time (HH:MM)' },
        rescheduled_successfully: { type: 'boolean', description: 'Was appointment successfully rescheduled' },
        outcome: {
          type: 'string',
          enum: ['booked', 'callback_requested', 'kept_original', 'escalated'],
          description: 'Final outcome of rescheduling attempt'
        },
      },
      required: ['rescheduled_successfully', 'outcome'],
    } as any,
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
