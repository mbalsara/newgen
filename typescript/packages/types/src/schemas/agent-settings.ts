import { z } from 'zod'
import { AgentQuestionSchema, type AgentQuestion } from './question-bank'

// Agent status
export const AgentStatusSchema = z.enum(['draft', 'active', 'paused'])
export type AgentStatus = z.infer<typeof AgentStatusSchema>

// Time unit for delays
export const TimeUnitSchema = z.enum(['hours', 'days'])
export type TimeUnit = z.infer<typeof TimeUnitSchema>

// Time between attempts
export const TimeBetweenAttemptsSchema = z.object({
  value: z.number().min(1).max(72),
  unit: TimeUnitSchema,
})
export type TimeBetweenAttempts = z.infer<typeof TimeBetweenAttemptsSchema>

// Allowed calling hour slot
export const CallingHourSlotSchema = z.object({
  hour: z.number().min(0).max(23),
  enabled: z.boolean(),
})
export type CallingHourSlot = z.infer<typeof CallingHourSlotSchema>

// After all attempts fail action
export const AfterFailActionSchema = z.enum([
  'send_sms_form',
  'mark_unreachable',
  'do_nothing',
])
export type AfterFailAction = z.infer<typeof AfterFailActionSchema>

// Unanswered calls settings
export const UnansweredCallsSettingsSchema = z.object({
  maxAttempts: z.number().min(1).max(10).default(5),
  timeBetweenAttempts: TimeBetweenAttemptsSchema.default({ value: 4, unit: 'hours' }),
  varyCallTimes: z.boolean().default(false),
  allowedCallingHours: z.array(CallingHourSlotSchema).default([]),
  afterAllAttemptsFail: AfterFailActionSchema.default('do_nothing'),
})
export type UnansweredCallsSettings = z.infer<typeof UnansweredCallsSettingsSchema>

// When to leave voicemail
export const VoicemailWhenSchema = z.enum([
  'final_attempt_only',
  'every_attempt',
  'never',
])
export type VoicemailWhen = z.infer<typeof VoicemailWhenSchema>

// Voicemail settings
export const VoicemailSettingsSchema = z.object({
  whenToLeave: VoicemailWhenSchema.default('final_attempt_only'),
  script: z.string().default(''),
})
export type VoicemailSettings = z.infer<typeof VoicemailSettingsSchema>

// Callback scheduling behavior
export const CallbackSchedulingSchema = z.enum([
  'ask_and_schedule',
  'offer_slots',
  'flag_for_manual',
])
export type CallbackScheduling = z.infer<typeof CallbackSchedulingSchema>

// Callback settings
export const CallbackSettingsSchema = z.object({
  responseScript: z.string().default(''),
  schedulingBehavior: CallbackSchedulingSchema.default('ask_and_schedule'),
  defaultCallbackDelay: TimeBetweenAttemptsSchema.default({ value: 2, unit: 'hours' }),
})
export type CallbackSettings = z.infer<typeof CallbackSettingsSchema>

// Interruption handling settings
export const InterruptionSettingsSchema = z.object({
  handleWrongPerson: z.boolean().default(true),
  handleHangupMidCall: z.boolean().default(true),
  handlePoorAudio: z.boolean().default(true),
  handleConfusedFrustrated: z.boolean().default(true),
  handleUnrelatedQuestions: z.boolean().default(true),
  handleLanguageBarrier: z.boolean().default(false),
  alternateLanguage: z.string().optional(),
})
export type InterruptionSettings = z.infer<typeof InterruptionSettingsSchema>

// Auto-flag rule
export const AutoFlagRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  condition: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'urgent']),
  enabled: z.boolean(),
})
export type AutoFlagRule = z.infer<typeof AutoFlagRuleSchema>

// Notification config
export const NotificationConfigSchema = z.object({
  email: z.boolean().default(false),
  sms: z.boolean().default(false),
  inApp: z.boolean().default(true),
  recipients: z.array(z.string()).default([]),
})
export type NotificationConfig = z.infer<typeof NotificationConfigSchema>

// Default notification config
const defaultNotificationConfig = {
  email: false,
  sms: false,
  inApp: true,
  recipients: [] as string[],
}

// Flags & escalation settings
export const FlagsAndEscalationSettingsSchema = z.object({
  autoFlagRules: z.array(AutoFlagRuleSchema).default([]),
  urgentNotification: NotificationConfigSchema.default(defaultNotificationConfig),
  standardNotification: NotificationConfigSchema.default(defaultNotificationConfig),
})
export type FlagsAndEscalationSettings = z.infer<typeof FlagsAndEscalationSettingsSchema>

// Transfer trigger
export const TransferTriggerSchema = z.object({
  id: z.string(),
  description: z.string(),
  enabled: z.boolean(),
})
export type TransferTrigger = z.infer<typeof TransferTriggerSchema>

// Transfer destination
export const TransferDestinationSchema = z.object({
  type: z.enum(['staff', 'phone', 'queue']),
  staffId: z.string().optional(),
  phoneNumber: z.string().optional(),
  queueId: z.string().optional(),
  warmTransfer: z.boolean().default(true),
})
export type TransferDestination = z.infer<typeof TransferDestinationSchema>

// Outside hours action
export const OutsideHoursActionSchema = z.enum([
  'leave_voicemail',
  'offer_callback',
  'send_sms',
  'end_call',
])
export type OutsideHoursAction = z.infer<typeof OutsideHoursActionSchema>

// Office hours
export const OfficeHoursSchema = z.object({
  monday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  tuesday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  wednesday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  thursday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  friday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  saturday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  sunday: z.object({ start: z.string(), end: z.string(), enabled: z.boolean() }),
  timezone: z.string().default('America/New_York'),
})
export type OfficeHours = z.infer<typeof OfficeHoursSchema>

// Transfer settings
export const TransferSettingsSchema = z.object({
  triggers: z.array(TransferTriggerSchema).default([]),
  duringOfficeHours: TransferDestinationSchema.optional(),
  outsideOfficeHours: OutsideHoursActionSchema.default('leave_voicemail'),
  officeHours: OfficeHoursSchema.optional(),
})
export type TransferSettings = z.infer<typeof TransferSettingsSchema>

// SMS follow-up settings
export const SmsFollowupSettingsSchema = z.object({
  sendAppointmentReminder: z.boolean().default(false),
  sendIntakeSummary: z.boolean().default(false),
  sendPaymentLink: z.boolean().default(false),
  sendFormLinkIfIncomplete: z.boolean().default(false),
})
export type SmsFollowupSettings = z.infer<typeof SmsFollowupSettingsSchema>

// Prompt source
export const PromptSourceSchema = z.enum(['builder', 'manual'])
export type PromptSource = z.infer<typeof PromptSourceSchema>

// Note: AgentQuestion and related types are defined in question-bank.ts

// Default values for nested schemas
const defaultUnansweredCalls: UnansweredCallsSettings = {
  maxAttempts: 5,
  timeBetweenAttempts: { value: 4, unit: 'hours' },
  varyCallTimes: false,
  allowedCallingHours: [],
  afterAllAttemptsFail: 'do_nothing',
}

const defaultVoicemail: VoicemailSettings = {
  whenToLeave: 'final_attempt_only',
  script: '',
}

const defaultCallbacks: CallbackSettings = {
  responseScript: '',
  schedulingBehavior: 'ask_and_schedule',
  defaultCallbackDelay: { value: 2, unit: 'hours' },
}

const defaultInterruptions: InterruptionSettings = {
  handleWrongPerson: true,
  handleHangupMidCall: true,
  handlePoorAudio: true,
  handleConfusedFrustrated: true,
  handleUnrelatedQuestions: true,
  handleLanguageBarrier: false,
}

const defaultFlagsAndEscalation: FlagsAndEscalationSettings = {
  autoFlagRules: [],
  urgentNotification: { email: false, sms: false, inApp: true, recipients: [] },
  standardNotification: { email: false, sms: false, inApp: true, recipients: [] },
}

const defaultTransfer: TransferSettings = {
  triggers: [],
  outsideOfficeHours: 'leave_voicemail',
}

const defaultSmsFollowup: SmsFollowupSettings = {
  sendAppointmentReminder: false,
  sendIntakeSummary: false,
  sendPaymentLink: false,
  sendFormLinkIfIncomplete: false,
}

// Complete agent settings (for the new config UI)
export const AgentSettingsSchema = z.object({
  // Basic
  name: z.string().min(1),
  description: z.string().optional(),
  status: AgentStatusSchema.default('draft'),
  specialty: z.string().default('general'),

  // Voice
  voiceId: z.string().optional(),
  voiceProvider: z.string().default('11labs'),
  voiceSpeed: z.number().min(0.5).max(2.0).default(0.9),
  language: z.string().default('en-US'),
  callerId: z.string().optional(),

  // Model
  model: z.string().default('gpt-4o-mini'),
  modelProvider: z.string().default('openai'),

  // Call behavior
  waitForGreeting: z.boolean().default(true),
  greeting: z.string().optional(),

  // Unanswered calls
  unansweredCalls: UnansweredCallsSettingsSchema.default(defaultUnansweredCalls),

  // Voicemail
  voicemail: VoicemailSettingsSchema.default(defaultVoicemail),

  // Callbacks
  callbacks: CallbackSettingsSchema.default(defaultCallbacks),

  // Interruptions
  interruptions: InterruptionSettingsSchema.default(defaultInterruptions),

  // Flags & Escalation
  flagsAndEscalation: FlagsAndEscalationSettingsSchema.default(defaultFlagsAndEscalation),

  // Transfer
  transfer: TransferSettingsSchema.default(defaultTransfer),

  // SMS Follow-up
  smsFollowup: SmsFollowupSettingsSchema.default(defaultSmsFollowup),

  // Prompt
  promptSource: PromptSourceSchema.default('builder'),
  systemPrompt: z.string().optional(),
  questions: z.array(AgentQuestionSchema).default([]),

  // Practice info
  practiceName: z.string().optional(),
  practicePhone: z.string().optional(),
})
export type AgentSettings = z.infer<typeof AgentSettingsSchema>

// Default settings factory
export const getDefaultAgentSettings = (): AgentSettings => ({
  name: '',
  status: 'draft',
  specialty: 'general',
  voiceProvider: '11labs',
  voiceSpeed: 0.9,
  language: 'en-US',
  model: 'gpt-4o-mini',
  modelProvider: 'openai',
  waitForGreeting: true,
  unansweredCalls: {
    maxAttempts: 5,
    timeBetweenAttempts: { value: 4, unit: 'hours' },
    varyCallTimes: false,
    allowedCallingHours: [],
    afterAllAttemptsFail: 'do_nothing',
  },
  voicemail: {
    whenToLeave: 'final_attempt_only',
    script: '',
  },
  callbacks: {
    responseScript: '',
    schedulingBehavior: 'ask_and_schedule',
    defaultCallbackDelay: { value: 2, unit: 'hours' },
  },
  interruptions: {
    handleWrongPerson: true,
    handleHangupMidCall: true,
    handlePoorAudio: true,
    handleConfusedFrustrated: true,
    handleUnrelatedQuestions: true,
    handleLanguageBarrier: false,
  },
  flagsAndEscalation: {
    autoFlagRules: [],
    urgentNotification: { email: false, sms: false, inApp: true, recipients: [] },
    standardNotification: { email: false, sms: false, inApp: true, recipients: [] },
  },
  transfer: {
    triggers: [],
    outsideOfficeHours: 'leave_voicemail',
  },
  smsFollowup: {
    sendAppointmentReminder: false,
    sendIntakeSummary: false,
    sendPaymentLink: false,
    sendFormLinkIfIncomplete: false,
  },
  promptSource: 'builder',
  questions: [],
})
