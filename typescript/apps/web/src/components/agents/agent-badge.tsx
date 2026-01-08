import { cn } from '@/lib/utils'
import type { AgentType } from '@/lib/task-types'

interface AgentBadgeProps {
  type: AgentType
  className?: string
}

export function AgentBadge({ type, className }: AgentBadgeProps) {
  if (type === 'ai') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
          className
        )}
      >
        AI
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100',
        className
      )}
    >
      Staff
    </span>
  )
}
