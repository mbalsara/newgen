"use client"

import { useState, useEffect, useRef } from "react"
import type { Agent, AgentFormData, AgentType, VoiceGender, CallDirection, VapiVoice } from "@/lib/agent-types"
import { AGENT_TYPE_LABELS, VOICE_GENDER_LABELS, CALL_DIRECTION_LABELS } from "@/lib/agent-types"
import { getVoices, createAgent, updateAgent, getSquads, updateAgentSquad, type Squad } from "@/lib/vapi-api"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Play, Square, Phone, Loader2, Users } from "lucide-react"
import { VapiCallModal } from "./vapi-call-modal"

interface AgentDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: Agent | null
  onSaved: () => void
}

const NO_SQUAD_VALUE = "__none__"

export function AgentDrawer({ open, onOpenChange, agent, onSaved }: AgentDrawerProps) {
  const isEditing = !!agent
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [agentType, setAgentType] = useState<AgentType>("receptionist")
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female")
  const [voiceId, setVoiceId] = useState("")
  const [callDirection, setCallDirection] = useState<CallDirection>("inbound")
  const [selectedSquadId, setSelectedSquadId] = useState<string>(NO_SQUAD_VALUE)

  // Available options
  const [availableVoices, setAvailableVoices] = useState<VapiVoice[]>([])
  const [availableSquads, setAvailableSquads] = useState<Squad[]>([])
  const [isLoadingSquads, setIsLoadingSquads] = useState(false)

  // Load squads when drawer opens
  useEffect(() => {
    if (open) {
      setIsLoadingSquads(true)
      getSquads()
        .then(squads => setAvailableSquads(squads))
        .finally(() => setIsLoadingSquads(false))
    }
  }, [open])

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setAgentType(agent.agentType)
      setVoiceGender(agent.voiceGender)
      setVoiceId(agent.voiceId)
      setCallDirection(agent.callDirection)
      setSelectedSquadId(agent.squadId || NO_SQUAD_VALUE)
    } else {
      setName("")
      setAgentType("receptionist")
      setVoiceGender("female")
      setVoiceId("")
      setCallDirection("inbound")
      setSelectedSquadId(NO_SQUAD_VALUE)
    }
  }, [agent])

  // Update available voices when gender changes
  useEffect(() => {
    const voices = getVoices(voiceGender)
    setAvailableVoices(voices)

    // If current voice doesn't match gender, reset to first available
    const currentVoice = voices.find(v => v.voiceId === voiceId)
    if (!currentVoice && voices.length > 0) {
      setVoiceId(voices[0].voiceId)
    }
  }, [voiceGender, voiceId])

  // Stop audio when drawer closes
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }
  }, [open])

  const handlePlayVoice = (voice: VapiVoice) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
      return // If was playing, just stop
    }

    // Check if preview URL exists
    if (!voice.previewUrl) {
      toast.info(`Voice: ${voice.name}`, {
        description: `${voice.description || 'No description'} - ${voice.accent || 'Standard'} accent`,
      })
      return
    }

    // Create and play new audio
    const audio = new Audio(voice.previewUrl)
    audioRef.current = audio
    setIsPlaying(true)

    audio.onended = () => {
      setIsPlaying(false)
      audioRef.current = null
    }

    audio.onerror = () => {
      toast.error("Failed to load voice preview")
      setIsPlaying(false)
      audioRef.current = null
    }

    audio.play().catch(() => {
      toast.error("Failed to play voice preview")
      setIsPlaying(false)
      audioRef.current = null
    })
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an agent name")
      return
    }

    if (!voiceId) {
      toast.error("Please select a voice")
      return
    }

    setIsSaving(true)

    try {
      const formData: AgentFormData = {
        name: name.trim(),
        agentType,
        voiceGender,
        voiceId,
        callDirection,
      }

      let agentId = agent?.id

      if (isEditing && agent) {
        await updateAgent(agent.id, formData)
      } else {
        const result = await createAgent(formData)
        agentId = result.id
      }

      // Update squad membership
      if (agentId) {
        const newSquadId = selectedSquadId === NO_SQUAD_VALUE ? null : selectedSquadId
        const currentSquadId = agent?.squadId || null

        if (newSquadId !== currentSquadId) {
          await updateAgentSquad(agentId, newSquadId, currentSquadId)
        }
      }

      toast.success(isEditing ? "Agent updated successfully" : "Agent created successfully")
      onSaved()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving agent:", error)
      toast.error(isEditing ? "Failed to update agent" : "Failed to create agent")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = () => {
    if (!agent?.id) {
      toast.error("Please save the agent first")
      return
    }

    setShowTestModal(true)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full overflow-y-auto flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{isEditing ? "Edit Agent" : "Add New Agent"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the agent configuration below."
              : "Configure a new voice agent for your practice."}
          </SheetDescription>
        </SheetHeader>

        {/* Form Content */}
        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., Front Desk Maya"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Agent Type */}
          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select value={agentType} onValueChange={(v) => setAgentType(v as AgentType)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AGENT_TYPE_LABELS) as AgentType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {AGENT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Gender */}
          <div className="space-y-2">
            <Label>Voice Gender</Label>
            <Select value={voiceGender} onValueChange={(v) => setVoiceGender(v as VoiceGender)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select voice gender" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VOICE_GENDER_LABELS) as VoiceGender[]).map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {VOICE_GENDER_LABELS[gender]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {availableVoices.map((voice) => (
                  <SelectItem key={voice.voiceId} value={voice.voiceId}>
                    <div className="flex items-center gap-2">
                      <span>{voice.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({voice.accent || 'Standard'})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Voice Preview */}
            {voiceId && (
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const voice = availableVoices.find(v => v.voiceId === voiceId)
                    if (voice) handlePlayVoice(voice)
                  }}
                >
                  {isPlaying ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Preview Voice
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {availableVoices.find(v => v.voiceId === voiceId)?.description}
                </span>
              </div>
            )}
          </div>

          {/* Call Direction */}
          <div className="space-y-2">
            <Label>Call Direction</Label>
            <Select value={callDirection} onValueChange={(v) => setCallDirection(v as CallDirection)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select call direction" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CALL_DIRECTION_LABELS) as CallDirection[]).map((direction) => (
                  <SelectItem key={direction} value={direction}>
                    {CALL_DIRECTION_LABELS[direction]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {callDirection === 'inbound'
                ? "Agent receives incoming calls from patients/providers"
                : "Agent makes outgoing calls for reminders/follow-ups"}
            </p>
          </div>

          {/* Squad Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Squad
            </Label>
            <Select
              value={selectedSquadId}
              onValueChange={setSelectedSquadId}
              disabled={isLoadingSquads}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingSquads ? "Loading squads..." : "Select a squad"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SQUAD_VALUE}>
                  <span className="text-muted-foreground">No squad</span>
                </SelectItem>
                {availableSquads.map((squad) => (
                  <SelectItem key={squad.id} value={squad.id}>
                    <div className="flex items-center gap-2">
                      <span>{squad.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({squad.members?.length || 0} members)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Assign this agent to a squad for coordinated call handling
            </p>
          </div>
        </div>

        {/* Footer with all buttons in one row */}
        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            {isEditing && (
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={!agent?.id}
              >
                <Phone className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Test Call Modal */}
      {agent && (
        <VapiCallModal
          open={showTestModal}
          onOpenChange={setShowTestModal}
          assistantId={agent.id}
          name={agent.name}
        />
      )}
    </Sheet>
  )
}
