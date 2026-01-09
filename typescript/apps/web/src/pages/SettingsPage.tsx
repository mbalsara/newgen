"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { api, type Agent } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Bot,
  Play,
  Square,
  Loader2,
  Settings,
  Mic,
  MessageSquare,
  Target,
  Code,
  UserRoundCog,
  ChevronDown,
  PhoneOff,
  Voicemail,
  AlertTriangle,
  Users,
  Save,
  Phone,
} from 'lucide-react'
import {
  DEFAULT_OBJECTIVES,
  GREETING_TEMPLATES,
  TEMPLATE_VARIABLES,
  MODEL_PROVIDERS,
  MODELS_BY_PROVIDER,
  VOICE_SPEED,
  VOICE_SPEED_PRESETS,
} from '@repo/types'
import type { ModelInfo } from '@repo/types'
import type {
  AgentObjective,
  AgentSpecialty,
  ObjectiveCategory,
  EventHandling,
  EventAction,
  ModelProvider,
} from '@repo/types'
import { cn } from '@/lib/utils'

// Provider logo components
const ProviderLogo = ({ provider, className }: { provider: string; className?: string }) => {
  const logos: Record<string, React.ReactNode> = {
    openai: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    ),
    anthropic: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.304 3.541h-3.672l6.696 16.918h3.672zm-10.608 0L0 20.459h3.744l1.368-3.6h6.624l1.368 3.6h3.744L10.152 3.541zm-.048 10.404 2.16-5.688 2.16 5.688z"/>
      </svg>
    ),
    google: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053z"/>
      </svg>
    ),
    groq: (
      <div className={cn("font-bold text-[10px] bg-orange-500 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>G</div>
    ),
    'azure-openai': (
      <svg className={className} viewBox="0 0 24 24" fill="#0078D4">
        <path d="M12.343.01L.01 12.344l9.8 9.8L21.99 10.47 12.343.01zM6.155 8.15l6.154-4.93 1.54 1.917-6.154 4.93-1.54-1.917zm-.924 5.773l8.77-7.016 1.232 1.54-8.77 7.015-1.232-1.54zm12.308-4.617l2.308 2.308-9.809 9.809-2.308-2.308 9.809-9.809z"/>
      </svg>
    ),
    cerebras: (
      <div className={cn("font-bold text-[10px] bg-purple-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>C</div>
    ),
    deepseek: (
      <div className={cn("font-bold text-[10px] bg-blue-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>D</div>
    ),
    xai: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.047 0L10.308 12 2.047 24H5.323L12 14.988 18.677 24h3.276L13.692 12 21.953 0h-3.276L12 9.012 5.323 0z"/>
      </svg>
    ),
    mistral: (
      <div className={cn("font-bold text-[10px] bg-orange-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>M</div>
    ),
    'perplexity-ai': (
      <div className={cn("font-bold text-[10px] bg-teal-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>P</div>
    ),
    'together-ai': (
      <div className={cn("font-bold text-[10px] bg-indigo-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>T</div>
    ),
    anyscale: (
      <div className={cn("font-bold text-[10px] bg-green-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>A</div>
    ),
    openrouter: (
      <div className={cn("font-bold text-[10px] bg-gray-700 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>OR</div>
    ),
    deepinfra: (
      <div className={cn("font-bold text-[10px] bg-red-600 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>DI</div>
    ),
    'custom-llm': (
      <div className={cn("font-bold text-[10px] bg-gray-500 text-white rounded flex items-center justify-center", className?.replace('h-4 w-4', 'h-4 w-4'))}>?</div>
    ),
  }
  return <>{logos[provider] || <div className={cn("bg-gray-400 rounded", className)} />}</>
}

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
  { voiceId: "oWAxZDx7w5VEj9dCyTzz", name: "Grace", gender: "female", accent: "American", previewUrl: "https://storage.googleapis.com/eleven-public-prod/premade/voices/oWAxZDx7w5VEj9dCyTzz/84a36d1c-e182-41a8-8c55-dbdd15cd6e50.mp3" },
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
  { id: "behavior", label: "Behavior", icon: Phone },
  { id: "greeting", label: "Greeting", icon: MessageSquare },
  { id: "objectives", label: "Objectives", icon: Target },
  { id: "events", label: "Events", icon: PhoneOff },
  { id: "fallback", label: "Fallback", icon: Users },
  { id: "prompt", label: "Prompt", icon: Code },
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

// Form data type
interface AgentFormData {
  name: string
  role: string
  voiceId: string | null
  voiceSpeed: number
  model: string
  modelProvider: string
  waitForGreeting: boolean
  greeting: string
  systemPrompt: string
  specialty: AgentSpecialty
  objectives: AgentObjective[]
  practiceName: string
  practicePhone: string
  maxRetries: number
  retryDelayMinutes: number
  fallbackStaffId: string | null
  eventHandling: EventHandling
}

const getDefaultFormValues = (agent?: Agent | null): AgentFormData => ({
  name: agent?.name || "",
  role: agent?.role || "",
  voiceId: agent?.voiceId || null,
  voiceSpeed: agent?.voiceSpeed ?? 0.9,
  model: agent?.model || "gpt-4o-mini",
  modelProvider: agent?.modelProvider || "openai",
  waitForGreeting: agent?.waitForGreeting ?? true,
  greeting: agent?.greeting || "",
  systemPrompt: agent?.systemPrompt || "",
  specialty: (agent?.specialty as AgentSpecialty) || "general",
  objectives: agent?.objectives || [],
  practiceName: agent?.practiceName || "",
  practicePhone: agent?.practicePhone || "",
  maxRetries: agent?.maxRetries ?? 5,
  retryDelayMinutes: agent?.retryDelayMinutes ?? 60,
  fallbackStaffId: agent?.fallbackStaffId || null,
  eventHandling: agent?.eventHandling || DEFAULT_EVENT_HANDLING,
})

export default function SettingsPage() {
  // Agents list
  const [agents, setAgents] = useState<Agent[]>([])
  const [staffList, setStaffList] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Audio preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  // Scroll tracking
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [activeSection, setActiveSection] = useState("basic")
  const isScrollingProgrammatically = useRef(false)
  const activeSectionRef = useRef(activeSection)

  // Helper to preserve scroll position during state updates
  const preserveScroll = useCallback((fn: () => void) => {
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0
    fn()
    queueMicrotask(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollTop
      }
    })
  }, [])

  // Unsaved changes dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingAgent, setPendingAgent] = useState<Agent | null>(null)

  // React Hook Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors },
  } = useForm<AgentFormData>({
    defaultValues: getDefaultFormValues(),
  })

  // Watch form values for controlled components
  const watchedVoiceId = watch("voiceId")
  const watchedVoiceSpeed = watch("voiceSpeed")
  const watchedModelProvider = watch("modelProvider")
  const watchedObjectives = watch("objectives")
  const watchedEventHandling = watch("eventHandling")

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [aiAgents, staff] = await Promise.all([
        api.agents.aiAgents(),
        api.agents.staff(),
      ])
      setAgents(aiAgents)
      setStaffList(staff)

      // Select first agent if none selected
      if (!selectedAgent && aiAgents.length > 0) {
        setSelectedAgent(aiAgents[0])
        reset(getDefaultFormValues(aiAgents[0]))
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load agents')
    } finally {
      setIsLoading(false)
    }
  }, [selectedAgent, reset])

  useEffect(() => {
    loadData()
  }, []) // Only run on mount

  // Reset form when selected agent changes
  useEffect(() => {
    if (selectedAgent) {
      reset(getDefaultFormValues(selectedAgent))
    }
  }, [selectedAgent, reset])

  // Filter agents by search
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle agent selection with unsaved changes check
  const handleSelectAgent = (agent: Agent) => {
    if (isDirty) {
      setPendingAgent(agent)
      setShowUnsavedDialog(true)
    } else {
      setSelectedAgent(agent)
    }
  }

  // Confirm discard changes
  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false)
    if (pendingAgent) {
      setSelectedAgent(pendingAgent)
      setPendingAgent(null)
    }
  }

  // Cancel agent switch
  const handleCancelSwitch = () => {
    setShowUnsavedDialog(false)
    setPendingAgent(null)
  }

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    const container = scrollContainerRef.current
    if (element && container) {
      // Disable scroll handler during programmatic scroll
      isScrollingProgrammatically.current = true
      activeSectionRef.current = sectionId
      setActiveSection(sectionId)

      const elementTop = element.getBoundingClientRect().top
      const containerTop = container.getBoundingClientRect().top
      const offset = elementTop - containerTop
      container.scrollBy({ top: offset, behavior: "smooth" })

      // Re-enable scroll handler after animation completes
      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 600)
    }
  }

  // Keep ref in sync
  activeSectionRef.current = activeSection

  // Simple scroll spy - only update on actual user scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let ticking = false

    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return
      if (ticking) return

      ticking = true
      requestAnimationFrame(() => {
        // If at the top, always select first section
        if (container.scrollTop < 50) {
          if (activeSectionRef.current !== SECTIONS[0].id) {
            setActiveSection(SECTIONS[0].id)
          }
          ticking = false
          return
        }

        const containerTop = container.getBoundingClientRect().top

        // Find section at top of viewport
        for (let i = SECTIONS.length - 1; i >= 0; i--) {
          const section = SECTIONS[i]
          const element = sectionRefs.current[section.id]
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= containerTop + 120) {
              if (activeSectionRef.current !== section.id) {
                setActiveSection(section.id)
              }
              break
            }
          }
        }
        ticking = false
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [selectedAgent])

  // Voice preview
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

  // Objective handlers
  const handleObjectiveToggle = (objectiveId: string, checked: boolean) => {
    const currentObjectives = watchedObjectives || []
    if (checked) {
      const defaultObj = DEFAULT_OBJECTIVES[objectiveId]
      if (defaultObj) {
        setValue("objectives", [...currentObjectives, defaultObj], { shouldDirty: true })
      }
    } else {
      setValue("objectives", currentObjectives.filter((o: AgentObjective) => o.id !== objectiveId), { shouldDirty: true })
    }
  }

  const handleObjectiveRequiredToggle = (objectiveId: string, required: boolean) => {
    const currentObjectives = watchedObjectives || []
    setValue(
      "objectives",
      currentObjectives.map((o: AgentObjective) => o.id === objectiveId ? { ...o, required } : o),
      { shouldDirty: true }
    )
  }

  // Greeting template
  const handleUseGreetingTemplate = (taskType: string) => {
    const template = GREETING_TEMPLATES[taskType]
    if (template) {
      setValue("greeting", template, { shouldDirty: true })
    }
  }

  // Insert variable
  const handleInsertVariable = (varName: string, target: "greeting" | "systemPrompt") => {
    const variable = `{{${varName}}}`
    const currentValue = watch(target) || ""
    setValue(target, currentValue + variable, { shouldDirty: true })
  }

  // Update event handling
  const updateEventHandling = <K extends keyof EventHandling>(
    key: K,
    value: EventHandling[K]
  ) => {
    setValue("eventHandling", { ...watchedEventHandling, [key]: value }, { shouldDirty: true })
  }

  // Save agent
  const onSubmit = async (data: AgentFormData) => {
    if (!data.name.trim()) {
      toast.error("Please enter an agent name")
      return
    }

    setIsSaving(true)

    try {
      const agentData: Partial<Agent> = {
        name: data.name.trim(),
        role: data.role.trim() || "AI Voice Agent",
        type: "ai",
        voiceId: data.voiceId,
        voiceProvider: data.voiceId ? "11labs" : null,
        voiceSpeed: data.voiceSpeed,
        model: data.model,
        modelProvider: data.modelProvider as ModelProvider,
        waitForGreeting: data.waitForGreeting,
        greeting: data.greeting || null,
        systemPrompt: data.systemPrompt || null,
        specialty: data.specialty,
        objectives: data.objectives,
        practiceName: data.practiceName || null,
        practicePhone: data.practicePhone || null,
        maxRetries: data.maxRetries,
        retryDelayMinutes: data.retryDelayMinutes,
        fallbackStaffId: data.fallbackStaffId,
        eventHandling: data.eventHandling,
      }

      if (selectedAgent) {
        const updated = await api.agents.update(selectedAgent.id, agentData)
        setAgents(prev => prev.map(a => a.id === selectedAgent.id ? updated : a))
        setSelectedAgent(updated)
        toast.success("Agent updated successfully")
      } else {
        const created = await api.agents.create({
          ...agentData,
          id: `ai-${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        })
        setAgents(prev => [...prev, created])
        setSelectedAgent(created)
        toast.success("Agent created successfully")
      }

      reset(data) // Reset dirty state after save
    } catch (error) {
      console.error("Error saving agent:", error)
      toast.error("Failed to save agent")
    } finally {
      setIsSaving(false)
    }
  }

  // Create new agent
  const handleCreateAgent = () => {
    if (isDirty) {
      setPendingAgent(null)
      setShowUnsavedDialog(true)
    } else {
      setSelectedAgent(null)
      reset(getDefaultFormValues())
    }
  }

  // Section component - all open by default
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
    return (
      <div
        ref={(el) => { sectionRefs.current[id] = el }}
        className="border rounded-lg bg-card"
      >
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{title}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=closed]_&]:-rotate-90" />
          </CollapsibleTrigger>
          <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
            <div className="px-4 pb-4 space-y-4">{children}</div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Agent List */}
      <div className="w-72 border-r flex flex-col bg-muted/30 shrink-0">
        <div className="p-4 border-b space-y-3 flex-shrink-0">
          <Button className="w-full" onClick={handleCreateAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredAgents.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No agents found
            </div>
          ) : (
            <div className="py-2">
              {filteredAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition-colors border-l-2",
                    selectedAgent?.id === agent.id
                      ? "bg-primary/10 border-l-primary"
                      : "border-l-transparent hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.role}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Agent Configuration */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 border-b bg-background">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold">
                {selectedAgent ? selectedAgent.name : "New Agent"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {selectedAgent ? "Configure agent settings" : "Create a new AI agent"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
              <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Section Navigation - Using Tabs for accessibility */}
          <div className="px-6 pb-3">
            <Tabs value={activeSection} onValueChange={scrollToSection}>
              <TabsList className="h-auto p-1 bg-muted/50 rounded-full gap-1">
                {SECTIONS.map(section => {
                  const Icon = section.icon
                  return (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      <Icon className="h-3 w-3" />
                      {section.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
          style={{ overflowAnchor: 'auto' }}
        >
          <div className="p-6 space-y-4">
          {/* Basic Section */}
          <Section id="basic" title="Basic Information" icon={Settings}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Agent name is required" }}
                  render={({ field }) => (
                    <div>
                      <Input
                        {...field}
                        placeholder="e.g., Luna"
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., Appointment Confirmation" />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialty</Label>
              <Controller
                name="specialty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {SPECIALTIES.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="practiceName">Practice Name</Label>
                <Controller
                  name="practiceName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., Sunny Valley Medical" />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="practicePhone">Practice Phone</Label>
                <Controller
                  name="practicePhone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., (555) 123-4567" />
                  )}
                />
              </div>
            </div>

            {/* Model Configuration */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Controller
                  name="modelProvider"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        preserveScroll(() => {
                          field.onChange(value)
                          const models = MODELS_BY_PROVIDER[value]
                          if (models && models.length > 0) {
                            setValue("model", models[0].id, { shouldDirty: true })
                          }
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider">
                          {field.value && (
                            <div className="flex items-center gap-2">
                              <ProviderLogo provider={field.value} className="h-4 w-4" />
                              <span>{MODEL_PROVIDERS.find(p => p.id === field.value)?.name}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-[300px]">
                        {MODEL_PROVIDERS.map(provider => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <ProviderLogo provider={provider.id} className="h-4 w-4" />
                              <span>{provider.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Controller
                  name="model"
                  control={control}
                  render={({ field }) => {
                    const models = MODELS_BY_PROVIDER[watchedModelProvider] || []
                    const selectedModel = models.find((m: ModelInfo) => m.id === field.value)
                    return (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model">
                            {selectedModel && (
                              <div className="flex items-center gap-2">
                                <span>{selectedModel.name}</span>
                                {selectedModel.tags && selectedModel.tags.length > 0 && (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                    selectedModel.tags.includes('Latest') && "bg-blue-500/10 text-blue-600",
                                    selectedModel.tags.includes('New') && "bg-green-500/10 text-green-600",
                                    selectedModel.tags.includes('Fast') && "bg-amber-500/10 text-amber-600"
                                  )}>
                                    {selectedModel.tags[0]}
                                  </span>
                                )}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-[400px] w-[400px]">
                          {models.map((model: ModelInfo) => (
                            <SelectItem key={model.id} value={model.id} className="py-2.5">
                              <div className="flex flex-col gap-0.5 w-full">
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="font-medium text-sm">{model.name}</span>
                                  {model.latency && (
                                    <>
                                      <span className="text-muted-foreground">·</span>
                                      <span className="text-muted-foreground">{model.latency}</span>
                                    </>
                                  )}
                                  {model.price && (
                                    <>
                                      <span className="text-muted-foreground">·</span>
                                      <span className="text-muted-foreground">{model.price}</span>
                                    </>
                                  )}
                                </div>
                                {model.tags && model.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {model.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className={cn(
                                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                          tag === 'Latest' && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                                          tag === 'New' && "bg-green-500/10 text-green-600 dark:text-green-400",
                                          tag === 'Fast' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                                          tag === 'Multimodal' && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                                          tag === 'Vision' && "bg-pink-500/10 text-pink-600 dark:text-pink-400",
                                          tag === 'Standard' && "bg-gray-500/10 text-gray-600 dark:text-gray-400"
                                        )}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }}
                />
              </div>
            </div>
          </Section>

          {/* Voice Section */}
          <Section id="voice" title="Voice Configuration" icon={Mic}>
            <p className="text-sm text-muted-foreground">
              Choose an ElevenLabs voice for your agent. Click play to preview.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ELEVEN_LABS_VOICES.map(voice => (
                <div
                  key={voice.voiceId}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200",
                    watchedVoiceId === voice.voiceId
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => preserveScroll(() => setValue("voiceId", voice.voiceId, { shouldDirty: true }))}
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

            {/* Voice Speed Slider */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Voice Speed</Label>
                <span className="text-sm font-medium">{watchedVoiceSpeed?.toFixed(2) || '0.90'}x</span>
              </div>
              <Controller
                name="voiceSpeed"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={VOICE_SPEED.min}
                      max={VOICE_SPEED.max}
                      step={VOICE_SPEED.step}
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Slow (0.5x)</span>
                      <span>Normal (1.0x)</span>
                      <span>Fast (2.0x)</span>
                    </div>
                  </div>
                )}
              />
              <div className="flex gap-2 flex-wrap">
                {VOICE_SPEED_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
                      watchedVoiceSpeed === preset.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-input hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => preserveScroll(() => setValue("voiceSpeed", preset.value, { shouldDirty: true }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Call Behavior Section */}
          <Section id="behavior" title="Call Behavior" icon={Phone}>
            <p className="text-sm text-muted-foreground">
              Configure how the agent initiates and handles calls.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Wait for Patient Greeting</Label>
                  <p className="text-xs text-muted-foreground">
                    Agent will wait for the patient to say "Hello" before speaking
                  </p>
                </div>
                <Controller
                  name="waitForGreeting"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
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
            <Controller
              name="greeting"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}..."
                  rows={4}
                />
              )}
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
                      const isSelected = (watchedObjectives || []).some((o: AgentObjective) => o.id === id)
                      const selectedObj = (watchedObjectives || []).find((o: AgentObjective) => o.id === id)

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
                    value={watchedEventHandling?.voicemail?.action || "retry"}
                    onValueChange={(v) => updateEventHandling("voicemail", { ...watchedEventHandling.voicemail, action: v as EventAction })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
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
                  value={watchedEventHandling?.voicemail?.message || ""}
                  onChange={(e) => updateEventHandling("voicemail", { ...watchedEventHandling.voicemail, message: e.target.value })}
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
                    value={watchedEventHandling?.noAnswer?.action || "retry"}
                    onValueChange={(v) => updateEventHandling("noAnswer", { ...watchedEventHandling.noAnswer, action: v as EventAction })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
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
                    value={watchedEventHandling?.noAnswer?.maxAttempts || 5}
                    onChange={(e) => updateEventHandling("noAnswer", { ...watchedEventHandling.noAnswer, maxAttempts: parseInt(e.target.value) || 5 })}
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
                    value={watchedEventHandling?.busyLine?.action || "retry"}
                    onValueChange={(v) => updateEventHandling("busyLine", { ...watchedEventHandling.busyLine, action: v as EventAction })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
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
                    value={watchedEventHandling?.busyLine?.retryDelayMinutes || 30}
                    onChange={(e) => updateEventHandling("busyLine", { ...watchedEventHandling.busyLine, retryDelayMinutes: parseInt(e.target.value) || 30 })}
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
                  value={watchedEventHandling?.callDisconnected?.action || "retry"}
                  onValueChange={(v) => updateEventHandling("callDisconnected", { ...watchedEventHandling.callDisconnected, action: v as EventAction })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
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
                  value={watchedEventHandling?.abusiveLanguage?.action || "escalate"}
                  onValueChange={(v) => updateEventHandling("abusiveLanguage", { ...watchedEventHandling.abusiveLanguage, action: v as EventAction })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {EVENT_ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Closing Message</Label>
                <Textarea
                  value={watchedEventHandling?.abusiveLanguage?.message || ""}
                  onChange={(e) => updateEventHandling("abusiveLanguage", { ...watchedEventHandling.abusiveLanguage, message: e.target.value })}
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
              <Controller
                name="fallbackStaffId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fallback staff" />
                    </SelectTrigger>
                    <SelectContent position="popper">
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
                )}
              />
              <p className="text-xs text-muted-foreground">
                Staff member to escalate to when max retries are exceeded.
              </p>
            </div>

            {/* Success Criteria */}
            <div className="space-y-2">
              <Label>Success Criteria</Label>
              <div className="space-y-1">
                {(watchedEventHandling?.successCriteria || []).map((criteria: string, idx: number) => (
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
                {(watchedEventHandling?.escalationCriteria || []).map((criteria: string, idx: number) => (
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
            <Controller
              name="systemPrompt"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="You are {{agent_name}}, a professional AI assistant for {{practice_name}}..."
                  rows={12}
                  className="font-mono text-sm"
                />
              )}
            />
            <div className="flex gap-1 flex-wrap">
              {TEMPLATE_VARIABLES.map(v => (
                <Button
                  key={v.name}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => handleInsertVariable(v.name, "systemPrompt")}
                  title={v.description}
                >
                  {v.name}
                </Button>
              ))}
            </div>
          </Section>

          {/* Bottom padding to allow last section to scroll to top */}
          <div className="h-[50vh]" />
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to discard them and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSwitch}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
