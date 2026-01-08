import { cn } from '@/lib/utils'
import { AlertTriangle, Check } from 'lucide-react'
import { StatusDot } from '@/components/shared/status-dot'
import { AgentAvatar } from '@/components/agents/agent-avatar'
import { Badge } from '@/components/ui/badge'
import { getAgent } from '@/lib/mock-agents'
import { useTasks } from '@/contexts/tasks-context'
import type { Task } from '@/lib/task-types'

interface TaskCardProps {
  task: Task
  isSelected: boolean
  onClick: () => void
}

export function TaskCard({ task, isSelected, onClick }: TaskCardProps) {
  const { isPatientFlagged } = useTasks()
  const agent = getAgent(task.assignedAgent)
  const flagged = isPatientFlagged(task.patient.id)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors',
        isSelected && 'bg-amber-50 dark:bg-amber-950/30 border-l-2 border-l-amber-500',
        flagged && !isSelected && 'border-l-2 border-l-red-500'
      )}
    >
      {/* Row 1: Patient name + badges + agent + time */}
      <div className="flex items-center gap-2">
        <StatusDot status={task.status} className="shrink-0" />
        <span className="font-medium text-sm">{task.patient.name}</span>
        {flagged && (
          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
        )}
        {task.unread && (
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white hover:bg-blue-500">
            NEW
          </Badge>
        )}
        <div className="flex-1" />
        {task.ehrSync.status === 'synced' && (
          <Check className="h-4 w-4 text-green-600 shrink-0" />
        )}
        <AgentAvatar agent={agent} size="sm" />
        <span className="text-xs text-muted-foreground">{task.time}</span>
      </div>

      {/* Row 2: Task description */}
      <p className="text-sm text-muted-foreground mt-1 pl-5">{task.description}</p>

      {/* Row 3: Provider */}
      <p className="text-xs text-muted-foreground mt-0.5 pl-5">{task.provider}</p>
    </button>
  )
}
