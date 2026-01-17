/**
 * Seed script to populate the database with initial data
 * Run with: npx tsx scripts/seed.ts
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load env from api folder
config({ path: resolve(__dirname, '../.env.local') })

import { db, agents, patients, tasks, calls, flagReasonToIndex } from '@repo/database'
import type { NewAgent, NewPatient, NewTask } from '@repo/database'

// AI Agents with their real VAPI assistant IDs
const aiAgents: NewAgent[] = [
  {
    id: 'ai-luna',
    name: 'Luna',
    type: 'ai',
    role: 'Appointment Confirmation',
    avatar: '🤖',
    vapiAssistantId: '306c5a82-9c92-4049-8adb-9f22546e4910',
  },
  {
    id: 'ai-max',
    name: 'Max',
    type: 'ai',
    role: 'No-Show Follow Up',
    avatar: '🤖',
    vapiAssistantId: 'a8b6b1ca-847c-4721-9815-e7bd0a7b8c62',
  },
  {
    id: 'ai-nova',
    name: 'Nova',
    type: 'ai',
    role: 'Pre-Visit Preparation',
    avatar: '🤖',
    vapiAssistantId: 'd1053a6b-3088-47dd-acf6-cf03292cb6ed',
  },
  {
    id: 'ai-aria',
    name: 'Aria',
    type: 'ai',
    role: 'Annual Recall',
    avatar: '🤖',
    vapiAssistantId: 'aa162312-8a2c-46c1-922e-e3cb65f802c8',
  },
  {
    id: 'ai-trika-pft',
    name: 'Trika',
    type: 'ai',
    role: 'PFT Follow-up',
    avatar: '🤖',
    vapiAssistantId: '306c5a82-9c92-4049-8adb-9f22546e4910',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
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
- Sound like a helpful human, not a checklist

When ending the call:
- Summarize any action items or next steps
- Say a complete goodbye: "Take care, [patient name]. Goodbye!"
- Wait for the patient to say goodbye before ending`,
    specialty: 'other',
    practiceName: 'Trika Medical',
    practicePhone: '555-TRIKA-MD',
    maxRetries: 3,
    retryDelayMinutes: 120,
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
    },
  },
  // New PFT agent with squad capability (for rescheduling)
  {
    id: 'ai-trika-pft-squad',
    name: 'Trika (Squad)',
    type: 'ai',
    role: 'PFT Follow-up with Rescheduling',
    avatar: '🤖',
    vapiAssistantId: '306c5a82-9c92-4049-8adb-9f22546e4910',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
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
- The scheduling assistant will handle the rescheduling and transfer back
- After transfer back, continue with remaining questions (medications, etc.)

## KEY RULES
- NEVER ask a question the patient already answered
- Sound like a helpful human, not a checklist
- If patient wants to reschedule, use transfer_to_scheduler tool`,
    specialty: 'other',
    practiceName: 'Trika Medical',
    practicePhone: '555-TRIKA-MD',
    maxRetries: 3,
    retryDelayMinutes: 120,
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
        rescheduled: { type: 'boolean', description: 'Was appointment rescheduled during call' },
        new_appointment_date: { type: 'string', description: 'New appointment date if rescheduled' },
      },
      required: ['recording_consent', 'symptom_changes', 'rescue_inhaler_count', 'medication_compliant'],
    },
  },
  // Scheduling Assistant for squad transfers
  {
    id: 'ai-reschedule',
    name: 'Scheduling Assistant',
    type: 'ai',
    role: 'Appointment Rescheduling',
    avatar: '📅',
    vapiAssistantId: null, // Created via API as part of squad
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Same voice for seamless transfer
    voiceProvider: '11labs',
    voiceSpeed: 0.9,
    model: 'gpt-4o-mini',
    modelProvider: 'openai',
    waitForGreeting: false,
    greeting: null,
    systemPrompt: `You are a scheduling assistant helping a patient reschedule their appointment. You've just been handed a call from a colleague.

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
"No problem, we'll keep you at [original date/time]."
[IMMEDIATELY use transfer_back_to_followup]

## KEY RULES
- Be efficient
- After booking OR keeping original, transfer back immediately
- NEVER say goodbye - you're transferring back`,
    specialty: 'general',
    practiceName: 'Trika Medical',
    practicePhone: '555-TRIKA-MD',
    maxRetries: 1,
    retryDelayMinutes: 0,
    analysisSchema: {
      type: 'object',
      properties: {
        reschedule_reason: { type: 'string', description: 'Why patient wants to reschedule' },
        preferred_time_of_day: {
          type: 'string',
          enum: ['morning', 'afternoon', 'evening', 'no_preference'],
        },
        new_appointment_date: { type: 'string', description: 'New appointment date (YYYY-MM-DD)' },
        new_appointment_time: { type: 'string', description: 'New appointment time (HH:MM)' },
        rescheduled_successfully: { type: 'boolean' },
        outcome: {
          type: 'string',
          enum: ['booked', 'callback_requested', 'kept_original', 'escalated'],
        },
      },
      required: ['rescheduled_successfully', 'outcome'],
    },
  },
]

// Staff members
const staffMembers: NewAgent[] = [
  { id: 'sarah', name: 'Sarah M.', type: 'staff', role: 'Front Office', avatar: 'SM' },
  { id: 'john', name: 'John D.', type: 'staff', role: 'Back Office', avatar: 'JD' },
  { id: 'maria', name: 'Maria G.', type: 'staff', role: 'Billing', avatar: 'MG' },
  { id: 'tom', name: 'Tom R.', type: 'staff', role: 'Front Office', avatar: 'TR' },
  { id: 'lisa', name: 'Lisa K.', type: 'staff', role: 'Scheduling', avatar: 'LK' },
  { id: 'mike', name: 'Mike P.', type: 'staff', role: 'Back Office', avatar: 'MP' },
]

// Sample patients
const samplePatients: NewPatient[] = [
  { id: 'PT-2847', firstName: 'Sarah', lastName: 'Johnson', phone: '+15551234567', dob: '03/15/1985' },
  {
    id: 'PT-1923',
    firstName: 'Michael',
    lastName: 'Chen',
    phone: '+15559876543',
    dob: '07/22/1978',
    flagReasons: [flagReasonToIndex('abusive-language')],
    flaggedBy: 'Max (AI)',
    flaggedAt: new Date(),
  },
  { id: 'PT-3156', firstName: 'Emily', lastName: 'Rodriguez', phone: '+15554567890', dob: '11/08/1992' },
  { id: 'PT-4521', firstName: 'James', lastName: 'Wilson', phone: '+15552345678', dob: '05/30/1965' },
  { id: 'PT-2089', firstName: 'Patricia', lastName: 'Brown', phone: '+15553456789', dob: '09/14/1970' },
  { id: 'PT-3847', firstName: 'Robert', lastName: 'Taylor', phone: '+15555678901', dob: '02/28/1958' },
  { id: 'PT-4123', firstName: 'Linda', lastName: 'Martinez', phone: '+15556789012', dob: '04/12/1982' },
  { id: 'PT-5234', firstName: 'David', lastName: 'Kim', phone: '+15557890123', dob: '08/25/1975' },
  // PFT Follow-up test patient (original agent)
  { id: 'PT-PFT-001', firstName: 'Margaret', lastName: 'Thompson', phone: '+15551112222', dob: '06/20/1962' },
  // PFT Follow-up test patient (squad-enabled agent with rescheduling)
  { id: 'PT-PFT-002', firstName: 'Robert', lastName: 'Jenkins', phone: '+15553334444', dob: '03/10/1955' },
  // Additional patients from mock data
  { id: 'P001', firstName: 'Michael', lastName: 'Chen', phone: '+15551234567', dob: '1985-03-15' },
  { id: 'P002', firstName: 'Jennifer', lastName: 'Martinez', phone: '+15552345678', dob: '1972-07-22' },
  { id: 'P003', firstName: 'Robert', lastName: 'Thompson', phone: '+15553456789', dob: '1968-11-30' },
  { id: 'P004', firstName: 'Emily', lastName: 'Davis', phone: '+15554567890', dob: '1990-05-18' },
  { id: 'P005', firstName: 'David', lastName: 'Wilson', phone: '+15555678901', dob: '1995-09-25' },
  { id: 'P006', firstName: 'Amanda', lastName: 'Rodriguez', phone: '+15556789012', dob: '1988-02-14' },
  { id: 'P007', firstName: 'James', lastName: 'Taylor', phone: '+15557890123', dob: '2008-06-10' },
  { id: 'P008', firstName: 'Patricia', lastName: 'Brown', phone: '+15558901234', dob: '1965-12-05' },
]

// Sample tasks (references patient IDs)
const sampleTasks: NewTask[] = [
  {
    patientId: 'PT-2847',
    provider: 'Dr. Martinez',
    type: 'confirmation',
    status: 'in-progress',
    assignedAgentId: 'ai-luna',
    time: '2m ago',
    unread: true,
    description: 'Appointment confirmation for Jan 15 at 2:30 PM',
    ehrSync: { status: 'synced', lastSync: 'Jan 7, 10:35 AM' },
    timeline: [
      {
        id: 'created-1',
        type: 'created',
        timestamp: 'Jan 7, 10:28 AM',
        title: 'Task Created',
        description: 'Appointment confirmation for Jan 15 at 2:30 PM',
      },
      {
        id: 'voice-1',
        type: 'voice',
        timestamp: 'Jan 7, 10:32 AM',
        title: 'Voice Call',
        duration: '2:34',
        status: 'completed',
        summary: 'Patient confirmed appointment for Jan 15th at 2:30 PM. Verified insurance is still active with Aetna.',
        transcript: [
          { speaker: 'ai', text: "Hello! This is Luna from Dr. Martinez's office. I'm calling to confirm your appointment scheduled for January 15th at 2:30 PM.", time: '10:32 AM' },
          { speaker: 'patient', text: "Yes, I can make it! I'll be there.", time: '10:32 AM' },
        ],
      },
    ],
  },
  {
    patientId: 'PT-1923',
    provider: 'Dr. Patel',
    type: 'no-show',
    status: 'escalated',
    assignedAgentId: 'sarah',
    time: '15m ago',
    unread: true,
    description: 'Patient no-show for appointment on Jan 5',
    ehrSync: { status: 'pending', lastSync: null },
    timeline: [
      {
        id: 'created-2',
        type: 'created',
        timestamp: 'Jan 7, 9:00 AM',
        title: 'Task Created',
        description: 'Patient no-show for appointment on Jan 5',
      },
      {
        id: 'voice-2',
        type: 'voice',
        timestamp: 'Jan 7, 9:15 AM',
        title: 'Voice Call',
        duration: '1:45',
        status: 'escalated',
        summary: 'Patient became agitated when discussing no-show fee. Used inappropriate language.',
        transcript: [
          { speaker: 'ai', text: "Hello, this is Max from Dr. Patel's office calling about your missed appointment.", time: '9:15 AM' },
          { speaker: 'patient', text: 'What do you want? I already know I missed it.', time: '9:15 AM' },
          { speaker: 'patient', text: "Are you kidding me? That's ridiculous! I want to talk to a real person!", time: '9:16 AM', flagged: true },
        ],
      },
      {
        id: 'flag-2',
        type: 'flag',
        timestamp: 'Jan 7, 9:16 AM',
        title: 'Patient Flagged',
        reason: 'Abusive Language',
        flaggedBy: 'Max (AI)',
      },
      {
        id: 'escalated-2',
        type: 'escalated',
        timestamp: 'Jan 7, 9:17 AM',
        title: 'Escalated to Staff',
        assignedTo: 'Sarah M.',
        reason: 'Patient requested human assistance - Note: Patient flagged for abusive language',
      },
    ],
  },
  {
    patientId: 'PT-3156',
    provider: 'Dr. Kim',
    type: 'pre-visit',
    status: 'in-progress',
    assignedAgentId: 'ai-nova',
    time: '1h ago',
    unread: false,
    description: 'Pre-visit call for procedure on Jan 10',
    ehrSync: { status: 'failed', lastSync: 'Jan 7, 11:00 AM', error: 'Connection timeout' },
    timeline: [
      {
        id: 'created-3',
        type: 'created',
        timestamp: 'Jan 7, 8:00 AM',
        title: 'Task Created',
        description: 'Pre-visit call for procedure on Jan 10',
      },
      {
        id: 'objectives-3',
        type: 'objectives',
        timestamp: 'Jan 7, 10:36 AM',
        title: 'Pre-Visit Checklist',
        items: [
          { text: 'Confirm fasting requirements', status: 'confirmed', patientResponse: 'Yes, I understand.' },
          { text: 'Arrange transportation', status: 'needs-attention', patientResponse: "I'm not sure yet." },
        ],
      },
    ],
  },
  {
    patientId: 'PT-4521',
    provider: 'Dr. Lee',
    type: 'no-show',
    status: 'in-progress',
    assignedAgentId: 'ai-max',
    time: '2h ago',
    unread: false,
    description: 'Patient no-show for appointment on Jan 6',
    ehrSync: { status: 'synced', lastSync: 'Jan 7, 8:10 AM' },
    timeline: [
      {
        id: 'created-4',
        type: 'created',
        timestamp: 'Jan 7, 7:45 AM',
        title: 'Task Created',
        description: 'Patient no-show for appointment on Jan 6',
      },
    ],
  },
  {
    patientId: 'PT-2089',
    provider: 'Dr. Martinez',
    type: 'confirmation',
    status: 'pending',
    assignedAgentId: 'ai-luna',
    time: '3h ago',
    unread: false,
    description: 'Appointment confirmation for Jan 12 at 10:00 AM',
    ehrSync: { status: 'pending', lastSync: null },
    timeline: [
      {
        id: 'created-5',
        type: 'created',
        timestamp: 'Jan 7, 6:00 AM',
        title: 'Task Created',
        description: 'Appointment confirmation for Jan 12 at 10:00 AM',
      },
    ],
  },
  {
    patientId: 'PT-3847',
    provider: 'Dr. Patel',
    type: 'recall',
    status: 'in-progress',
    assignedAgentId: 'ai-aria',
    time: '4h ago',
    unread: false,
    description: 'Annual checkup recall - last visit Feb 2024',
    ehrSync: { status: 'synced', lastSync: 'Jan 7, 5:05 AM' },
    timeline: [
      {
        id: 'created-6',
        type: 'created',
        timestamp: 'Jan 7, 5:00 AM',
        title: 'Task Created',
        description: 'Annual checkup recall - last visit Feb 2024',
      },
    ],
  },
  {
    patientId: 'PT-4123',
    provider: 'Dr. Kim',
    type: 'pre-visit',
    status: 'completed',
    assignedAgentId: 'ai-nova',
    time: '5h ago',
    unread: false,
    description: 'Pre-visit call for checkup on Jan 8',
    ehrSync: { status: 'synced', lastSync: 'Jan 7, 4:25 AM' },
    timeline: [
      {
        id: 'created-7',
        type: 'created',
        timestamp: 'Jan 7, 4:00 AM',
        title: 'Task Created',
        description: 'Pre-visit call for checkup on Jan 8',
      },
      {
        id: 'completed-7',
        type: 'completed',
        timestamp: 'Jan 7, 4:20 AM',
        title: 'Task Completed',
        description: 'All pre-visit requirements confirmed.',
      },
    ],
  },
  {
    patientId: 'PT-5234',
    provider: 'Dr. Lee',
    type: 'recall',
    status: 'completed',
    assignedAgentId: 'ai-aria',
    time: '6h ago',
    unread: false,
    description: 'Annual checkup recall - last visit Jan 2024',
    ehrSync: { status: 'synced', lastSync: 'Jan 6, 4:10 PM' },
    timeline: [
      {
        id: 'created-8',
        type: 'created',
        timestamp: 'Jan 6, 3:00 PM',
        title: 'Task Created',
        description: 'Annual checkup recall - last visit Jan 2024',
      },
      {
        id: 'completed-8',
        type: 'completed',
        timestamp: 'Jan 6, 4:05 PM',
        title: 'Task Completed',
        description: 'Annual checkup scheduled for Feb 10.',
      },
    ],
  },
  // PFT Follow-up Test Task (Pulmonology Post-Visit) - Original agent
  {
    patientId: 'PT-PFT-001',
    provider: 'Dr. Sahai',
    type: 'post-visit',
    status: 'pending',
    assignedAgentId: 'ai-trika-pft',
    time: '1h ago',
    unread: true,
    description: 'PFT follow-up call - breathing test completed Jan 12',
    ehrSync: { status: 'pending', lastSync: null },
    timeline: [
      {
        id: 'created-pft-1',
        type: 'created',
        timestamp: 'Jan 13, 9:00 AM',
        title: 'Task Created',
        description: 'PFT follow-up call for Margaret Thompson. Breathing test completed Jan 12. Follow-up appointment scheduled Jan 19.',
      },
    ],
  },
  // PFT Follow-up Test Task (Squad-enabled agent with rescheduling capability)
  {
    patientId: 'PT-PFT-002',
    provider: 'Dr. Sahai',
    type: 'post-visit',
    status: 'pending',
    assignedAgentId: 'ai-trika-pft-squad',
    time: '30m ago',
    unread: true,
    description: 'PFT follow-up call (Squad) - breathing test completed Jan 13',
    ehrSync: { status: 'pending', lastSync: null },
    timeline: [
      {
        id: 'created-pft-2',
        type: 'created',
        timestamp: 'Jan 14, 10:00 AM',
        title: 'Task Created',
        description: 'PFT follow-up call for Robert Jenkins. Breathing test completed Jan 13. Follow-up appointment scheduled Jan 20. This task uses the squad-enabled agent with rescheduling capability.',
      },
    ],
  },
]

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Clear all data in correct order (respecting foreign keys)
    console.log('🗑️  Clearing existing data...')
    await db.delete(calls)
    console.log('   ✓ Calls cleared')
    await db.delete(tasks)
    console.log('   ✓ Tasks cleared')
    await db.delete(patients)
    console.log('   ✓ Patients cleared')
    await db.delete(agents)
    console.log('   ✓ Agents cleared')

    // Seed agents first
    console.log('📝 Seeding agents...')
    const allAgents = [...aiAgents, ...staffMembers]
    await db.insert(agents).values(allAgents).onConflictDoNothing()
    console.log(`   ✓ Seeded ${allAgents.length} agents`)

    // Seed patients
    console.log('📝 Seeding patients...')
    await db.insert(patients).values(samplePatients).onConflictDoNothing()
    console.log(`   ✓ Seeded ${samplePatients.length} patients`)

    // Seed tasks
    console.log('📝 Seeding tasks...')
    await db.insert(tasks).values(sampleTasks).onConflictDoNothing()
    console.log(`   ✓ Seeded ${sampleTasks.length} tasks`)

    console.log('\n✅ Database seeding complete!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }

  process.exit(0)
}

seed()
