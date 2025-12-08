"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  MessageSquareIcon,
} from "lucide-react"
import type { CallLog } from "@/lib/agent-types"
import { formatDuration, formatCallDate, getCallerName } from "@/lib/vapi-api"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message, MessageContent } from "@/components/ai-elements/message"

interface TranscriptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  call: CallLog | null
  mode: "transcript" | "recording"
}

export function TranscriptModal({
  open,
  onOpenChange,
  call,
  mode,
}: TranscriptModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const recordingUrl = call?.stereoRecordingUrl || call?.recordingUrl

  useEffect(() => {
    if (!open) {
      setIsPlaying(false)
      setCurrentTime(0)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [open])

  // Auto-play when recording modal opens
  useEffect(() => {
    if (open && mode === "recording" && recordingUrl) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Auto-play might be blocked by browser, user can click play
          })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [open, mode, recordingUrl])

  function handlePlayPause() {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  function handleLoadedMetadata() {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setIsLoading(false)
    }
  }

  function handleSeek(value: number[]) {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  function toggleMute() {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  function getTranscriptMessages(): Array<{ role: "user" | "assistant"; content: string; time?: number }> {
    if (!call) return []

    // If messages array exists, use it
    if (call.messages && call.messages.length > 0) {
      return call.messages
        .filter((m) => {
          const role = m.role?.toLowerCase()
          // Include assistant/bot/ai messages and user messages
          return role === "assistant" || role === "user" || role === "bot" || role === "ai"
        })
        .map((m) => {
          const role = m.role?.toLowerCase()
          // Normalize role to "assistant" or "user"
          const normalizedRole: "user" | "assistant" =
            (role === "assistant" || role === "bot" || role === "ai") ? "assistant" : "user"
          return {
            role: normalizedRole,
            content: m.message || m.content || "",
            time: m.time,
          }
        })
    }

    // Otherwise, try to parse the transcript string
    if (call.transcript) {
      // Simple parsing - split by speaker turns
      const lines = call.transcript.split("\n").filter((l) => l.trim())
      return lines.map((line) => {
        const lowerLine = line.toLowerCase()
        const isAssistant =
          lowerLine.startsWith("assistant:") ||
          lowerLine.startsWith("ai:") ||
          lowerLine.startsWith("bot:")
        return {
          role: isAssistant ? "assistant" as const : "user" as const,
          content: line.replace(/^(assistant|ai|bot|user|human):\s*/i, ""),
        }
      })
    }

    return []
  }

  const callerName = call ? getCallerName(call) : "Caller"

  if (!call) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl !w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {mode === "transcript" ? (
              <>
                <FileText className="h-5 w-5" />
                Call Transcript
              </>
            ) : (
              <>
                <Volume2 className="h-5 w-5" />
                Call Recording
              </>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span>{callerName}</span>
            <span>•</span>
            <span>{formatCallDate(call.startedAt)}</span>
            <span>•</span>
            <span>{formatDuration(call.duration)}</span>
          </DialogDescription>
        </DialogHeader>

        {mode === "recording" ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {recordingUrl ? (
              <>
                <audio
                  ref={audioRef}
                  src={recordingUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onLoadStart={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                />

                {/* Player controls */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePlayPause}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <div className="flex-1 space-y-1">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatDuration(currentTime)}</span>
                      <span>{formatDuration(duration)}</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Summary if available */}
                {(call.summary || call.analysis?.summary) && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Call Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      {call.summary || call.analysis?.summary}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recording available for this call</p>
              </div>
            )}
          </div>
        ) : (
          <Conversation className="flex-1">
            <ConversationContent className="p-6">
              {getTranscriptMessages().length === 0 ? (
                <ConversationEmptyState
                  description="No transcript available for this call"
                  icon={<MessageSquareIcon className="size-6" />}
                  title="No transcript"
                />
              ) : (
                getTranscriptMessages().map((message, index) => (
                  <Message
                    from={message.role === "assistant" ? "assistant" : "user"}
                    key={index}
                  >
                    <MessageContent>{message.content}</MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        )}

        {/* Call end reason if available */}
        {call.endedReason && (
          <div className="border-t px-6 py-3">
            <Badge variant="outline" className="text-xs">
              Ended: {call.endedReason}
            </Badge>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
