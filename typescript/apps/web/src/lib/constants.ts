/**
 * Static constants and utility functions
 * These are UI-specific values that don't need to come from the API
 */

import type { TaskStatus, PatientFlagReason } from './task-types'

// Flag reason options for patient flagging UI
export interface FlagReasonOption {
  id: PatientFlagReason
  label: string
  description: string
}

export const flagReasons: FlagReasonOption[] = [
  { id: 'abusive-language', label: 'Abusive Language', description: 'Used profanity or offensive language' },
  { id: 'verbal-threats', label: 'Verbal Threats', description: 'Made threatening statements' },
  { id: 'harassment', label: 'Harassment', description: 'Harassing or intimidating behavior' },
  { id: 'discriminatory', label: 'Discriminatory Remarks', description: 'Made discriminatory or hateful comments' },
  { id: 'other', label: 'Other Concern', description: 'Other behavioral concern' },
]

// Status labels for display
const statusLabels: Record<TaskStatus, string> = {
  'in-progress': 'In Progress',
  scheduled: 'Scheduled',
  escalated: 'Escalated',
  pending: 'Pending',
  completed: 'Completed',
}

export function getStatusLabel(status: TaskStatus): string {
  return statusLabels[status] || status
}

// Status colors for styling
export function getStatusColor(status: TaskStatus): { dot: string; badge: string } {
  switch (status) {
    case 'in-progress':
      return { dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' }
    case 'scheduled':
      return { dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' }
    case 'escalated':
      return { dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' }
    case 'pending':
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
    case 'completed':
      return { dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' }
    default:
      return { dot: 'bg-gray-400', badge: 'bg-gray-100 text-gray-600' }
  }
}
