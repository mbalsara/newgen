import { useState } from 'react'
import { Phone, Play, ChevronDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CallEvent } from '@/lib/task-types'

interface CallEventCardProps {
  event: CallEvent
}

export function CallEventCard({ event }: CallEventCardProps) {
  const [showTranscript, setShowTranscript] = useState(false)

  const hasMessages = event.messages && event.messages.length > 0
  const hasRecording = !!event.recordingUrl

  // Get a friendly status from endedReason
  const getStatusLabel = (reason: string) => {
    switch (reason) {
      case 'assistant-ended-call':
        return { label: 'Completed', color: 'text-green-600 dark:text-green-400' }
      case 'voicemail':
        return { label: 'Voicemail', color: 'text-amber-600 dark:text-amber-400' }
      case 'customer-did-not-answer':
        return { label: 'No Answer', color: 'text-gray-500' }
      case 'customer-ended-call':
        return { label: 'Patient Ended', color: 'text-gray-500' }
      default:
        return { label: reason, color: 'text-gray-500' }
    }
  }

  const status = getStatusLabel(event.endedReason)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{event.title}</span>
          <span className={cn('text-sm font-medium', status.color)}>
            {status.label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{event.timestamp}</span>
      </div>

      <div className="flex items-center gap-3 mt-3">
        {hasRecording && (
          <Button
            size="sm"
            className="h-8 gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            onClick={() => window.open(event.recordingUrl, '_blank')}
          >
            <Play className="h-3 w-3" fill="currentColor" />
            Play Recording
          </Button>
        )}
        {hasMessages && (
          <button
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            onClick={() => setShowTranscript(!showTranscript)}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', showTranscript && 'rotate-180')} />
            View Transcript
          </button>
        )}
      </div>

      {showTranscript && hasMessages && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          {event.messages!.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                message.speaker === 'ai' ? 'justify-start' : 'justify-end'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                  message.speaker === 'ai'
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'bg-blue-500 text-white',
                  message.flagged &&
                    'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                )}
              >
                {message.flagged && (
                  <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Flagged content
                  </div>
                )}
                <p>{message.text}</p>
                <p
                  className={cn(
                    'text-[10px] mt-1',
                    message.speaker === 'ai'
                      ? 'text-muted-foreground'
                      : message.flagged
                      ? 'text-red-500'
                      : 'text-blue-100'
                  )}
                >
                  {message.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show raw transcript if no parsed messages */}
      {!hasMessages && event.transcript && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm whitespace-pre-wrap">
          {event.transcript}
        </div>
      )}
    </div>
  )
}
