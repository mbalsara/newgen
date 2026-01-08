import type { Task, PatientBehaviorFlag } from './task-types'

// Patient flags (stored by patient ID)
export const patientFlags: Record<string, PatientBehaviorFlag> = {
  'PT-1923': {
    flagged: true,
    reason: 'abusive-language',
    notes: 'Used profanity and raised voice during call about billing dispute.',
    flaggedBy: 'Luna (AI)',
    flaggedAt: 'Jan 7, 9:16 AM',
  },
}

// Check if patient is flagged
export function isPatientFlagged(patientId: string): boolean {
  return !!patientFlags[patientId]?.flagged
}

// Get patient flag
export function getPatientFlag(patientId: string): PatientBehaviorFlag | undefined {
  return patientFlags[patientId]
}

// Mock tasks data - agents mapped to task types:
// ai-luna: Appointment Confirmation
// ai-max: No-Show Follow Up
// ai-nova: Pre-Visit Preparation
// ai-aria: Annual Recall
export const mockTasks: Task[] = [
  {
    id: 1,
    patient: { name: 'Sarah Johnson', phone: '(555) 123-4567', id: 'PT-2847', dob: '03/15/1985' },
    provider: 'Dr. Martinez',
    type: 'confirmation',
    status: 'in-progress',
    assignedAgent: 'ai-luna', // Appointment Confirmation agent
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
        summary:
          'Patient confirmed appointment for Jan 15th at 2:30 PM. Verified insurance is still active with Aetna. Requested reminder call 1 hour before.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello! This is Luna from Dr. Martinez's office. I'm calling to confirm your appointment scheduled for January 15th at 2:30 PM.",
            time: '10:32 AM',
          },
          { speaker: 'patient', text: "Yes, I can make it! I'll be there.", time: '10:32 AM' },
          { speaker: 'ai', text: 'Perfect! Is your insurance still with Aetna?', time: '10:33 AM' },
          {
            speaker: 'patient',
            text: 'Yes, still Aetna. Could I get a reminder call about an hour before?',
            time: '10:33 AM',
          },
          {
            speaker: 'ai',
            text: "Absolutely! You're all set for January 15th at 2:30 PM. Anything else?",
            time: '10:34 AM',
          },
          { speaker: 'patient', text: "No, that's everything. Thank you!", time: '10:34 AM' },
        ],
      },
      {
        id: 'next-1',
        type: 'next-steps',
        timestamp: 'Jan 7, 10:35 AM',
        title: 'Next Steps',
        items: [
          { text: 'Send reminder 1hr before appointment', done: false },
          { text: 'Update insurance verification status', done: false },
        ],
      },
    ],
  },
  {
    id: 2,
    patient: { name: 'Michael Chen', phone: '(555) 987-6543', id: 'PT-1923', dob: '07/22/1978' },
    provider: 'Dr. Patel',
    type: 'no-show',
    status: 'escalated',
    assignedAgent: 'sarah', // Escalated to staff
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
        summary:
          'Patient became agitated when discussing no-show fee. Used inappropriate language. Requested to speak with staff.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello, this is Max from Dr. Patel's office calling about your missed appointment on January 5th.",
            time: '9:15 AM',
          },
          { speaker: 'patient', text: 'What do you want? I already know I missed it.', time: '9:15 AM' },
          {
            speaker: 'ai',
            text: 'I understand. Would you like to reschedule? There may be a no-show fee on your account.',
            time: '9:16 AM',
          },
          {
            speaker: 'patient',
            text: "Are you [expletive] kidding me? That's ridiculous! I want to talk to a real person, not some stupid robot!",
            time: '9:16 AM',
            flagged: true,
          },
        ],
      },
      {
        id: 'flag-2',
        type: 'flag',
        timestamp: 'Jan 7, 9:16 AM',
        title: 'Patient Flagged',
        reason: 'Abusive Language',
        flaggedBy: 'Max (AI)',
        notes: 'Patient used profanity and raised voice during call about billing dispute.',
      },
      {
        id: 'escalated-2',
        type: 'escalated',
        timestamp: 'Jan 7, 9:17 AM',
        title: 'Escalated to Staff',
        assignedTo: 'Sarah M.',
        reason: 'Patient requested human assistance - Note: Patient flagged for abusive language',
      },
      {
        id: 'next-2',
        type: 'next-steps',
        timestamp: 'Jan 7, 9:17 AM',
        title: 'Next Steps',
        items: [
          { text: 'Call patient to discuss rescheduling', done: false },
          { text: 'Review no-show fee policy', done: false },
        ],
      },
    ],
  },
  {
    id: 3,
    patient: { name: 'Emily Rodriguez', phone: '(555) 456-7890', id: 'PT-3156', dob: '11/08/1992' },
    provider: 'Dr. Kim',
    type: 'pre-visit',
    status: 'in-progress',
    assignedAgent: 'ai-nova', // Pre-Visit Preparation agent
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
        id: 'voice-3',
        type: 'voice',
        timestamp: 'Jan 7, 10:30 AM',
        title: 'Voice Call',
        duration: '4:15',
        status: 'completed',
        summary:
          'Pre-visit instructions reviewed. Patient confirmed most requirements but has concerns about transportation.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello Emily! This is Nova from Dr. Kim's office calling about your procedure on January 10th.",
            time: '10:30 AM',
          },
          { speaker: 'patient', text: "Oh yes, hi! I've been preparing for it.", time: '10:30 AM' },
          {
            speaker: 'ai',
            text: "Great! Let me go through the pre-visit checklist with you.",
            time: '10:31 AM',
          },
          { speaker: 'patient', text: 'Sure, go ahead.', time: '10:31 AM' },
        ],
      },
      {
        id: 'objectives-3',
        type: 'objectives',
        timestamp: 'Jan 7, 10:36 AM',
        title: 'Pre-Visit Checklist',
        items: [
          {
            text: 'Confirm fasting requirements (nothing to eat/drink after midnight)',
            status: 'confirmed',
            patientResponse: "Yes, I've already told my family not to tempt me with breakfast!",
          },
          {
            text: 'Stop blood thinners 48 hours before procedure',
            status: 'confirmed',
            patientResponse:
              "Yes, I stopped them yesterday morning, so I'll be at 48 hours by the procedure.",
          },
          {
            text: 'Arrange transportation (no driving after sedation)',
            status: 'needs-attention',
            patientResponse:
              "Um, actually I'm not sure yet. My husband might be working. I might need to take an Uber?",
          },
          {
            text: 'Bring list of current medications',
            status: 'confirmed',
            patientResponse: 'Yes, I have my medication list printed already.',
          },
          {
            text: 'Wear comfortable, loose-fitting clothing',
            status: 'confirmed',
            patientResponse: "I'll wear sweats or something comfy.",
          },
        ],
      },
      {
        id: 'next-3',
        type: 'next-steps',
        timestamp: 'Jan 7, 10:36 AM',
        title: 'Next Steps',
        items: [
          { text: 'Follow up on transportation confirmation', done: false },
          { text: 'Call back tomorrow to verify ride arranged', done: false },
        ],
      },
    ],
  },
  {
    id: 4,
    patient: { name: 'James Wilson', phone: '(555) 234-5678', id: 'PT-4521', dob: '05/30/1965' },
    provider: 'Dr. Lee',
    type: 'no-show',
    status: 'in-progress',
    assignedAgent: 'ai-max', // No-Show Follow Up agent
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
      {
        id: 'voice-4',
        type: 'voice',
        timestamp: 'Jan 7, 8:00 AM',
        title: 'Voice Call',
        duration: '3:12',
        status: 'completed',
        summary: 'Patient apologized for missing appointment. Had a family emergency. Wants to reschedule.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello Mr. Wilson, this is Max from Dr. Lee's office. I'm calling about your missed appointment yesterday.",
            time: '8:00 AM',
          },
          { speaker: 'patient', text: "Oh yes, I'm so sorry about that. I had a family emergency.", time: '8:00 AM' },
          {
            speaker: 'ai',
            text: 'I understand. Would you like to reschedule your appointment?',
            time: '8:01 AM',
          },
          { speaker: 'patient', text: 'Yes please, as soon as possible.', time: '8:01 AM' },
        ],
      },
      {
        id: 'next-4',
        type: 'next-steps',
        timestamp: 'Jan 7, 8:05 AM',
        title: 'Next Steps',
        items: [
          { text: 'Schedule new appointment', done: false },
          { text: 'Waive no-show fee due to emergency', done: false },
        ],
      },
    ],
  },
  {
    id: 5,
    patient: { name: 'Patricia Brown', phone: '(555) 345-6789', id: 'PT-2089', dob: '09/14/1970' },
    provider: 'Dr. Martinez',
    type: 'confirmation',
    status: 'pending',
    assignedAgent: 'ai-luna', // Appointment Confirmation agent
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
      {
        id: 'next-5',
        type: 'next-steps',
        timestamp: '',
        title: 'Next Steps',
        items: [
          { text: 'Call patient to confirm appointment', done: false },
          { text: 'Verify insurance information', done: false },
        ],
      },
    ],
  },
  {
    id: 6,
    patient: { name: 'Robert Taylor', phone: '(555) 567-8901', id: 'PT-3847', dob: '02/28/1958' },
    provider: 'Dr. Patel',
    type: 'recall',
    status: 'in-progress',
    assignedAgent: 'ai-aria', // Annual Recall agent
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
      {
        id: 'voice-6',
        type: 'voice',
        timestamp: 'Jan 7, 5:30 AM',
        title: 'Voice Call',
        duration: '2:15',
        status: 'completed',
        summary: 'Patient interested in scheduling annual checkup. Prefers morning appointments.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello Mr. Taylor, this is Aria from Dr. Patel's office. I'm calling because it's been about a year since your last checkup.",
            time: '5:30 AM',
          },
          { speaker: 'patient', text: "Oh yes, time flies! I should schedule that.", time: '5:30 AM' },
          {
            speaker: 'ai',
            text: "Would you like me to help you schedule your annual wellness visit?",
            time: '5:31 AM',
          },
          { speaker: 'patient', text: "Yes, I prefer mornings if possible.", time: '5:31 AM' },
        ],
      },
      {
        id: 'next-6',
        type: 'next-steps',
        timestamp: 'Jan 7, 5:35 AM',
        title: 'Next Steps',
        items: [
          { text: 'Schedule morning appointment for annual checkup', done: false },
          { text: 'Send appointment confirmation', done: false },
        ],
      },
    ],
  },
  {
    id: 7,
    patient: { name: 'Linda Martinez', phone: '(555) 678-9012', id: 'PT-4123', dob: '04/12/1982' },
    provider: 'Dr. Kim',
    type: 'pre-visit',
    status: 'completed',
    assignedAgent: 'ai-nova', // Pre-Visit Preparation agent
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
        id: 'voice-7',
        type: 'voice',
        timestamp: 'Jan 7, 4:15 AM',
        title: 'Voice Call',
        duration: '3:45',
        status: 'completed',
        summary: 'Pre-visit checklist completed. Patient confirmed all preparations.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello! This is Nova from Dr. Kim's office calling about your appointment tomorrow.",
            time: '4:15 AM',
          },
          { speaker: 'patient', text: "Yes, I'm ready for it.", time: '4:15 AM' },
        ],
      },
      {
        id: 'objectives-7',
        type: 'objectives',
        timestamp: 'Jan 7, 4:20 AM',
        title: 'Pre-Visit Checklist',
        items: [
          {
            text: 'Fasting since midnight',
            status: 'confirmed',
            patientResponse: 'Yes, my last meal was dinner at 7pm yesterday.',
          },
          {
            text: 'Stopped blood pressure medication',
            status: 'confirmed',
            patientResponse: 'Yes, stopped 24 hours ago as instructed.',
          },
          {
            text: 'Transportation arranged',
            status: 'confirmed',
            patientResponse: 'Yes, my husband will drive me.',
          },
          {
            text: 'Bring insurance card',
            status: 'confirmed',
            patientResponse: 'Yes, have it ready in my purse.',
          },
        ],
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
    id: 8,
    patient: { name: 'David Kim', phone: '(555) 789-0123', id: 'PT-5234', dob: '08/25/1975' },
    provider: 'Dr. Lee',
    type: 'recall',
    status: 'completed',
    assignedAgent: 'ai-aria', // Annual Recall agent
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
        id: 'voice-8',
        type: 'voice',
        timestamp: 'Jan 6, 4:00 PM',
        title: 'Voice Call',
        duration: '2:30',
        status: 'completed',
        summary: 'Patient scheduled annual checkup for Feb 10. All set.',
        transcript: [
          {
            speaker: 'ai',
            text: "Hello Mr. Kim, this is Aria calling from Dr. Lee's office. It's time for your annual wellness visit!",
            time: '4:00 PM',
          },
          { speaker: 'patient', text: "Perfect timing, I was just thinking about that.", time: '4:00 PM' },
        ],
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
]
