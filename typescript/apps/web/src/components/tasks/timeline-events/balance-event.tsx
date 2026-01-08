import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'
import type { BalanceEvent } from '@/lib/task-types'

interface BalanceEventCardProps {
  event: BalanceEvent
}

export function BalanceEventCard({ event }: BalanceEventCardProps) {
  return (
    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-red-800 dark:text-red-200">
          {event.title}
        </span>
        {event.timestamp && (
          <span className="text-xs text-red-600 dark:text-red-400">{event.timestamp}</span>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-red-700 dark:text-red-300">
          {event.amount}
        </span>
      </div>
      <div className="text-sm text-red-600 dark:text-red-400 mt-1">
        <p>Due: {event.dueDate}</p>
        <p className="font-medium">{event.daysPastDue} days past due</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 h-7 text-xs border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900"
      >
        <Send className="h-3 w-3 mr-1" />
        Send Statement
      </Button>
    </div>
  )
}
