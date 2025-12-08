"use client"

import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Globe,
  Clock,
  FileText,
  Play,
  Loader2,
  User,
} from "lucide-react"
import type { CallLog } from "@/lib/agent-types"
import {
  fetchCallLogs,
  fetchSquadCallLogs,
  formatDuration,
  formatCallDate,
  getCallerName,
} from "@/lib/vapi-api"
import { TranscriptModal } from "./transcript-modal"

interface CallLogsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assistantId?: string
  squadId?: string
  name: string
}

export function CallLogsDrawer({
  open,
  onOpenChange,
  assistantId,
  squadId,
  name,
}: CallLogsDrawerProps) {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showRecording, setShowRecording] = useState(false)

  useEffect(() => {
    if (open && (assistantId || squadId)) {
      loadCallLogs()
    }
  }, [open, assistantId, squadId])

  async function loadCallLogs() {
    setLoading(true)
    try {
      let fetchedCalls: CallLog[]
      if (squadId) {
        fetchedCalls = await fetchSquadCallLogs(squadId)
      } else if (assistantId) {
        fetchedCalls = await fetchCallLogs(assistantId)
      } else {
        fetchedCalls = []
      }
      setCalls(fetchedCalls)
    } catch (error) {
      console.error("Error loading call logs:", error)
    } finally {
      setLoading(false)
    }
  }

  function getCallTypeIcon(type: CallLog["type"]) {
    switch (type) {
      case "inboundPhoneCall":
        return <PhoneIncoming className="h-4 w-4 text-green-500" />
      case "outboundPhoneCall":
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />
      case "webCall":
        return <Globe className="h-4 w-4 text-purple-500" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  function getStatusBadge(status: CallLog["status"]) {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ended: "secondary",
      "in-progress": "default",
      ringing: "outline",
      queued: "outline",
      forwarding: "outline",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className="text-xs">
        {status}
      </Badge>
    )
  }

  function handleViewTranscript(call: CallLog) {
    setSelectedCall(call)
    setShowTranscript(true)
  }

  function handlePlayRecording(call: CallLog) {
    setSelectedCall(call)
    setShowRecording(true)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Call Logs
            </SheetTitle>
            <SheetDescription>{name}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No call logs found</p>
              </div>
            ) : (
              <div className="space-y-3 pr-4">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCallTypeIcon(call.type)}
                        <span className="font-medium">{getCallerName(call)}</span>
                      </div>
                      {getStatusBadge(call.status)}
                    </div>

                    {/* Details row */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatCallDate(call.startedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {formatDuration(call.duration)}
                      </div>
                    </div>

                    {/* Summary */}
                    {(call.summary || call.analysis?.summary) && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {call.summary || call.analysis?.summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewTranscript(call)}
                        disabled={!call.transcript && !call.messages?.length}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Transcript
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePlayRecording(call)}
                        disabled={!call.recordingUrl && !call.stereoRecordingUrl}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Recording
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Transcript Modal */}
      <TranscriptModal
        open={showTranscript}
        onOpenChange={setShowTranscript}
        call={selectedCall}
        mode="transcript"
      />

      {/* Recording Modal */}
      <TranscriptModal
        open={showRecording}
        onOpenChange={setShowRecording}
        call={selectedCall}
        mode="recording"
      />
    </>
  )
}
