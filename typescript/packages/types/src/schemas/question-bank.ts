import { z } from 'zod'

// Question category
export const QuestionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  icon: z.string().optional(),
  sortOrder: z.number(),
})
export type QuestionCategory = z.infer<typeof QuestionCategorySchema>

// Response type for questions
export const ResponseTypeSchema = z.enum([
  'yes_no',
  'text',
  'number',
  'choice',
  'date',
  'multi_choice',
])
export type ResponseType = z.infer<typeof ResponseTypeSchema>

// Condition operator
export const ConditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
])
export type ConditionOperator = z.infer<typeof ConditionOperatorSchema>

// Question condition (for conditional display)
export const QuestionConditionSchema = z.object({
  field: z.string(), // Variable name to check
  operator: ConditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
})
export type QuestionCondition = z.infer<typeof QuestionConditionSchema>

// Bank question (template question in the library)
export const BankQuestionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  label: z.string(), // Short label for the question
  question: z.string(), // Full question text
  followUp: z.string().optional(), // Follow-up prompt if answer requires more info
  responseType: ResponseTypeSchema,
  choices: z.array(z.string()).optional(), // For choice/multi_choice types
  outputVariable: z.string(), // Variable name for storing the answer
  validation: z.string().optional(), // Validation instructions
  isSystem: z.boolean().default(false), // System questions can't be deleted
  tags: z.array(z.string()).default([]),
})
export type BankQuestion = z.infer<typeof BankQuestionSchema>

// Agent question (question added to an agent's script)
export const AgentQuestionSchema = z.object({
  id: z.string(),
  sourceQuestionId: z.string().optional(), // If copied from bank
  categoryId: z.string(),
  label: z.string(),
  question: z.string(),
  followUp: z.string().optional(),
  responseType: ResponseTypeSchema,
  choices: z.array(z.string()).optional(),
  outputVariable: z.string(),
  condition: QuestionConditionSchema.optional(), // When to ask this question
  required: z.boolean().default(true),
  sortOrder: z.number(),
})
export type AgentQuestion = z.infer<typeof AgentQuestionSchema>

// Question bank (organization-wide library)
export const QuestionBankSchema = z.object({
  categories: z.array(QuestionCategorySchema),
  questions: z.array(BankQuestionSchema),
})
export type QuestionBank = z.infer<typeof QuestionBankSchema>

// ============================================================================
// Default Question Bank Data
// ============================================================================

export const DEFAULT_CATEGORIES: QuestionCategory[] = [
  { id: 'universal', name: 'Universal', color: '#6366f1', icon: 'globe', sortOrder: 0 },
  { id: 'demographics', name: 'Demographics', color: '#8b5cf6', icon: 'user', sortOrder: 1 },
  { id: 'insurance', name: 'Insurance', color: '#0ea5e9', icon: 'shield', sortOrder: 2 },
  { id: 'pharmacy', name: 'Pharmacy', color: '#10b981', icon: 'pill', sortOrder: 3 },
  { id: 'clinical', name: 'Clinical', color: '#f59e0b', icon: 'stethoscope', sortOrder: 4 },
  { id: 'scheduling', name: 'Scheduling', color: '#ec4899', icon: 'calendar', sortOrder: 5 },
  { id: 'pulmonology', name: 'Pulmonology', color: '#14b8a6', icon: 'lungs', sortOrder: 6 },
]

export const DEFAULT_QUESTIONS: BankQuestion[] = [
  // Universal
  {
    id: 'confirm-identity',
    categoryId: 'universal',
    label: 'Confirm Identity',
    question: 'Am I speaking with {{patient_name}}?',
    responseType: 'yes_no',
    outputVariable: 'identity_confirmed',
    isSystem: true,
    tags: ['required', 'opener'],
  },
  {
    id: 'confirm-dob',
    categoryId: 'universal',
    label: 'Verify Date of Birth',
    question: 'For verification purposes, can you please confirm your date of birth?',
    responseType: 'date',
    outputVariable: 'dob_verified',
    isSystem: true,
    tags: ['verification'],
  },
  {
    id: 'confirm-appointment',
    categoryId: 'universal',
    label: 'Confirm Appointment',
    question: 'I\'m calling to confirm your appointment on {{appointment_date}} at {{appointment_time}}. Will you be able to make it?',
    responseType: 'yes_no',
    outputVariable: 'appointment_confirmed',
    isSystem: true,
    tags: ['confirmation'],
  },

  // Demographics
  {
    id: 'address-changed',
    categoryId: 'demographics',
    label: 'Address Verification',
    question: 'Has your address changed since your last visit? We have {{patient_address}} on file.',
    followUp: 'What is your new address?',
    responseType: 'yes_no',
    outputVariable: 'address_changed',
    isSystem: true,
    tags: ['demographics'],
  },
  {
    id: 'phone-changed',
    categoryId: 'demographics',
    label: 'Phone Verification',
    question: 'Is {{patient_phone}} still the best number to reach you?',
    followUp: 'What is your updated phone number?',
    responseType: 'yes_no',
    outputVariable: 'phone_changed',
    isSystem: true,
    tags: ['demographics'],
  },
  {
    id: 'email-changed',
    categoryId: 'demographics',
    label: 'Email Verification',
    question: 'Do you have an email address we can use to send you appointment reminders?',
    responseType: 'text',
    outputVariable: 'email_address',
    isSystem: true,
    tags: ['demographics'],
  },
  {
    id: 'emergency-contact',
    categoryId: 'demographics',
    label: 'Emergency Contact',
    question: 'Do we have your current emergency contact on file?',
    followUp: 'Can you provide the name and phone number of your emergency contact?',
    responseType: 'yes_no',
    outputVariable: 'emergency_contact_updated',
    isSystem: true,
    tags: ['demographics'],
  },

  // Insurance
  {
    id: 'insurance-changed',
    categoryId: 'insurance',
    label: 'Insurance Verification',
    question: 'Has your insurance changed since your last visit?',
    followUp: 'What is your new insurance provider and member ID?',
    responseType: 'yes_no',
    outputVariable: 'insurance_changed',
    isSystem: true,
    tags: ['insurance'],
  },
  {
    id: 'insurance-card',
    categoryId: 'insurance',
    label: 'Insurance Card',
    question: 'Please bring your current insurance card to your appointment. Do you have it available?',
    responseType: 'yes_no',
    outputVariable: 'has_insurance_card',
    isSystem: true,
    tags: ['insurance', 'reminder'],
  },
  {
    id: 'copay-info',
    categoryId: 'insurance',
    label: 'Copay Information',
    question: 'Your estimated copay for this visit is {{copay_amount}}. Are you aware of this?',
    responseType: 'yes_no',
    outputVariable: 'copay_acknowledged',
    isSystem: false,
    tags: ['insurance', 'billing'],
  },

  // Pharmacy
  {
    id: 'pharmacy-verify',
    categoryId: 'pharmacy',
    label: 'Pharmacy Verification',
    question: 'Is {{pharmacy_name}} still your preferred pharmacy?',
    followUp: 'What pharmacy would you like us to send your prescriptions to?',
    responseType: 'yes_no',
    outputVariable: 'pharmacy_verified',
    isSystem: true,
    tags: ['pharmacy'],
  },
  {
    id: 'medication-refills',
    categoryId: 'pharmacy',
    label: 'Medication Refills',
    question: 'Do you need any medication refills at this time?',
    followUp: 'Which medications need to be refilled?',
    responseType: 'yes_no',
    outputVariable: 'needs_refills',
    isSystem: true,
    tags: ['pharmacy', 'medications'],
  },

  // Clinical
  {
    id: 'current-symptoms',
    categoryId: 'clinical',
    label: 'Current Symptoms',
    question: 'Are you experiencing any new symptoms or concerns you\'d like to discuss at your appointment?',
    followUp: 'Can you briefly describe what you\'re experiencing?',
    responseType: 'yes_no',
    outputVariable: 'has_symptoms',
    isSystem: true,
    tags: ['clinical', 'symptoms'],
  },
  {
    id: 'hospitalization',
    categoryId: 'clinical',
    label: 'Recent Hospitalization',
    question: 'Have you been hospitalized or visited the emergency room since your last appointment?',
    followUp: 'Can you tell me when this was and what it was for?',
    responseType: 'yes_no',
    outputVariable: 'recent_hospitalization',
    isSystem: true,
    tags: ['clinical', 'urgent'],
  },
  {
    id: 'medication-changes',
    categoryId: 'clinical',
    label: 'Medication Changes',
    question: 'Have any of your medications changed since your last visit, including any new medications from other doctors?',
    followUp: 'What medications have changed?',
    responseType: 'yes_no',
    outputVariable: 'medication_changes',
    isSystem: true,
    tags: ['clinical', 'medications'],
  },
  {
    id: 'allergies',
    categoryId: 'clinical',
    label: 'Allergy Updates',
    question: 'Have you developed any new allergies to medications, foods, or other substances?',
    followUp: 'What are you allergic to and what reaction do you have?',
    responseType: 'yes_no',
    outputVariable: 'new_allergies',
    isSystem: true,
    tags: ['clinical', 'allergies'],
  },

  // Scheduling
  {
    id: 'transportation',
    categoryId: 'scheduling',
    label: 'Transportation',
    question: 'Do you have reliable transportation to get to your appointment?',
    responseType: 'yes_no',
    outputVariable: 'has_transportation',
    isSystem: true,
    tags: ['scheduling'],
  },
  {
    id: 'reschedule',
    categoryId: 'scheduling',
    label: 'Reschedule Request',
    question: 'Would you like to reschedule to a different date or time?',
    followUp: 'What day and time would work better for you?',
    responseType: 'yes_no',
    outputVariable: 'wants_reschedule',
    isSystem: true,
    tags: ['scheduling'],
  },
  {
    id: 'arrival-time',
    categoryId: 'scheduling',
    label: 'Arrival Time',
    question: 'Please remember to arrive 15 minutes early to complete any paperwork. Will that be possible?',
    responseType: 'yes_no',
    outputVariable: 'early_arrival_confirmed',
    isSystem: true,
    tags: ['scheduling', 'reminder'],
  },

  // Pulmonology-specific
  {
    id: 'cpap-usage',
    categoryId: 'pulmonology',
    label: 'CPAP Usage',
    question: 'How many hours per night are you using your CPAP machine on average?',
    responseType: 'number',
    outputVariable: 'cpap_hours',
    isSystem: false,
    tags: ['pulmonology', 'cpap'],
  },
  {
    id: 'cpap-issues',
    categoryId: 'pulmonology',
    label: 'CPAP Issues',
    question: 'Are you having any issues with your CPAP machine, such as mask fit, air leaks, or discomfort?',
    followUp: 'Can you describe the issues you\'re experiencing?',
    responseType: 'yes_no',
    outputVariable: 'cpap_issues',
    isSystem: false,
    tags: ['pulmonology', 'cpap'],
  },
  {
    id: 'oxygen-usage',
    categoryId: 'pulmonology',
    label: 'Oxygen Usage',
    question: 'Are you currently using supplemental oxygen?',
    followUp: 'How many liters per minute and how many hours per day?',
    responseType: 'yes_no',
    outputVariable: 'uses_oxygen',
    isSystem: false,
    tags: ['pulmonology', 'oxygen'],
  },
  {
    id: 'breathing-difficulty',
    categoryId: 'pulmonology',
    label: 'Breathing Difficulty',
    question: 'On a scale of 1 to 10, how would you rate your breathing difficulty over the past week?',
    responseType: 'number',
    outputVariable: 'breathing_score',
    isSystem: false,
    tags: ['pulmonology', 'symptoms'],
  },
  {
    id: 'inhaler-usage',
    categoryId: 'pulmonology',
    label: 'Inhaler Usage',
    question: 'How often have you needed to use your rescue inhaler in the past week?',
    responseType: 'choice',
    choices: ['Not at all', '1-2 times', '3-5 times', 'Daily', 'Multiple times daily'],
    outputVariable: 'inhaler_frequency',
    isSystem: false,
    tags: ['pulmonology', 'medications'],
  },
]

// Helper to get default question bank
export const getDefaultQuestionBank = (): QuestionBank => ({
  categories: DEFAULT_CATEGORIES,
  questions: DEFAULT_QUESTIONS,
})
