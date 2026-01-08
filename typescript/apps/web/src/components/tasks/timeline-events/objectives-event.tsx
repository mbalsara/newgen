import { useState } from 'react'
import { Check, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useTasks } from '@/contexts/tasks-context'
import type { ObjectivesEvent, Task } from '@/lib/task-types'

interface ObjectivesEventCardProps {
  event: ObjectivesEvent
  task: Task
}

export function ObjectivesEventCard({ event, task }: ObjectivesEventCardProps) {
  const { editingObjective, setEditingObjective, updateObjective } = useTasks()

  const confirmedCount = event.items.filter(i => i.status === 'confirmed').length
  const needsAttentionCount = event.items.filter(i => i.status === 'needs-attention').length

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{event.title}</span>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
            >
              {confirmedCount} Confirmed
            </Badge>
            {needsAttentionCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
              >
                {needsAttentionCount} Needs Attention
              </Badge>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{event.timestamp}</span>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {event.items.map((item, index) => (
          <ObjectiveItem
            key={index}
            item={item}
            index={index}
            event={event}
            task={task}
            isEditing={
              editingObjective?.taskId === task.id &&
              editingObjective?.eventId === event.id &&
              editingObjective?.itemIndex === index
            }
            onEdit={() =>
              setEditingObjective({ taskId: task.id, eventId: event.id, itemIndex: index })
            }
            onSave={(response, status) =>
              updateObjective(task.id, event.id, index, response, status)
            }
            onCancel={() => setEditingObjective(null)}
          />
        ))}
      </div>
    </div>
  )
}

interface ObjectiveItemProps {
  item: { text: string; status: 'confirmed' | 'needs-attention'; patientResponse: string }
  index: number
  event: ObjectivesEvent
  task: Task
  isEditing: boolean
  onEdit: () => void
  onSave: (response: string, status: 'confirmed' | 'needs-attention') => void
  onCancel: () => void
}

function ObjectiveItem({
  item,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: ObjectiveItemProps) {
  const [editResponse, setEditResponse] = useState(item.patientResponse)
  const [editStatus, setEditStatus] = useState(item.status)

  const handleSave = () => {
    onSave(editResponse, editStatus)
  }

  return (
    <div className="p-3">
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5',
            item.status === 'confirmed'
              ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
              : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
          )}
        >
          {item.status === 'confirmed' ? (
            <Check className="h-3 w-3" />
          ) : (
            <X className="h-3 w-3" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm">{item.text}</p>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editResponse}
                onChange={e => setEditResponse(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={editStatus}
                  onValueChange={v => setEditStatus(v as 'confirmed' | 'needs-attention')}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="needs-attention">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={onCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'mt-2 p-2 rounded text-sm',
                item.status === 'confirmed'
                  ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="italic">"{item.patientResponse}"</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={onEdit}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
