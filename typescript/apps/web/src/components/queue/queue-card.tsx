import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AgentAvatar } from '@/components/agents/agent-avatar'
import { getAgent } from '@/lib/mock-agents'
import { useTasks } from '@/contexts/tasks-context'
import type { Task } from '@/lib/task-types'
import { cn } from '@/lib/utils'

interface QueueCardProps {
  task: Task
}

const typeDescriptions: Record<string, string> = {
  confirmation: 'Appointment confirmation',
  'no-show': 'No-show follow-up',
  'pre-visit': 'Pre-visit preparation',
  'post-visit': 'Post-visit follow-up',
  recall: 'Recall campaign',
  collections: 'Collections',
}

export function QueueCard({ task }: QueueCardProps) {
  const navigate = useNavigate()
  const { isPatientFlagged, selectTask } = useTasks()
  const agent = getAgent(task.assignedAgent)
  const flagged = isPatientFlagged(task.patient.id)

  const handleClick = () => {
    selectTask(task.id)
    navigate('/tasks')
  }

  const description = task.amount
    ? `${typeDescriptions[task.type]} - ${task.amount}`
    : typeDescriptions[task.type]

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 hover:shadow-md transition-shadow',
        flagged && 'border-l-2 border-l-red-500'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm truncate">{task.patient.name}</span>
        {flagged && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
        {task.unread && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
          >
            NEW
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <AgentAvatar agent={agent} size="sm" />
        <span className="text-xs text-muted-foreground">{task.time}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
      <p className="text-xs text-muted-foreground truncate">{task.provider}</p>
    </button>
  )
}
