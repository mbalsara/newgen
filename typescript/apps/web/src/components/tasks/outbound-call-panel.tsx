import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Phone, PhoneOff, Loader2, CheckCircle, XCircle, AlertTriangle, PhoneMissed, Voicemail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { api, type CallStatusResponse, type Agent } from '@/lib/api-client'
import { useTasks } from '@/contexts/tasks-context'
import type { Task } from '@/lib/task-types'

// Default VAPI phone number ID (configured in VAPI dashboard)
// This should be set in the environment or VAPI dashboard
const VAPI_PHONE_NUMBER_ID = import.meta.env.VITE_VAPI_PHONE_NUMBER_ID || '8e1f0d5e-96e5-4f43-b4a3-3f2d8f3a9c1b'

interface OutboundCallPanelProps {
  task: Task
  onClose: () => void
}

type CallState = 'idle' | 'dialing' | 'ringing' | 'in-progress' | 'ended' | 'failed'

interface TranscriptMessage {
  role: 'assistant' | 'user'
  content: string
}

export function OutboundCallPanel({ task, onClose }: OutboundCallPanelProps) {
  const { handleCallCompletion } = useTasks()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callState, setCallState] = useState<CallState>('idle')
  const [callId, setCallId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [endedReason, setEndedReason] = useState<string | undefined>(undefined)
  const [reasonInfo, setReasonInfo] = useState<CallStatusResponse['reasonInfo'] | null>(null)
  const [taskUpdateResult, setTaskUpdateResult] = useState<{ action: string; message: string } | null>(null)
  const [agent, setAgent] = useState<Agent | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canceledRef = useRef(false)

  // Load agent info on mount
  useEffect(() => {
    const loadAgent = async () => {
      if (task.assignedAgent) {
        try {
          const agentData = await api.agents.getById(task.assignedAgent)
          setAgent(agentData)
        } catch (err) {
          console.error('Error loading agent:', err)
        }
      }
    }
    loadAgent()
  }, [task.assignedAgent])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (durationRef.current) clearInterval(durationRef.current)
    }
  }, [])

  const pollCallStatus = useCallback(async (id: string) => {
    try {
      const status = await api.calls.getStatus(id)

      // Update call state based on status
      if (status.status === 'ringing') {
        setCallState('ringing')
      } else if (status.status === 'in-progress') {
        setCallState('in-progress')
      } else if (status.status === 'ended') {
        setCallState('ended')
        setEndedReason(status.endedReason)
        setReasonInfo(status.reasonInfo)

        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        if (durationRef.current) {
          clearInterval(durationRef.current)
          durationRef.current = null
        }

        // Handle call completion - backend will update task
        const result = await handleCallCompletion(task.id, id)
        setTaskUpdateResult(result)
      }

      // Update transcript
      if (status.messages && status.messages.length > 0) {
        const parsed = status.messages.map(m => ({
          role: m.speaker === 'ai' ? 'assistant' as const : 'user' as const,
          content: m.text
        }))
        setTranscript(parsed)
      }
    } catch (err) {
      console.error('Error polling call status:', err)
    }
  }, [handleCallCompletion, task.id])

  const startCall = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number')
      return
    }

    if (!agent?.vapiAssistantId) {
      setError('This agent does not have a VAPI assistant configured')
      return
    }

    setError(null)
    setCallState('dialing')
    setTranscript([])
    setDuration(0)
    setEndedReason(undefined)
    setReasonInfo(null)
    canceledRef.current = false

    try {
      const result = await api.calls.startOutbound({
        taskId: task.id,
        agentId: task.assignedAgent,
        patientName: task.patient.name,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customerNumber: phoneNumber,
      })

      // Check if user canceled while we were waiting for API
      if (canceledRef.current) {
        console.log('Call was canceled during dialing, ending the call')
        try {
          await api.calls.end(result.callId)
        } catch {
          // Ignore errors when ending canceled call
        }
        return
      }

      setCallId(result.callId)
      setCallState('ringing')

      // Start polling for call status
      pollingRef.current = setInterval(() => {
        pollCallStatus(result.callId)
      }, 2000)

      // Start duration timer
      durationRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)

      // Initial poll
      pollCallStatus(result.callId)
    } catch (err) {
      // Don't show error if user canceled
      if (canceledRef.current) {
        return
      }
      console.error('Failed to start call:', err)
      setError(err instanceof Error ? err.message : 'Failed to start call')
      setCallState('failed')
    }
  }

  const endCall = async () => {
    // Clear any timers first
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (durationRef.current) {
      clearInterval(durationRef.current)
      durationRef.current = null
    }

    // If no callId yet (still dialing), mark as canceled and reset to idle
    if (!callId) {
      console.log('Canceling call (no call ID yet)')
      canceledRef.current = true
      setCallState('idle')
      setDuration(0)
      return
    }

    console.log('Ending call:', callId)

    try {
      await api.calls.end(callId)
      console.log('Call ended successfully')
      setCallState('ended')
      setEndedReason('manually-canceled')
      setReasonInfo({
        title: 'Call Cancelled',
        description: 'The call was manually cancelled.',
        canRetry: true,
        isSuccess: false,
      })
    } catch (err) {
      console.error('Failed to end call:', err)
      // Still update the UI state even if the API call fails
      setCallState('ended')
      setEndedReason('manually-canceled')
    }
  }

  const resetCall = () => {
    setCallState('idle')
    setCallId(null)
    setTranscript([])
    setError(null)
    setDuration(0)
    setEndedReason(undefined)
    setReasonInfo(null)
    setTaskUpdateResult(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Phone Input View
  if (callState === 'idle' || callState === 'failed') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Task
          </button>
          <h2 className="text-lg font-semibold">Demo Call</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Patient: {task.patient.name}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a phone number to call. The AI agent will call this number and you can watch the conversation live.
              </p>
            </div>

            {/* Agent Info */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm font-medium mb-1">Calling Agent</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{agent?.avatar || '🤖'}</span>
                <div>
                  <div className="font-medium">{agent?.name || 'Unknown Agent'}</div>
                  <div className="text-xs text-muted-foreground">{agent?.role || 'AI Agent'}</div>
                </div>
              </div>
              {agent && !agent.vapiAssistantId && (
                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Note: This agent is not configured for outbound calls
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); startCall(); }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="text-center text-lg"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={!agent?.vapiAssistantId}
              >
                <Phone className="h-5 w-5 mr-2" />
                Start Demo Call
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Active Call View
  const isSuccess = endedReason === 'assistant-ended-call' || endedReason === 'assistant-said-end-call-phrase'
  const isVoicemail = endedReason === 'voicemail'
  const isNoAnswer = endedReason === 'customer-did-not-answer' || endedReason === 'customer-busy'

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Demo Call</h2>
              {(callState === 'dialing' || callState === 'ringing' || callState === 'in-progress') && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-red-600 font-medium">Live</span>
                </span>
              )}
              {callState === 'ended' && reasonInfo && (
                <span className={cn(
                  'flex items-center gap-1.5',
                  isSuccess ? 'text-green-600' : isVoicemail ? 'text-amber-600' : isNoAnswer ? 'text-orange-600' : 'text-gray-600'
                )}>
                  {isSuccess ? <CheckCircle className="h-4 w-4" /> :
                   isVoicemail ? <Voicemail className="h-4 w-4" /> :
                   isNoAnswer ? <PhoneMissed className="h-4 w-4" /> :
                   <AlertTriangle className="h-4 w-4" />}
                  <span className="text-sm font-medium">{reasonInfo.title}</span>
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {phoneNumber} | Agent: {agent?.name || 'Unknown'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-semibold">{formatTime(duration)}</div>
            <div className="text-xs text-muted-foreground">
              {callState === 'dialing' && 'Dialing...'}
              {callState === 'ringing' && 'Ringing...'}
              {callState === 'in-progress' && 'In Progress'}
              {callState === 'ended' && 'Call Ended'}
            </div>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Live Transcript</h3>

          {transcript.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {callState !== 'ended' ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {callState === 'dialing' && 'Connecting call...'}
                    {callState === 'ringing' && 'Waiting for answer...'}
                    {callState === 'in-progress' && 'Waiting for conversation...'}
                  </p>
                </>
              ) : reasonInfo && (
                <>
                  <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                    reasonInfo.isSuccess || isVoicemail ? 'bg-green-100 dark:bg-green-900' :
                    isNoAnswer ? 'bg-orange-100 dark:bg-orange-900' :
                    'bg-gray-100 dark:bg-gray-800'
                  )}>
                    {reasonInfo.isSuccess || isVoicemail ? <CheckCircle className="h-8 w-8 text-green-600" /> :
                     isNoAnswer ? <PhoneMissed className="h-8 w-8 text-orange-600" /> :
                     <XCircle className="h-8 w-8 text-gray-400" />}
                  </div>
                  <h4 className="font-medium mb-1">{reasonInfo.title}</h4>
                  <p className="text-sm text-muted-foreground max-w-xs">{reasonInfo.description}</p>

                  {/* Task update result */}
                  {taskUpdateResult && (
                    <div className={cn(
                      'mt-4 p-3 rounded-lg text-sm max-w-xs',
                      taskUpdateResult.action === 'completed' ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300' :
                      taskUpdateResult.action === 'flagged' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                      'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    )}>
                      {taskUpdateResult.message}
                    </div>
                  )}

                  {reasonInfo.canRetry && !taskUpdateResult && (
                    <p className="text-xs text-muted-foreground mt-2">
                      You can try calling again using the button below.
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {transcript.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    'max-w-[85%] p-3 rounded-lg',
                    msg.role === 'assistant'
                      ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-auto'
                      : 'bg-blue-500 text-white ml-auto'
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium mb-1',
                    msg.role === 'assistant' ? 'text-muted-foreground' : 'text-blue-100'
                  )}>
                    {msg.role === 'assistant' ? agent?.name || 'Agent' : 'Patient'}
                  </div>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Action bar */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {callState !== 'ended' ? (
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
              className="min-w-32"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>
          ) : reasonInfo && (
            <>
              {reasonInfo.canRetry && (
                endedReason === 'customer-did-not-answer' ||
                endedReason === 'customer-busy' ||
                endedReason === 'voicemail' ||
                endedReason === 'silence-timed-out'
              ) ? (
                <Button
                  onClick={resetCall}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Retry Call
                </Button>
              ) : (
                <Button
                  onClick={resetCall}
                  variant="outline"
                  size="lg"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Call Again
                </Button>
              )}
              <Button
                onClick={onClose}
                variant={reasonInfo.canRetry ? 'outline' : 'default'}
                size="lg"
              >
                Back to Task
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
