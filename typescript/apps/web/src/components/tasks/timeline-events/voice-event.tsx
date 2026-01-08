import { useState } from 'react'
import { Play, ChevronDown, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VoiceEvent } from '@/lib/task-types'

interface VoiceEventCardProps {
  event: VoiceEvent
}

export function VoiceEventCard({ event }: VoiceEventCardProps) {
  const [showTranscript, setShowTranscript] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-sm">{event.title}</span>
          <span className="text-sm text-muted-foreground">{event.duration}</span>
        </div>
        <span className="text-xs text-muted-foreground">{event.timestamp}</span>
      </div>

      <p className="text-sm mt-2">{event.summary}</p>

      <div className="flex items-center gap-3 mt-3">
        <Button
          size="sm"
          className="h-8 gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <Play className="h-3 w-3" fill="currentColor" />
          Play
        </Button>
        <button
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          onClick={() => setShowTranscript(!showTranscript)}
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform', showTranscript && 'rotate-180')} />
          View Transcript
        </button>
      </div>

      {showTranscript && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
          {event.transcript.map((message, index) => (
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
    </div>
  )
}
