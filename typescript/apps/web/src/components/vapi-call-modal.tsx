"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Vapi from "@vapi-ai/web"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY || import.meta.env.VITE_VAPI_API_KEY || ''

interface VapiCallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistantId?: string
  squadId?: string
  name: string
}

type CallStatus = 'idle' | 'connecting' | 'connected' | 'ending' | 'ended'

export function VapiCallModal({ open, onOpenChange, assistantId, squadId, name }: VapiCallModalProps) {
  const isSquad = !!squadId
  const vapiRef = useRef<Vapi | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  // Initialize Vapi
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      setError('VAPI API key not configured')
      return
    }

    vapiRef.current = new Vapi(VAPI_PUBLIC_KEY)

    const vapi = vapiRef.current

    vapi.on('call-start', () => {
      setCallStatus('connected')
      setError(null)
    })

    vapi.on('call-end', () => {
      setCallStatus('ended')
    })

    vapi.on('error', (e) => {
      console.error('Vapi error:', e)
      setError(e.message || 'An error occurred')
      setCallStatus('idle')
    })

    vapi.on('message', (message) => {
      if (message.type === 'transcript') {
        if (message.transcriptType === 'final') {
          setTranscript(prev => [
            ...prev,
            { role: message.role, text: message.transcript }
          ])
        }
      }
    })

    vapi.on('volume-level', (level) => {
      setVolumeLevel(level)
    })

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCallStatus('idle')
      setTranscript([])
      setError(null)
      setIsMuted(false)
    } else {
      // End call when modal closes
      if (vapiRef.current && callStatus === 'connected') {
        vapiRef.current.stop()
      }
    }
  }, [open, callStatus])

  const startCall = useCallback(async () => {
    if (!vapiRef.current) return
    if (!assistantId && !squadId) return

    setCallStatus('connecting')
    setError(null)
    setTranscript([])

    try {
      if (isSquad && squadId) {
        // Start call with squad (3rd parameter)
        // start(assistant, assistantOverrides, squad, workflow, workflowOverrides, options)
        await vapiRef.current.start(undefined, undefined, squadId)
      } else if (assistantId) {
        // Start call with single assistant
        await vapiRef.current.start(assistantId)
      }
    } catch (e) {
      console.error('Failed to start call:', e)
      setError(e instanceof Error ? e.message : 'Failed to start call')
      setCallStatus('idle')
    }
  }, [assistantId, squadId, isSquad])

  const endCall = useCallback(() => {
    if (!vapiRef.current) return

    setCallStatus('ending')
    vapiRef.current.stop()
  }, [])

  const toggleMute = useCallback(() => {
    if (!vapiRef.current) return

    const newMuted = !isMuted
    vapiRef.current.setMuted(newMuted)
    setIsMuted(newMuted)
  }, [isMuted])

  const handleClose = () => {
    if (callStatus === 'connected') {
      endCall()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test {isSquad ? 'Squad' : 'Agent'}: {name}</DialogTitle>
          <DialogDescription>
            {callStatus === 'idle' && 'Click the button below to start a test call'}
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'connected' && 'Call in progress'}
            {callStatus === 'ending' && 'Ending call...'}
            {callStatus === 'ended' && 'Call ended'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Call visualization */}
          <div className="flex flex-col items-center justify-center py-6">
            {/* Animated circle during call */}
            <div className={cn(
              "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
              callStatus === 'connected' ? "bg-green-100 dark:bg-green-900/30" : "bg-muted",
              callStatus === 'connecting' && "animate-pulse"
            )}>
              {/* Volume indicator rings */}
              {callStatus === 'connected' && (
                <>
                  <div
                    className="absolute inset-0 rounded-full bg-green-400/20 animate-ping"
                    style={{
                      transform: `scale(${1 + volumeLevel * 0.5})`,
                      opacity: volumeLevel * 0.5
                    }}
                  />
                  <div
                    className="absolute inset-2 rounded-full bg-green-400/30"
                    style={{
                      transform: `scale(${1 + volumeLevel * 0.3})`,
                    }}
                  />
                </>
              )}

              {/* Center icon */}
              {callStatus === 'idle' && <Phone className="h-10 w-10 text-muted-foreground" />}
              {callStatus === 'connecting' && <Loader2 className="h-10 w-10 text-primary animate-spin" />}
              {callStatus === 'connected' && <Phone className="h-10 w-10 text-green-600" />}
              {callStatus === 'ending' && <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />}
              {callStatus === 'ended' && <PhoneOff className="h-10 w-10 text-muted-foreground" />}
            </div>

            {/* Status text */}
            <p className="mt-4 text-sm font-medium">
              {callStatus === 'idle' && 'Ready to call'}
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'connected' && 'Speaking with agent'}
              {callStatus === 'ending' && 'Hanging up...'}
              {callStatus === 'ended' && 'Call completed'}
            </p>
          </div>

          {/* Transcript */}
          {transcript.length > 0 && (
            <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-2">Transcript</p>
              <div className="space-y-2">
                {transcript.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "text-sm p-2 rounded",
                      item.role === 'user'
                        ? "bg-primary/10 ml-4"
                        : "bg-secondary/50 mr-4"
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.role === 'user' ? 'You' : 'Agent'}:
                    </span>
                    <p className="mt-0.5">{item.text}</p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )}

          {/* Call controls */}
          <div className="flex items-center justify-center gap-4">
            {callStatus === 'idle' || callStatus === 'ended' ? (
              <Button
                size="lg"
                onClick={startCall}
                className="bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-5 w-5 mr-2" />
                {callStatus === 'ended' ? 'Call Again' : 'Start Call'}
              </Button>
            ) : callStatus === 'connected' ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleMute}
                  className={cn(isMuted && "bg-destructive/10 text-destructive")}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={endCall}
                >
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </Button>
              </>
            ) : (
              <Button disabled size="lg">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {callStatus === 'connecting' ? 'Connecting...' : 'Ending...'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
