import type { Agent, AgentObjective, TaskType, AnalysisSchema } from '@repo/database'
import type { TaskWithPatient } from '../tasks/repository'
import { Vapi } from '@vapi-ai/server-sdk'

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

When ending the call:
- Summarize any action items or next steps
- Say a complete goodbye: "Take care, [patient name]. Goodbye!"
- Wait for the patient to say goodbye before ending

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
    // Check specialty filter - cast to check if specialty is in the array
    if (obj.specialties && specialty && !obj.specialties.includes(specialty as typeof obj.specialties[number])) {
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

  // Get patient name - use firstName and lastName from database
  const patientFirstName = task.patient.firstName
  const patientFullName = `${task.patient.firstName} ${task.patient.lastName}`.trim()

  // Build variable values
  const variables: Partial<PromptVariables> = {
    patient_name: patientFullName,
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
// Returns Vapi.AssistantOverrides for type safety with the SDK
export function buildAssistantOverrides(promptConfig: PromptConfig, agent?: Agent): Vapi.AssistantOverrides {
  const overrides: Vapi.AssistantOverrides = {
    firstMessage: promptConfig.firstMessage,
    // Wait for patient to answer before speaking
    firstMessageMode: agent?.waitForGreeting ? 'assistant-waits-for-user' : 'assistant-speaks-first',
    variableValues: promptConfig.variableValues as Record<string, unknown>,
  }

  // Add voice config with stability settings to fix volume/excitement variation
  if (promptConfig.voice.voiceId) {
    // Use ElevenLabs voice configuration
    overrides.voice = {
      provider: '11labs',
      voiceId: promptConfig.voice.voiceId,
      // Fix: Higher stability = more consistent voice, less variation/excitement
      stability: 0.75,
      // Fix: Similarity boost for voice consistency
      similarityBoost: 0.75,
      // Voice speed from agent config
      speed: agent?.voiceSpeed || 1.0,
    } as Vapi.AssistantOverridesVoice
  }

  // Add system prompt as model messages (must include provider and model for VAPI)
  if (promptConfig.systemPrompt) {
    overrides.model = {
      provider: (agent?.modelProvider || 'openai') as 'openai',
      model: agent?.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: promptConfig.systemPrompt,
        },
      ],
    } as Vapi.AssistantOverridesModel
  }

  // Add analysis plan for structured data extraction
  const analysisSchema = agent?.analysisSchema

  const analysisPlan: Vapi.AnalysisPlan = {
    summaryPlan: {
      enabled: true,
    },
    successEvaluationPlan: {
      enabled: true,
      rubric: 'PassFail',
    },
  }

  // Add structured data plan only if agent has a schema configured
  if (analysisSchema) {
    analysisPlan.structuredDataPlan = {
      enabled: true,
      schema: analysisSchema as Vapi.JsonSchema,
    }
  }

  overrides.analysisPlan = analysisPlan

  // Add start speaking plan to reduce response delay
  overrides.startSpeakingPlan = {
    // Wait for silence before starting to speak
    waitSeconds: 0.5,
  }

  // Ensure complete goodbye message when ending call
  overrides.endCallMessage = "Thank you for your time. Take care and have a great day. Goodbye!"

  return overrides
}
