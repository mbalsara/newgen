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

import { db, agents, patients, tasks, flagReasonToIndex } from '@repo/database'
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
  { id: 'PT-2847', name: 'Sarah Johnson', phone: '(555) 123-4567', dob: '03/15/1985' },
  {
    id: 'PT-1923',
    name: 'Michael Chen',
    phone: '(555) 987-6543',
    dob: '07/22/1978',
    flagReasons: [flagReasonToIndex('abusive-language')],
    flaggedBy: 'Max (AI)',
    flaggedAt: new Date(),
  },
  { id: 'PT-3156', name: 'Emily Rodriguez', phone: '(555) 456-7890', dob: '11/08/1992' },
  { id: 'PT-4521', name: 'James Wilson', phone: '(555) 234-5678', dob: '05/30/1965' },
  { id: 'PT-2089', name: 'Patricia Brown', phone: '(555) 345-6789', dob: '09/14/1970' },
  { id: 'PT-3847', name: 'Robert Taylor', phone: '(555) 567-8901', dob: '02/28/1958' },
  { id: 'PT-4123', name: 'Linda Martinez', phone: '(555) 678-9012', dob: '04/12/1982' },
  { id: 'PT-5234', name: 'David Kim', phone: '(555) 789-0123', dob: '08/25/1975' },
  // PFT Follow-up test patient
  { id: 'PT-PFT-001', name: 'Margaret Thompson', phone: '(555) 111-2222', dob: '06/20/1962' },
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
  // PFT Follow-up Test Task (Pulmonology Post-Visit)
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
]

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Clear existing tasks first (they have auto-generated IDs)
    console.log('🗑️  Clearing existing tasks...')
    await db.delete(tasks)
    console.log('   ✓ Tasks cleared')

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
