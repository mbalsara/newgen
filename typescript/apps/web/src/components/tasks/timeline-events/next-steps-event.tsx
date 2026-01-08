import { Checkbox } from '@/components/ui/checkbox'
import { useTasks } from '@/contexts/tasks-context'
import type { NextStepsEvent, Task } from '@/lib/task-types'

interface NextStepsEventCardProps {
  event: NextStepsEvent
  task: Task
}

export function NextStepsEventCard({ event, task }: NextStepsEventCardProps) {
  const { toggleNextStep } = useTasks()

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-medium text-sm">{event.title}</span>
        {event.timestamp && (
          <span className="text-xs text-muted-foreground">{event.timestamp}</span>
        )}
      </div>
      <div className="space-y-3">
        {event.items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <Checkbox
              id={`${event.id}-${index}`}
              checked={item.done}
              onCheckedChange={() => toggleNextStep(task.id, event.id, index)}
              className="h-5 w-5"
            />
            <label
              htmlFor={`${event.id}-${index}`}
              className={`text-sm cursor-pointer ${
                item.done ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {item.text}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
