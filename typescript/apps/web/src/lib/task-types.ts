// Task status enum
export type TaskStatus = 'in-progress' | 'scheduled' | 'escalated' | 'pending' | 'completed'

// Task type enum
export type TaskType = 'confirmation' | 'no-show' | 'pre-visit' | 'post-visit' | 'recall' | 'collections'

// EHR sync status
export type EhrSyncStatus = 'synced' | 'pending' | 'failed' | 'syncing'

// Agent type
export type AgentType = 'ai' | 'staff'

// Voice agent interface
export interface VoiceAgent {
  id: string
  name: string
  type: AgentType
  role: string
  avatar: string
}

// Patient info within task
export interface TaskPatient {
  id: string
  name: string
  phone: string
  dob: string
}

// EHR sync info
export interface EhrSync {
  status: EhrSyncStatus
  lastSync: string | null
  error?: string
}

// Transcript message
export interface TranscriptMessage {
  speaker: 'ai' | 'patient'
  text: string
  time: string
  flagged?: boolean
}

// Patient flag reason
export type PatientFlagReason =
  | 'abusive-language'
  | 'verbal-threats'
  | 'harassment'
  | 'discriminatory'
  | 'other'

// Patient behavior flag
export interface PatientBehaviorFlag {
  flagged: boolean
  reason: PatientFlagReason
  notes: string
  flaggedBy: string
  flaggedAt: string
}

// Flag reason option for UI
export interface FlagReasonOption {
  id: PatientFlagReason
  label: string
  description: string
}

// Base timeline event
export interface BaseTimelineEvent {
  id: string
  timestamp: string
  title: string
}

// Created event
export interface CreatedEvent extends BaseTimelineEvent {
  type: 'created'
  description: string
}

// Voice event
export interface VoiceEvent extends BaseTimelineEvent {
  type: 'voice'
  duration: string
  status: 'completed' | 'escalated'
  summary: string
  transcript: TranscriptMessage[]
}

// Scheduled event
export interface ScheduledEvent extends BaseTimelineEvent {
  type: 'scheduled'
  scheduledTime: string
  description: string
}

// Escalated event
export interface EscalatedEvent extends BaseTimelineEvent {
  type: 'escalated'
  assignedTo: string
  reason: string
}

// Flag event
export interface FlagEvent extends BaseTimelineEvent {
  type: 'flag'
  reason: string
  notes: string
  flaggedBy: string
}

// Objective item
export interface ObjectiveItem {
  text: string
  status: 'confirmed' | 'needs-attention'
  patientResponse: string
}

// Objectives event
export interface ObjectivesEvent extends BaseTimelineEvent {
  type: 'objectives'
  items: ObjectiveItem[]
}

// Balance event
export interface BalanceEvent extends BaseTimelineEvent {
  type: 'balance'
  amount: string
  dueDate: string
  daysPastDue: number
}

// Next steps item
export interface NextStepsItem {
  text: string
  done: boolean
}

// Next steps event
export interface NextStepsEvent extends BaseTimelineEvent {
  type: 'next-steps'
  items: NextStepsItem[]
}

// Completed event
export interface CompletedEvent extends BaseTimelineEvent {
  type: 'completed'
  description: string
}

// Note event
export interface NoteEvent extends BaseTimelineEvent {
  type: 'note'
  content: string
}

// Call event (outbound demo call)
export interface CallEvent extends BaseTimelineEvent {
  type: 'call'
  endedReason: string
  transcript?: string
}

// Union type for all timeline events
export type TimelineEvent =
  | CreatedEvent
  | VoiceEvent
  | ScheduledEvent
  | EscalatedEvent
  | FlagEvent
  | ObjectivesEvent
  | BalanceEvent
  | NextStepsEvent
  | CompletedEvent
  | NoteEvent
  | CallEvent

// Main Task interface
export interface Task {
  id: number
  patient: TaskPatient
  provider: string
  type: TaskType
  status: TaskStatus
  assignedAgent: string
  time: string
  unread: boolean
  amount?: string
  description: string
  ehrSync: EhrSync
  timeline: TimelineEvent[]
}

// Task filters
export interface TaskFilters {
  statuses: TaskStatus[]  // Empty array means all statuses
  agent: string | 'all' | 'me'  // 'me' = current user's tasks
  type: TaskType | 'all'
  search: string
}

// Status option for filters
export interface StatusOption {
  id: TaskStatus | 'all'
  label: string
  color: string
}

// Dashboard types
export interface DashboardSummary {
  totalTasks: number
  completedTasks: number
  aiHandled: number
  staffHandled: number
  escalated: number
}

export interface DashboardRoi {
  hoursSaved: number
  moneySaved: number
  avgCallDuration: number
  costPerCall: number
  manualCostPerCall: number
}

export interface DashboardReach {
  patientsContacted: number
  successfulConnections: number
  voicemailsLeft: number
  callbacksScheduled: number
}

export interface TaskBreakdown {
  type: string
  count: number
  aiRate: number
}

export interface AgentPerformance {
  name: string
  type: AgentType
  tasks: number
  successRate: number
  avgDuration: string
}

export interface DailyMetrics {
  tasks: number
  minutes: number
  cost: number
}

export interface WeeklyTrend {
  day: string
  date: string
  ai: DailyMetrics
  staff: DailyMetrics
}

export interface DashboardData {
  summary: DashboardSummary
  roi: DashboardRoi
  reach: DashboardReach
  taskBreakdown: TaskBreakdown[]
  agentPerformance: AgentPerformance[]
  weeklyTrend: WeeklyTrend[]
}

// Date range for reports
export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface DatePreset {
  id: string
  label: string
}
