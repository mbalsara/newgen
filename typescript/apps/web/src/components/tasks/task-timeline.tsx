import {
  Plus,
  Mic,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimelineEvent, Task } from '@/lib/task-types'
import { VoiceEventCard } from './timeline-events/voice-event'
import { ObjectivesEventCard } from './timeline-events/objectives-event'
import { NextStepsEventCard } from './timeline-events/next-steps-event'
import { BalanceEventCard } from './timeline-events/balance-event'

interface TaskTimelineProps {
  task: Task
}

const eventIcons: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
  created: { icon: Plus, bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
  voice: { icon: Mic, bg: 'bg-gray-800 dark:bg-gray-200', text: 'text-white dark:text-gray-900' },
  'next-steps': { icon: ArrowRight, bg: 'bg-gray-200 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
}

export function TaskTimeline({ task }: TaskTimelineProps) {
  return (
    <div className="space-y-4">
      {task.timeline.map(event => (
        <TimelineEventItem key={event.id} event={event} task={task} />
      ))}
    </div>
  )
}

interface TimelineEventItemProps {
  event: TimelineEvent
  task: Task
}

function TimelineEventItem({ event, task }: TimelineEventItemProps) {
  const iconConfig = eventIcons[event.type] || eventIcons.created

  // Some events don't need the icon column
  const showIcon = ['created', 'voice', 'next-steps'].includes(event.type)

  return (
    <div className="flex gap-4">
      {/* Icon column */}
      {showIcon && (
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            iconConfig.bg,
            iconConfig.text
          )}
        >
          <iconConfig.icon className="h-4 w-4" />
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1', !showIcon && 'ml-12')}>
        <EventContent event={event} task={task} />
      </div>
    </div>
  )
}

interface EventContentProps {
  event: TimelineEvent
  task: Task
}

function EventContent({ event, task }: EventContentProps) {
  switch (event.type) {
    case 'created':
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-sm text-muted-foreground">{event.title}</span>
            <span className="text-xs text-muted-foreground">{event.timestamp}</span>
          </div>
          <p className="text-sm mt-1">{event.description}</p>
        </div>
      )

    case 'voice':
      return <VoiceEventCard event={event} />

    case 'scheduled':
      return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-sm text-muted-foreground">{event.title}</span>
            <span className="text-xs text-muted-foreground">{event.timestamp}</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
            {event.scheduledTime}
          </p>
          <p className="text-sm mt-1">{event.description}</p>
        </div>
      )

    case 'escalated':
      return (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-sm text-amber-800 dark:text-amber-200">
              {event.title}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {event.timestamp}
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Assigned to: <span className="font-medium">{event.assignedTo}</span>
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400">{event.reason}</p>
        </div>
      )

    case 'flag':
      return (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-sm text-red-800 dark:text-red-200">
              {event.title}
            </span>
            <span className="text-xs text-red-600 dark:text-red-400">
              {event.timestamp}
            </span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-medium">
            {event.reason}
          </p>
          {event.notes && (
            <p className="text-sm text-red-600 dark:text-red-400">{event.notes}</p>
          )}
          <p className="text-xs text-red-500 mt-1">Flagged by {event.flaggedBy}</p>
        </div>
      )

    case 'objectives':
      return <ObjectivesEventCard event={event} task={task} />

    case 'balance':
      return <BalanceEventCard event={event} />

    case 'next-steps':
      return <NextStepsEventCard event={event} task={task} />

    case 'completed':
      return (
        <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-sm text-green-800 dark:text-green-200">
              {event.title}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              {event.timestamp}
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            {event.description}
          </p>
        </div>
      )

    default:
      return null
  }
}
