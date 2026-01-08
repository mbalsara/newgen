import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/lib/task-types'

interface StatusDotProps {
  status: TaskStatus
  className?: string
}

const statusColors: Record<TaskStatus, string> = {
  'in-progress': 'bg-amber-500',
  scheduled: 'bg-blue-500',
  escalated: 'bg-red-500',
  pending: 'bg-gray-400',
  completed: 'bg-green-500',
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn('inline-block h-2 w-2 rounded-full', statusColors[status], className)}
    />
  )
}
