"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { api, type Agent } from "@/lib/api-client"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { toast } from "sonner"
import {
  Play,
  Square,
  Loader2,
  Settings,
  Mic,
  MessageSquare,
  Target,
  Code,
  RefreshCw,
  UserRoundCog,
  ChevronDown,
  ChevronRight,
  PhoneOff,
  Voicemail,
  AlertTriangle,
  Users,
} from "lucide-react"
import {
  DEFAULT_OBJECTIVES,
  GREETING_TEMPLATES,
  TEMPLATE_VARIABLES,
} from "@repo/types"
import type {
  AgentObjective,
  AgentSpecialty,
  ObjectiveCategory,
  EventHandling,
  EventAction,
} from "@repo/types"
import { cn } from "@/lib/utils"

// ElevenLabs voices available
const ELEVEN_LABS_VOICES = [
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/6edb9076-c3e4-420c-b6ab-11d43fe341c8.mp3" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c5373f-0dc2-4efd-9232-a0571ce71d95.mp3" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/04d4dc97-f5d6-4c1e-b8e6-4e7d6d2d7b4a.mp3" },
  { voiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", gender: "female", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/d42a1a52-99a8-4c5b-8a16-4c1f1b2d5a3e.mp3" },
  { voiceId: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female", accent: "English-Swedish", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/942356dc-f10d-4d89-bda5-4f8505ee038b.mp3" },
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/f8a4d3b1-9c6e-4e8a-b5c0-d2e1f0a9b8c7.mp3" },
  { voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", gender: "male", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/yoZ06aMxZJJ28mfd3POQ/1c4d5f6a-7b8c-9d0e-1f2a-3b4c5d6e7f8a.mp3" },
  { voiceId: "VR6AewLTigWG4xSOukaG", name: "Arnold", gender: "male", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/2a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d.mp3" },
]

const SPECIALTIES: { value: AgentSpecialty; label: string }[] = [
  { value: "general", label: "General Practice" },
  { value: "cardiology", label: "Cardiology" },
  { value: "dental", label: "Dental" },
  { value: "dermatology", label: "Dermatology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "ophthalmology", label: "Ophthalmology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "surgery", label: "Surgery" },
  { value: "other", label: "Other" },
]

const OBJECTIVE_CATEGORIES: { value: ObjectiveCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "demographics", label: "Demographics" },
  { value: "insurance", label: "Insurance" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "financial", label: "Financial" },
  { value: "pre-visit", label: "Pre-Visit" },
]

const EVENT_ACTIONS: { value: EventAction; label: string }[] = [
  { value: "complete", label: "Complete Task" },
  { value: "retry", label: "Retry Call" },
  { value: "escalate", label: "Escalate to Staff" },
  { value: "none", label: "No Action" },
]

// Navigation sections
const SECTIONS = [
  { id: "basic", label: "Basic", icon: Settings },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "greeting", label: "Greeting", icon: MessageSquare },
  { id: "objectives", label: "Objectives", icon: Target },
  { id: "events", label: "Events", icon: PhoneOff },
  { id: "fallback", label: "Fallback", icon: Users },
  { id: "prompt", label: "Prompt", icon: Code },
  { id: "retry", label: "Retry", icon: RefreshCw },
]

// Default event handling
const DEFAULT_EVENT_HANDLING: EventHandling = {
  voicemail: {
    action: "retry",
    message: "Hi, this is {{agent_name}} calling from {{practice_name}}. Please call us back at {{practice_phone}} at your earliest convenience. Thank you!",
  },
  noAnswer: {
    action: "retry",
    maxAttempts: 5,
  },
  busyLine: {
    action: "retry",
    retryDelayMinutes: 30,
  },
  callDisconnected: {
    action: "retry",
    notes: "Patient disconnected mid-call",
  },
  abusiveLanguage: {
    action: "escalate",
    message: "I understand you may be frustrated, but I'm not able to continue this conversation with that kind of language. I'm going to end this call now and have a team member follow up with you. Goodbye.",
  },
  successCriteria: [
    "Patient confirms appointment",
    "Patient reschedules appointment",
    "Patient provides requested information",
  ],
  escalationCriteria: [
    "Patient requests human assistance",
    "Complex questions requiring clinical knowledge",
    "Patient uses abusive language",
    "Maximum retry attempts exceeded",
  ],
}

interface AgentConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: Agent | null
  onSaved: () => void
}

export function AgentConfigDrawer({ open, onOpenChange, agent, onSaved }: AgentConfigDrawerProps) {
  const isEditing = !!agent
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [isPlaying, setIsPlaying] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("basic")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic", "voice", "greeting", "events"])
  )

  // Staff list for fallback selection
  const [staffList, setStaffList] = useState<Agent[]>([])

  // Form state
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [voiceId, setVoiceId] = useState<string | null>(null)
  const [greeting, setGreeting] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [specialty, setSpecialty] = useState<AgentSpecialty>("general")
  const [selectedObjectives, setSelectedObjectives] = useState<AgentObjective[]>([])
  const [practiceName, setPracticeName] = useState("")
  const [practicePhone, setPracticePhone] = useState("")
  const [maxRetries, setMaxRetries] = useState(5)
  const [retryDelayMinutes, setRetryDelayMinutes] = useState(60)
  const [fallbackStaffId, setFallbackStaffId] = useState<string | null>(null)
  const [eventHandling, setEventHandling] = useState<EventHandling>(DEFAULT_EVENT_HANDLING)

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    if (element && scrollContainerRef.current) {
      // Expand if collapsed
      if (!expandedSections.has(sectionId)) {
        setExpandedSections(prev => new Set([...prev, sectionId]))
      }
      // Scroll with offset for sticky nav
      const container = scrollContainerRef.current
      const offsetTop = element.offsetTop - 60
      container.scrollTo({ top: offsetTop, behavior: "smooth" })
    }
  }

  // Track scroll position for active section
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return

    const container = scrollContainerRef.current
    const scrollTop = container.scrollTop + 100 // offset for sticky nav

    for (const section of SECTIONS) {
      const element = sectionRefs.current[section.id]
      if (element) {
        const { offsetTop, offsetHeight } = element
        if (scrollTop >= offsetTop && scrollTop < offsetTop + offsetHeight) {
          setActiveSection(section.id)
          break
        }
      }
    }
  }, [])

  // Load staff when drawer opens
  useEffect(() => {
    if (open) {
      api.agents.staff().then(setStaffList).catch(console.error)
    }
  }, [open])

  // Reset form when agent changes
  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setRole(agent.role)
      setVoiceId(agent.voiceId || null)
      setGreeting(agent.greeting || "")
      setSystemPrompt(agent.systemPrompt || "")
      setSpecialty((agent.specialty as AgentSpecialty) || "general")
      setSelectedObjectives(agent.objectives || [])
      setPracticeName(agent.practiceName || "")
      setPracticePhone(agent.practicePhone || "")
      setMaxRetries(agent.maxRetries ?? 5)
      setRetryDelayMinutes(agent.retryDelayMinutes ?? 60)
      setFallbackStaffId(agent.fallbackStaffId || null)
      setEventHandling(agent.eventHandling || DEFAULT_EVENT_HANDLING)
    } else {
      setName("")
      setRole("")
      setVoiceId(null)
      setGreeting("")
      setSystemPrompt("")
      setSpecialty("general")
      setSelectedObjectives([])
      setPracticeName("")
      setPracticePhone("")
      setMaxRetries(5)
      setRetryDelayMinutes(60)
      setFallbackStaffId(null)
      setEventHandling(DEFAULT_EVENT_HANDLING)
    }
  }, [agent])

  // Stop audio when drawer closes
  useEffect(() => {
    if (!open && audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
      setPlayingVoiceId(null)
    }
  }, [open])

  const handlePlayVoice = (voice: typeof ELEVEN_LABS_VOICES[0]) => {
    if (audioRef.current && playingVoiceId === voice.voiceId) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
      setPlayingVoiceId(null)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    if (!voice.previewUrl) {
      toast.info(`Voice: ${voice.name}`, { description: `${voice.accent} accent` })
      return
    }

    const audio = new Audio(voice.previewUrl)
    audioRef.current = audio
    setIsPlaying(true)
    setPlayingVoiceId(voice.voiceId)

    audio.onended = () => {
      setIsPlaying(false)
      setPlayingVoiceId(null)
      audioRef.current = null
    }

    audio.onerror = () => {
      toast.error("Failed to load voice preview")
      setIsPlaying(false)
      setPlayingVoiceId(null)
      audioRef.current = null
    }

    audio.play().catch(() => {
      toast.error("Failed to play voice preview")
      setIsPlaying(false)
      setPlayingVoiceId(null)
      audioRef.current = null
    })
  }

  const handleObjectiveToggle = (objectiveId: string, checked: boolean) => {
    if (checked) {
      const defaultObj = DEFAULT_OBJECTIVES[objectiveId]
      if (defaultObj) {
        setSelectedObjectives([...selectedObjectives, defaultObj])
      }
    } else {
      setSelectedObjectives(selectedObjectives.filter(o => o.id !== objectiveId))
    }
  }

  const handleObjectiveRequiredToggle = (objectiveId: string, required: boolean) => {
    setSelectedObjectives(selectedObjectives.map(o =>
      o.id === objectiveId ? { ...o, required } : o
    ))
  }

  const handleInsertVariable = (varName: string, target: "greeting" | "prompt") => {
    const variable = `{{${varName}}}`
    if (target === "greeting") {
      setGreeting(prev => prev + variable)
    } else {
      setSystemPrompt(prev => prev + variable)
    }
  }

  const handleUseGreetingTemplate = (taskType: string) => {
    const template = GREETING_TEMPLATES[taskType]
    if (template) {
      setGreeting(template)
    }
  }

  const updateEventHandling = <K extends keyof EventHandling>(
    key: K,
    value: EventHandling[K]
  ) => {
    setEventHandling(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an agent name")
      return
    }

    setIsSaving(true)

    try {
      const data: Partial<Agent> = {
        name: name.trim(),
        role: role.trim() || "AI Voice Agent",
        type: "ai",
        voiceId,
        voiceProvider: voiceId ? "11labs" : null,
        greeting: greeting || null,
        systemPrompt: systemPrompt || null,
        specialty,
        objectives: selectedObjectives,
        practiceName: practiceName || null,
        practicePhone: practicePhone || null,
        maxRetries,
        retryDelayMinutes,
        fallbackStaffId,
        eventHandling,
      }

      if (isEditing && agent) {
        await api.agents.update(agent.id, data)
      } else {
        await api.agents.create({
          ...data,
          id: `ai-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        })
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

  // Section component
  const Section = ({
    id,
    title,
    icon: Icon,
    children,
  }: {
    id: string
    title: string
    icon: React.ElementType
    children: React.ReactNode
  }) => {
    const isExpanded = expandedSections.has(id)
    return (
      <div
        ref={(el) => { sectionRefs.current[id] = el }}
        className="border-b border-border"
      >
        <Collapsible open={isExpanded} onOpenChange={() => toggleSection(id)}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{title}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>{isEditing ? "Configure Agent" : "Create AI Agent"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Configure voice, greeting, objectives, and behavior settings."
              : "Set up a new AI voice agent with custom configuration."}
          </SheetDescription>
        </SheetHeader>

        {/* Sticky Navigation */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-2 flex gap-1 overflow-x-auto">
          {SECTIONS.map(section => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  activeSection === section.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {/* Basic Section */}
          <Section id="basic" title="Basic Information" icon={Settings}>
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                placeholder="e.g., Luna"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g., Appointment Confirmation"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Specialty</Label>
              <Select value={specialty} onValueChange={(v) => setSpecialty(v as AgentSpecialty)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="practiceName">Practice Name</Label>
                <Input
                  id="practiceName"
                  placeholder="e.g., Sunny Valley Medical"
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practicePhone">Practice Phone</Label>
                <Input
                  id="practicePhone"
                  placeholder="e.g., (555) 123-4567"
                  value={practicePhone}
                  onChange={(e) => setPracticePhone(e.target.value)}
                />
              </div>
            </div>
          </Section>

          {/* Voice Section */}
          <Section id="voice" title="Voice Configuration" icon={Mic}>
            <p className="text-sm text-muted-foreground">
              Choose an ElevenLabs voice for your agent. Click to preview.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ELEVEN_LABS_VOICES.map(voice => (
                <div
                  key={voice.voiceId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                    voiceId === voice.voiceId
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => setVoiceId(voice.voiceId)}
                >
                  <div>
                    <p className="font-medium text-sm">{voice.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {voice.gender} - {voice.accent}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlayVoice(voice)
                    }}
                  >
                    {isPlaying && playingVoiceId === voice.voiceId ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </Section>

          {/* Greeting Section */}
          <Section id="greeting" title="Greeting Message" icon={MessageSquare}>
            <p className="text-sm text-muted-foreground">
              The first message the agent says when the call connects.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => handleUseGreetingTemplate("confirmation")}>
                Confirmation
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleUseGreetingTemplate("pre-visit")}>
                Pre-Visit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleUseGreetingTemplate("no-show")}>
                No-Show
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleUseGreetingTemplate("recall")}>
                Recall
              </Button>
            </div>
            <Textarea
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}..."
              rows={4}
            />
            <div className="flex gap-1 flex-wrap">
              {TEMPLATE_VARIABLES.slice(0, 6).map(v => (
                <Button
                  key={v.name}
                  variant="secondary"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleInsertVariable(v.name, "greeting")}
                >
                  {`{{${v.name}}}`}
                </Button>
              ))}
            </div>
          </Section>

          {/* Objectives Section */}
          <Section id="objectives" title="Call Objectives" icon={Target}>
            <p className="text-sm text-muted-foreground">
              Select the objectives the agent should accomplish during calls.
            </p>

            {OBJECTIVE_CATEGORIES.map(category => {
              const categoryObjectives = Object.entries(DEFAULT_OBJECTIVES)
                .filter(([, obj]) => obj.category === category.value)

              if (categoryObjectives.length === 0) return null

              return (
                <div key={category.value} className="space-y-2">
                  <Label className="text-sm font-medium">{category.label}</Label>
                  <div className="space-y-2">
                    {categoryObjectives.map(([id, obj]) => {
                      const isSelected = selectedObjectives.some(o => o.id === id)
                      const selectedObj = selectedObjectives.find(o => o.id === id)

                      return (
                        <div
                          key={id}
                          className="flex items-start gap-3 p-2 rounded-lg border bg-muted/50"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleObjectiveToggle(id, !!checked)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{obj.text}</p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selectedObj?.required || false}
                                onCheckedChange={(checked) => handleObjectiveRequiredToggle(id, !!checked)}
                              />
                              <span className="text-xs text-muted-foreground">Required</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </Section>

          {/* Event Handling Section */}
          <Section id="events" title="Event Handling" icon={PhoneOff}>
            <p className="text-sm text-muted-foreground">
              Configure how the agent handles different call events.
            </p>

            {/* Voicemail */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <Voicemail className="h-4 w-4 text-blue-500" />
                <Label className="font-medium">Voicemail</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <Select
                    value={eventHandling.voicemail.action}
                    onValueChange={(v) => updateEventHandling("voicemail", { ...eventHandling.voicemail, action: v as EventAction })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_ACTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Voicemail Message</Label>
                <Textarea
                  value={eventHandling.voicemail.message}
                  onChange={(e) => updateEventHandling("voicemail", { ...eventHandling.voicemail, message: e.target.value })}
                  placeholder="Message to leave on voicemail..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>

            {/* No Answer */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <PhoneOff className="h-4 w-4 text-amber-500" />
                <Label className="font-medium">No Answer</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <Select
                    value={eventHandling.noAnswer.action}
                    onValueChange={(v) => updateEventHandling("noAnswer", { ...eventHandling.noAnswer, action: v as EventAction })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_ACTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Max Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={eventHandling.noAnswer.maxAttempts}
                    onChange={(e) => updateEventHandling("noAnswer", { ...eventHandling.noAnswer, maxAttempts: parseInt(e.target.value) || 5 })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Busy Line */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <PhoneOff className="h-4 w-4 text-orange-500" />
                <Label className="font-medium">Busy Line</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <Select
                    value={eventHandling.busyLine.action}
                    onValueChange={(v) => updateEventHandling("busyLine", { ...eventHandling.busyLine, action: v as EventAction })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_ACTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Retry Delay (min)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={eventHandling.busyLine.retryDelayMinutes}
                    onChange={(e) => updateEventHandling("busyLine", { ...eventHandling.busyLine, retryDelayMinutes: parseInt(e.target.value) || 30 })}
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            {/* Call Disconnected */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <PhoneOff className="h-4 w-4 text-red-500" />
                <Label className="font-medium">Call Disconnected</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Action</Label>
                <Select
                  value={eventHandling.callDisconnected.action}
                  onValueChange={(v) => updateEventHandling("callDisconnected", { ...eventHandling.callDisconnected, action: v as EventAction })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Abusive Language */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <Label className="font-medium">Abusive Language</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Action</Label>
                <Select
                  value={eventHandling.abusiveLanguage.action}
                  onValueChange={(v) => updateEventHandling("abusiveLanguage", { ...eventHandling.abusiveLanguage, action: v as EventAction })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Closing Message</Label>
                <Textarea
                  value={eventHandling.abusiveLanguage.message}
                  onChange={(e) => updateEventHandling("abusiveLanguage", { ...eventHandling.abusiveLanguage, message: e.target.value })}
                  placeholder="Message before ending call..."
                  rows={2}
                  className="text-sm"
                />
              </div>
            </div>
          </Section>

          {/* Fallback Section */}
          <Section id="fallback" title="Fallback & Escalation" icon={Users}>
            <p className="text-sm text-muted-foreground">
              Configure who to escalate to when the AI cannot complete the task.
            </p>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserRoundCog className="h-4 w-4" />
                Primary Fallback Staff
              </Label>
              <Select
                value={fallbackStaffId || "none"}
                onValueChange={(v) => setFallbackStaffId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fallback staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Auto-assign (round-robin)</span>
                  </SelectItem>
                  {staffList.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} - {staff.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Staff member to escalate to when max retries are exceeded.
              </p>
            </div>

            {/* Success Criteria */}
            <div className="space-y-2">
              <Label>Success Criteria</Label>
              <div className="space-y-1">
                {eventHandling.successCriteria.map((criteria, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-green-500/10 text-sm">
                    <span className="text-green-600">✓</span>
                    {criteria}
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Criteria */}
            <div className="space-y-2">
              <Label>Escalation Criteria</Label>
              <div className="space-y-1">
                {eventHandling.escalationCriteria.map((criteria, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-amber-500/10 text-sm">
                    <span className="text-amber-600">⚠</span>
                    {criteria}
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* Prompt Section */}
          <Section id="prompt" title="System Prompt" icon={Code}>
            <p className="text-sm text-muted-foreground">
              Override the default system prompt. Leave empty to use the default.
            </p>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="You are {{agent_name}}, a professional AI assistant for {{practice_name}}..."
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex gap-1 flex-wrap">
              {TEMPLATE_VARIABLES.map(v => (
                <Button
                  key={v.name}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => handleInsertVariable(v.name, "prompt")}
                  title={v.description}
                >
                  {v.name}
                </Button>
              ))}
            </div>
          </Section>

          {/* Retry Section */}
          <Section id="retry" title="Retry Settings" icon={RefreshCw}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Maximum Retry Attempts</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  min={1}
                  max={10}
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  Before escalating to staff.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
                <Input
                  id="retryDelay"
                  type="number"
                  min={15}
                  max={1440}
                  value={retryDelayMinutes}
                  onChange={(e) => setRetryDelayMinutes(parseInt(e.target.value) || 60)}
                />
                <p className="text-xs text-muted-foreground">
                  Wait time before retrying.
                </p>
              </div>
            </div>
          </Section>

          {/* Bottom padding for scroll */}
          <div className="h-24" />
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-background">
          <div className="flex items-center justify-end gap-3">
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
                "Save Configuration"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
