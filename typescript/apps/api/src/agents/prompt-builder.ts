import type { Agent, AgentObjective, TaskType } from '@repo/database'
import type { TaskWithPatient } from '../tasks/repository'

// Template variables for prompt interpolation
export interface PromptVariables {
  patient_name: string
  patient_first_name: string
  practice_name: string
  practice_phone: string
  agent_name: string
  appointment_date: string
  appointment_time: string
  provider_name: string
  insurance_name: string
  pcp_name: string
  pharmacy_name: string
  pharmacy_address: string
  balance_amount: string
  copay_amount: string
  emergency_contact_name: string
  stop_days: string
}

// Patient context for dynamic variable values
export interface PatientContext {
  appointmentDate?: string
  appointmentTime?: string
  insuranceName?: string
  pcpName?: string
  pharmacyName?: string
  pharmacyAddress?: string
  balanceAmount?: string
  copayAmount?: string
  emergencyContactName?: string
  stopDays?: string
}

// Voice configuration for VAPI
export interface VoiceConfig {
  voiceId?: string | null
  provider: string
}

// Result of building call prompt
export interface PromptConfig {
  voice: VoiceConfig
  firstMessage: string
  systemPrompt: string
  variableValues: Partial<PromptVariables>
}

// Default greeting templates by task type
const GREETING_TEMPLATES: Record<string, string> = {
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

// Base system prompt template
const BASE_SYSTEM_PROMPT = `You are {{agent_name}}, a professional and friendly AI assistant for {{practice_name}}.

Your goal is to help patients with their healthcare needs in a warm, empathetic manner.

Important guidelines:
- Be professional but personable
- Listen carefully to the patient's concerns
- Provide accurate information
- If you're unsure about something, offer to have a staff member follow up
- Keep conversations focused and efficient
- Respect patient privacy and HIPAA guidelines

If you reach voicemail:
1. Leave a brief message: "Hi, this is {{agent_name}} from {{practice_name}} calling for {{patient_name}}. Please call us back at {{practice_phone}}. Thank you!"
2. End the call after leaving the message.`

// Interpolate template variables in a string
function interpolate(
  template: string,
  variables: Partial<PromptVariables>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    const value = variables[varName as keyof PromptVariables]
    return value ?? match
  })
}

// Filter objectives by task type and specialty
function filterObjectives(
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
    if (obj.specialties && specialty && !obj.specialties.includes(specialty)) {
      return false
    }
    return true
  })
}

// Build objectives section of system prompt
function buildObjectivesPrompt(
  objectives: AgentObjective[],
  variables: Partial<PromptVariables>
): string {
  if (objectives.length === 0) return ''

  const lines = ['', 'During this call, please address the following:']

  objectives.forEach((obj, idx) => {
    const interpolatedText = interpolate(obj.text, variables)
    const requiredLabel = obj.required ? ' [REQUIRED]' : ''
    lines.push(`${idx + 1}. ${interpolatedText}${requiredLabel}`)
  })

  lines.push('')
  lines.push('Mark required items as confirmed before ending the call.')

  return lines.join('\n')
}

// Build full system prompt with objectives
function buildSystemPrompt(
  agent: Agent,
  objectives: AgentObjective[],
  variables: Partial<PromptVariables>
): string {
  // Use agent's custom system prompt if provided
  if (agent.systemPrompt) {
    let prompt = interpolate(agent.systemPrompt, variables)
    const objectivesSection = buildObjectivesPrompt(objectives, variables)
    if (objectivesSection) {
      prompt += '\n' + objectivesSection
    }
    return prompt
  }

  // Use base template
  let prompt = interpolate(BASE_SYSTEM_PROMPT, variables)
  const objectivesSection = buildObjectivesPrompt(objectives, variables)
  if (objectivesSection) {
    prompt += '\n' + objectivesSection
  }

  return prompt
}

// Build the call prompt configuration
export function buildCallPrompt(params: {
  agent: Agent
  task: TaskWithPatient
  patientContext?: PatientContext
}): PromptConfig {
  const { agent, task, patientContext } = params

  // Extract first name from patient name
  const patientFirstName = task.patient.name.split(' ')[0]

  // Build variable values
  const variables: Partial<PromptVariables> = {
    patient_name: task.patient.name,
    patient_first_name: patientFirstName,
    practice_name: agent.practiceName || 'our office',
    practice_phone: agent.practicePhone || '',
    agent_name: agent.name,
    appointment_date: patientContext?.appointmentDate || '',
    appointment_time: patientContext?.appointmentTime || '',
    provider_name: task.provider,
    insurance_name: patientContext?.insuranceName || '',
    pcp_name: patientContext?.pcpName || '',
    pharmacy_name: patientContext?.pharmacyName || '',
    pharmacy_address: patientContext?.pharmacyAddress || '',
    balance_amount: patientContext?.balanceAmount || '0',
    copay_amount: patientContext?.copayAmount || '0',
    emergency_contact_name: patientContext?.emergencyContactName || '',
    stop_days: patientContext?.stopDays || '7',
  }

  // Build greeting (first message)
  const greetingTemplate = agent.greeting || GREETING_TEMPLATES[task.type] || GREETING_TEMPLATES.confirmation
  const firstMessage = interpolate(greetingTemplate, variables)

  // Filter and build objectives
  const applicableObjectives = filterObjectives(
    agent.objectives || [],
    task.type,
    agent.specialty || undefined
  )
  const systemPrompt = buildSystemPrompt(agent, applicableObjectives, variables)

  // Voice config
  const voice: VoiceConfig = {
    voiceId: agent.voiceId,
    provider: agent.voiceProvider || '11labs',
  }

  return {
    voice,
    firstMessage,
    systemPrompt,
    variableValues: variables,
  }
}

// Build VAPI assistant overrides from prompt config
export function buildAssistantOverrides(promptConfig: PromptConfig): {
  voice?: { voiceId: string; provider: string }
  firstMessage: string
  model?: {
    messages: Array<{ role: string; content: string }>
  }
  variableValues: Record<string, string>
} {
  const overrides: {
    voice?: { voiceId: string; provider: string }
    firstMessage: string
    model?: {
      messages: Array<{ role: string; content: string }>
    }
    variableValues: Record<string, string>
  } = {
    firstMessage: promptConfig.firstMessage,
    variableValues: promptConfig.variableValues as Record<string, string>,
  }

  // Add voice config if voiceId is set
  if (promptConfig.voice.voiceId) {
    overrides.voice = {
      voiceId: promptConfig.voice.voiceId,
      provider: promptConfig.voice.provider,
    }
  }

  // Add system prompt as model messages
  if (promptConfig.systemPrompt) {
    overrides.model = {
      messages: [
        {
          role: 'system',
          content: promptConfig.systemPrompt,
        },
      ],
    }
  }

  return overrides
}
