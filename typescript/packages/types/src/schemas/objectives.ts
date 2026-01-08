import type { AgentObjective, AgentSpecialty } from './agent'
import type { TaskType } from './task'

// Default objectives library - pre-configured objectives for common use cases
export const DEFAULT_OBJECTIVES: Record<string, AgentObjective> = {
  // General objectives
  'appointment-confirm': {
    id: 'appointment-confirm',
    category: 'general',
    text: 'Can you confirm your appointment on {{appointment_date}} at {{appointment_time}}?',
    required: true,
    taskTypes: ['confirmation'],
  },
  'reschedule-offer': {
    id: 'reschedule-offer',
    category: 'general',
    text: 'If you cannot make your appointment, would you like to reschedule?',
    required: false,
    taskTypes: ['confirmation', 'no-show'],
  },

  // Demographics objectives
  'demographics-verification': {
    id: 'demographics-verification',
    category: 'demographics',
    text: 'Since we last spoke, has your home address, phone number, or email changed?',
    required: false,
  },
  'emergency-contact': {
    id: 'emergency-contact',
    category: 'demographics',
    text: 'Can you confirm your emergency contact is still {{emergency_contact_name}}?',
    required: false,
  },

  // Insurance objectives
  'insurance-verification': {
    id: 'insurance-verification',
    category: 'insurance',
    text: 'Are you still using {{insurance_name}}? Also, is Dr. {{pcp_name}} still your primary care provider?',
    required: false,
  },
  'insurance-card-request': {
    id: 'insurance-card-request',
    category: 'insurance',
    text: 'Please remember to bring your insurance card to your appointment.',
    required: false,
  },

  // Pharmacy objectives
  'pharmacy-verification': {
    id: 'pharmacy-verification',
    category: 'pharmacy',
    text: 'We have your preferred pharmacy as {{pharmacy_name}} on {{pharmacy_address}}. Is that still the best place to send your prescriptions?',
    required: false,
  },

  // Financial objectives
  'financial-checkin': {
    id: 'financial-checkin',
    category: 'financial',
    text: 'I see a balance of ${{balance_amount}} on the account and a copay of ${{copay_amount}} for today. Would you like to take care of that now via a secure link?',
    required: false,
    taskTypes: ['pre-visit', 'collections'],
  },
  'payment-reminder': {
    id: 'payment-reminder',
    category: 'financial',
    text: 'Just a reminder that you have an outstanding balance of ${{balance_amount}}. We offer payment plans if needed.',
    required: false,
    taskTypes: ['collections'],
  },

  // Pre-visit objectives
  'pre-visit-fasting': {
    id: 'pre-visit-fasting',
    category: 'pre-visit',
    text: 'Please ensure you are fasting before the visit - no food or drink except water for 12 hours before.',
    required: true,
    taskTypes: ['pre-visit'],
  },
  'pre-visit-transport': {
    id: 'pre-visit-transport',
    category: 'pre-visit',
    text: 'Someone will need to drive you back after the procedure. Do you have transportation arranged?',
    required: true,
    taskTypes: ['pre-visit'],
    specialties: ['surgery', 'gastroenterology', 'ophthalmology'],
  },
  'pre-visit-medications': {
    id: 'pre-visit-medications',
    category: 'pre-visit',
    text: 'Please bring a list of all medications you are currently taking to your appointment.',
    required: false,
    taskTypes: ['pre-visit'],
  },
  'pre-visit-stop-blood-thinners': {
    id: 'pre-visit-stop-blood-thinners',
    category: 'pre-visit',
    text: 'Please stop taking blood thinners {{stop_days}} days before your procedure, as directed by your doctor.',
    required: true,
    taskTypes: ['pre-visit'],
    specialties: ['surgery', 'cardiology', 'gastroenterology'],
  },
}

// Get objectives by category
export function getObjectivesByCategory(category: string): AgentObjective[] {
  return Object.values(DEFAULT_OBJECTIVES).filter((obj) => obj.category === category)
}

// Get objectives applicable to a task type
export function getObjectivesForTaskType(taskType: TaskType): AgentObjective[] {
  return Object.values(DEFAULT_OBJECTIVES).filter(
    (obj) => !obj.taskTypes || obj.taskTypes.includes(taskType)
  )
}

// Get objectives applicable to a specialty
export function getObjectivesForSpecialty(specialty: AgentSpecialty): AgentObjective[] {
  return Object.values(DEFAULT_OBJECTIVES).filter(
    (obj) => !obj.specialties || obj.specialties.includes(specialty)
  )
}

// Filter objectives by task type and specialty
export function filterObjectives(
  objectives: AgentObjective[],
  taskType?: string,
  specialty?: string
): AgentObjective[] {
  return objectives.filter((obj) => {
    // Check task type filter
    if (obj.taskTypes && taskType && !obj.taskTypes.includes(taskType)) {
      return false
    }
    // Check specialty filter
    if (obj.specialties && specialty && !obj.specialties.includes(specialty as AgentSpecialty)) {
      return false
    }
    return true
  })
}

// Default greeting templates by task type
export const GREETING_TEMPLATES: Record<string, string> = {
  confirmation:
    "Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}. I'm calling to confirm your appointment with {{provider_name}} on {{appointment_date}} at {{appointment_time}}.",
  'pre-visit':
    "Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}. I'm calling to help you prepare for your upcoming visit on {{appointment_date}}.",
  'no-show':
    "Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}. We noticed you missed your appointment on {{appointment_date}} and wanted to help you reschedule.",
  recall:
    "Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}. It's been a while since your last visit, and we wanted to check in about scheduling your annual checkup.",
  'post-visit':
    "Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}. I'm calling to check in after your recent visit and see how you're doing.",
  collections:
    "Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}. I'm calling regarding your account balance.",
}

// Template variable definitions for UI autocomplete
export const TEMPLATE_VARIABLES = [
  { name: 'patient_name', description: "Patient's full name" },
  { name: 'patient_first_name', description: "Patient's first name" },
  { name: 'practice_name', description: 'Practice/clinic name' },
  { name: 'practice_phone', description: 'Practice phone number' },
  { name: 'agent_name', description: "AI agent's name" },
  { name: 'appointment_date', description: 'Appointment date (e.g., January 15th)' },
  { name: 'appointment_time', description: 'Appointment time (e.g., 2:30 PM)' },
  { name: 'provider_name', description: "Doctor/provider's name" },
  { name: 'insurance_name', description: "Patient's insurance provider" },
  { name: 'pcp_name', description: 'Primary care provider name' },
  { name: 'pharmacy_name', description: 'Preferred pharmacy name' },
  { name: 'pharmacy_address', description: 'Pharmacy address' },
  { name: 'balance_amount', description: 'Outstanding account balance' },
  { name: 'copay_amount', description: 'Copay amount for visit' },
  { name: 'emergency_contact_name', description: 'Emergency contact name' },
  { name: 'stop_days', description: 'Days to stop medications before procedure' },
]

// Interpolate template variables in a string
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] ?? match
  })
}

// Voicemail message templates
export const VOICEMAIL_TEMPLATES: Record<string, string> = {
  default:
    "Hi, this is {{agent_name}} from {{practice_name}} calling for {{patient_name}}. We're calling about your upcoming appointment. Please call us back at {{practice_phone}}. Thank you!",
  confirmation:
    "Hi, this is {{agent_name}} from {{practice_name}} calling for {{patient_name}}. We're calling to confirm your appointment on {{appointment_date}} at {{appointment_time}}. Please call us back at {{practice_phone}} to confirm. Thank you!",
  'no-show':
    "Hi, this is {{agent_name}} from {{practice_name}} calling for {{patient_name}}. We noticed you missed your appointment and would like to help you reschedule. Please call us back at {{practice_phone}}. Thank you!",
}
