import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/task-types'
import { getStatusLabel } from '@/lib/mock-agents'

interface StatusBadgeProps {
  status: TaskStatus
  className?: string
}

const statusStyles: Record<TaskStatus, string> = {
  'in-progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
  escalated: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100',
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  )
}
