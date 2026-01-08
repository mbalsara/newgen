import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { QueueCard } from './queue-card'
import type { Task } from '@/lib/task-types'
import { cn } from '@/lib/utils'

interface QueueColumnProps {
  title: string
  tasks: Task[]
  color: 'blue' | 'amber' | 'red' | 'green'
}

const colorClasses = {
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
}

export function QueueColumn({ title, tasks, color }: QueueColumnProps) {
  return (
    <div className="flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-800">
        <span className={cn('h-2 w-2 rounded-full', colorClasses[color])} />
        <span className="font-medium text-sm">{title}</span>
        <Badge variant="secondary" className="text-xs ml-auto">
          {tasks.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {tasks.map(task => (
            <QueueCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No tasks
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
