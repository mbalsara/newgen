"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useForm, Controller } from 'react-hook-form'
import { api, type Agent } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { CallingHoursGrid } from '@/components/agents/CallingHoursGrid'
import { OfficeHoursEditor } from '@/components/agents/OfficeHoursEditor'
import { TransferTriggers } from '@/components/agents/TransferTriggers'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  Phone,
  Loader2,
  Settings,
  Mic,
  MessageSquare,
  PhoneOff,
  Voicemail,
  PhoneCall,
  AlertTriangle,
  Flag,
  PhoneForwarded,
  MessageCircle,
  Code,
  Play,
  Square,
  Bot,
} from 'lucide-react'
import {
  MODEL_PROVIDERS,
  MODELS_BY_PROVIDER,
  VOICE_SPEED,
  VOICE_SPEED_PRESETS,
  getDefaultAgentSettings,
  type AgentSettings,
} from '@repo/types'
import type { ModelInfo } from '@repo/types'

// Provider logo component
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
      <div className={cn("font-bold text-[10px] bg-orange-500 text-white rounded flex items-center justify-center", className)}>G</div>
    ),
    xai: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.047 0L10.308 12 2.047 24H5.323L12 14.988 18.677 24h3.276L13.692 12 21.953 0h-3.276L12 9.012 5.323 0z"/>
      </svg>
    ),
  }
  return <>{logos[provider] || <div className={cn("bg-gray-400 rounded", className)} />}</>
}

// ElevenLabs voices
const ELEVEN_LABS_VOICES = [
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", gender: "female", accent: "American" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", gender: "female", accent: "American" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Bella", gender: "female", accent: "American" },
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male", accent: "American" },
  { voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", gender: "male", accent: "American" },
  { voiceId: "oWAxZDx7w5VEj9dCyTzz", name: "Grace", gender: "female", accent: "American" },
]

const SPECIALTIES = [
  { value: "general", label: "General Practice" },
  { value: "cardiology", label: "Cardiology" },
  { value: "dental", label: "Dental" },
  { value: "dermatology", label: "Dermatology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "ophthalmology", label: "Ophthalmology" },
  { value: "orthopedics", label: "Orthopedics" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "pulmonology", label: "Pulmonology" },
  { value: "surgery", label: "Surgery" },
]

// Sidebar sections configuration
const SIDEBAR_SECTIONS = [
  {
    group: 'GENERAL',
    items: [
      { id: 'basic', label: 'Basic Info', icon: Settings },
      { id: 'voice', label: 'Voice', icon: Mic },
    ],
  },
  {
    group: 'CALL FLOW',
    items: [
      { id: 'prompt', label: 'Prompt', icon: Code },
      { id: 'unanswered', label: 'Unanswered Calls', icon: PhoneOff },
      { id: 'voicemail', label: 'Voicemail', icon: Voicemail },
      { id: 'callbacks', label: 'Callbacks', icon: PhoneCall },
    ],
  },
  {
    group: 'EDGE CASES',
    items: [
      { id: 'interruptions', label: 'Interruptions', icon: AlertTriangle },
      { id: 'flags', label: 'Flags & Escalation', icon: Flag },
      { id: 'transfer', label: 'Transfer to Human', icon: PhoneForwarded },
    ],
  },
  {
    group: 'AFTER CALL',
    items: [
      { id: 'sms', label: 'SMS Follow-up', icon: MessageCircle },
    ],
  },
]

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNewAgent = id === 'new'

  const [agent, setAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(!isNewAgent)
  const [isSaving, setIsSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('basic')

  // Scroll tracking
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isScrollingProgrammatically = useRef(false)

  // Audio preview
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

  // Form
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<AgentSettings>({
    defaultValues: getDefaultAgentSettings(),
  })

  const watchedVoiceId = watch('voiceId')
  const watchedVoiceSpeed = watch('voiceSpeed')
  const watchedModelProvider = watch('modelProvider')

  // Load agent
  useEffect(() => {
    if (!isNewAgent && id) {
      setIsLoading(true)
      api.agents
        .getById(id)
        .then((data: Agent) => {
          setAgent(data)
          // Map agent to settings form
          reset({
            name: data.name || '',
            description: data.role || '',
            status: 'active',
            specialty: data.specialty || 'general',
            voiceId: data.voiceId || undefined,
            voiceProvider: data.voiceProvider || '11labs',
            voiceSpeed: data.voiceSpeed || 0.9,
            language: 'en-US',
            model: data.model || 'gpt-4o-mini',
            modelProvider: data.modelProvider || 'openai',
            waitForGreeting: data.waitForGreeting ?? true,
            greeting: data.greeting || undefined,
            systemPrompt: data.systemPrompt || undefined,
            practiceName: data.practiceName || undefined,
            practicePhone: data.practicePhone || undefined,
            unansweredCalls: {
              maxAttempts: data.maxRetries || 5,
              timeBetweenAttempts: { value: Math.floor((data.retryDelayMinutes || 60) / 60), unit: 'hours' },
              varyCallTimes: false,
              allowedCallingHours: [],
              afterAllAttemptsFail: 'do_nothing',
            },
            voicemail: {
              whenToLeave: 'final_attempt_only',
              script: data.eventHandling?.voicemail?.message || '',
            },
            callbacks: {
              responseScript: '',
              schedulingBehavior: 'ask_and_schedule',
              defaultCallbackDelay: { value: 2, unit: 'hours' },
            },
            interruptions: {
              handleWrongPerson: true,
              handleHangupMidCall: true,
              handlePoorAudio: true,
              handleConfusedFrustrated: true,
              handleUnrelatedQuestions: true,
              handleLanguageBarrier: false,
            },
            flagsAndEscalation: {
              autoFlagRules: [],
              urgentNotification: { email: false, sms: false, inApp: true, recipients: [] },
              standardNotification: { email: false, sms: false, inApp: true, recipients: [] },
            },
            transfer: {
              triggers: [],
              outsideOfficeHours: 'leave_voicemail',
            },
            smsFollowup: {
              sendAppointmentReminder: false,
              sendIntakeSummary: false,
              sendPaymentLink: false,
              sendFormLinkIfIncomplete: false,
            },
            promptSource: 'manual',
            questions: [],
          })
        })
        .catch((err: unknown) => {
          console.error('Failed to load agent:', err)
          toast.error('Failed to load agent')
          navigate('/agents')
        })
        .finally(() => setIsLoading(false))
    }
  }, [id, isNewAgent, reset, navigate])

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = sectionRefs.current[sectionId]
    const container = scrollContainerRef.current
    if (element && container) {
      isScrollingProgrammatically.current = true
      setActiveSection(sectionId)

      const elementTop = element.getBoundingClientRect().top
      const containerTop = container.getBoundingClientRect().top
      const offset = elementTop - containerTop
      container.scrollBy({ top: offset - 20, behavior: 'smooth' })

      setTimeout(() => {
        isScrollingProgrammatically.current = false
      }, 600)
    }
  }, [])

  // Scroll spy
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return

      const containerTop = container.getBoundingClientRect().top
      const allSectionIds = SIDEBAR_SECTIONS.flatMap((g) => g.items.map((i) => i.id))

      for (let i = allSectionIds.length - 1; i >= 0; i--) {
        const sectionId = allSectionIds[i]
        const element = sectionRefs.current[sectionId]
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= containerTop + 100) {
            setActiveSection(sectionId)
            break
          }
        }
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Voice preview
  const handlePlayVoice = (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      audioRef.current?.pause()
      audioRef.current = null
      setPlayingVoiceId(null)
      return
    }
    setPlayingVoiceId(voiceId)
    // In production, this would play the actual voice sample
    setTimeout(() => setPlayingVoiceId(null), 2000)
  }

  // Save
  const onSubmit = async (data: AgentSettings) => {
    setIsSaving(true)
    try {
      const agentData: Partial<Agent> = {
        name: data.name,
        role: data.description || 'AI Voice Agent',
        type: 'ai',
        voiceId: data.voiceId || null,
        voiceProvider: data.voiceProvider || '11labs',
        voiceSpeed: data.voiceSpeed,
        model: data.model,
        modelProvider: data.modelProvider as any,
        waitForGreeting: data.waitForGreeting,
        greeting: data.greeting || null,
        systemPrompt: data.systemPrompt || null,
        specialty: data.specialty as any,
        practiceName: data.practiceName || null,
        practicePhone: data.practicePhone || null,
        maxRetries: data.unansweredCalls.maxAttempts,
        retryDelayMinutes: data.unansweredCalls.timeBetweenAttempts.value * (data.unansweredCalls.timeBetweenAttempts.unit === 'hours' ? 60 : 1440),
      }

      if (isNewAgent) {
        const created = await api.agents.create({
          ...agentData,
          id: `ai-${data.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        } as any)
        toast.success('Agent created')
        navigate(`/agents/${created.id}`)
      } else if (agent) {
        const updated = await api.agents.update(agent.id, agentData)
        setAgent(updated)
        reset(data)
        toast.success('Agent saved')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save agent')
    } finally {
      setIsSaving(false)
    }
  }

  // Section component
  const Section = ({
    id,
    title,
    description,
    children,
  }: {
    id: string
    title: string
    description?: string
    children: React.ReactNode
  }) => (
    <div
      ref={(el) => { sectionRefs.current[id] = el }}
      className="pb-8"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/agents')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  {isNewAgent ? 'New Agent' : agent?.name || 'Agent'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isNewAgent ? 'Create a new AI agent' : 'Configure agent settings'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Test Call
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <div className="w-56 border-r bg-muted/30 shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {SIDEBAR_SECTIONS.map((group) => (
              <div key={group.group}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                          activeSection === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6 space-y-6">
            {/* Basic Info */}
            <Section id="basic" title="Basic Information" description="Core agent identity and configuration">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g., Sarah" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Role / Description</Label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g., Pre-Visit Intake" />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Controller
                    name="specialty"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALTIES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Model Provider</Label>
                  <Controller
                    name="modelProvider"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v)
                          const models = MODELS_BY_PROVIDER[v]
                          if (models?.[0]) {
                            setValue('model', models[0].id)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {field.value && (
                              <div className="flex items-center gap-2">
                                <ProviderLogo provider={field.value} className="h-4 w-4" />
                                {MODEL_PROVIDERS.find((p) => p.id === field.value)?.name}
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {MODEL_PROVIDERS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <ProviderLogo provider={p.id} className="h-4 w-4" />
                                {p.name}
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
                      return (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((m: ModelInfo) => (
                              <SelectItem key={m.id} value={m.id}>
                                <div className="flex items-center gap-2">
                                  <span>{m.name}</span>
                                  {m.latency && (
                                    <span className="text-xs text-muted-foreground">
                                      {m.latency}
                                    </span>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Practice Name</Label>
                  <Controller
                    name="practiceName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g., Sunny Valley Medical" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Practice Phone</Label>
                  <Controller
                    name="practicePhone"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="e.g., (555) 123-4567" />
                    )}
                  />
                </div>
              </div>
            </Section>

            {/* Voice */}
            <Section id="voice" title="Voice Configuration" description="Choose the voice and speech settings">
              <div className="grid grid-cols-2 gap-2">
                {ELEVEN_LABS_VOICES.map((voice) => (
                  <div
                    key={voice.voiceId}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                      watchedVoiceId === voice.voiceId
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => setValue('voiceId', voice.voiceId, { shouldDirty: true })}
                  >
                    <div>
                      <p className="font-medium text-sm">{voice.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {voice.gender} · {voice.accent}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayVoice(voice.voiceId)
                      }}
                    >
                      {playingVoiceId === voice.voiceId ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Voice Speed</Label>
                  <span className="text-sm font-medium">{watchedVoiceSpeed?.toFixed(2)}x</span>
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
                        className="w-full"
                      />
                      <div className="flex gap-2 flex-wrap">
                        {VOICE_SPEED_PRESETS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            className={cn(
                              'px-3 py-1.5 text-xs font-medium rounded-md border',
                              field.value === preset.value
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            )}
                            onClick={() => field.onChange(preset.value)}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                />
              </div>
            </Section>

            {/* Prompt */}
            <Section id="prompt" title="Prompt Builder" description="Configure the agent's conversation script">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <Label>Wait for Patient Greeting</Label>
                  <p className="text-xs text-muted-foreground">
                    Agent waits for patient to say "Hello" before speaking
                  </p>
                </div>
                <Controller
                  name="waitForGreeting"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Opening Greeting</Label>
                <Controller
                  name="greeting"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Hi {{patient_name}}, this is {{agent_name}} from {{practice_name}}..."
                      rows={3}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>System Prompt</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/agents/${id}/prompt-builder`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Open Prompt Builder
                  </Button>
                </div>
                <Controller
                  name="systemPrompt"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="You are {{agent_name}}, a professional AI assistant..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                  )}
                />
              </div>
            </Section>

            {/* Unanswered Calls */}
            <Section id="unanswered" title="Unanswered Calls" description="Configure retry behavior when calls aren't answered">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Maximum Attempts</Label>
                  <Controller
                    name="unansweredCalls.maxAttempts"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time Between Attempts</Label>
                  <div className="flex gap-2">
                    <Controller
                      name="unansweredCalls.timeBetweenAttempts.value"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={1}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          className="w-20"
                        />
                      )}
                    />
                    <Controller
                      name="unansweredCalls.timeBetweenAttempts.unit"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <Label>Vary Call Times</Label>
                  <p className="text-xs text-muted-foreground">
                    Vary timing between attempts to improve answer rates
                  </p>
                </div>
                <Controller
                  name="unansweredCalls.varyCallTimes"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Allowed Calling Hours</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select which hours are allowed for making calls
                </p>
                <Controller
                  name="unansweredCalls.allowedCallingHours"
                  control={control}
                  render={({ field }) => (
                    <CallingHoursGrid value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>After All Attempts Fail</Label>
                <Controller
                  name="unansweredCalls.afterAllAttemptsFail"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_sms_form">Send SMS with form link</SelectItem>
                        <SelectItem value="mark_unreachable">Mark as unreachable</SelectItem>
                        <SelectItem value="do_nothing">Do nothing</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </Section>

            {/* Voicemail */}
            <Section id="voicemail" title="Voicemail" description="Configure voicemail behavior">
              <div className="space-y-2">
                <Label>When to Leave Voicemail</Label>
                <Controller
                  name="voicemail.whenToLeave"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="final_attempt_only">Final attempt only</SelectItem>
                        <SelectItem value="every_attempt">Every attempt</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Voicemail Script</Label>
                <Controller
                  name="voicemail.script"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Hi, this is {{agent_name}} calling from {{practice_name}}..."
                      rows={4}
                    />
                  )}
                />
              </div>
            </Section>

            {/* Callbacks */}
            <Section id="callbacks" title="Callbacks" description="Handle callback requests from patients">
              <div className="space-y-2">
                <Label>Response Script</Label>
                <Controller
                  name="callbacks.responseScript"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Of course, I can help schedule a callback..."
                      rows={3}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Scheduling Behavior</Label>
                <Controller
                  name="callbacks.schedulingBehavior"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ask_and_schedule">Ask preferred time and schedule</SelectItem>
                        <SelectItem value="offer_slots">Offer available time slots</SelectItem>
                        <SelectItem value="flag_for_manual">Flag for manual follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </Section>

            {/* Interruptions */}
            <Section id="interruptions" title="Interruptions" description="Handle unexpected situations during calls">
              {[
                { name: 'handleWrongPerson', label: 'Wrong Person', desc: 'Handle when someone else answers' },
                { name: 'handleHangupMidCall', label: 'Hang Up Mid-Call', desc: 'Handle unexpected disconnections' },
                { name: 'handlePoorAudio', label: 'Poor Audio Quality', desc: 'Handle audio issues' },
                { name: 'handleConfusedFrustrated', label: 'Confused/Frustrated Patient', desc: 'De-escalation handling' },
                { name: 'handleUnrelatedQuestions', label: 'Unrelated Questions', desc: 'Stay on topic or redirect' },
                { name: 'handleLanguageBarrier', label: 'Language Barrier', desc: 'Handle non-English speakers' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Controller
                    name={`interruptions.${item.name}` as any}
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              ))}
            </Section>

            {/* Flags & Escalation */}
            <Section id="flags" title="Flags & Escalation" description="Auto-flag conditions and notifications">
              <div className="p-4 rounded-lg border bg-muted/30 text-center text-muted-foreground">
                <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Auto-flag rules coming soon</p>
                <p className="text-xs">Configure automatic flagging based on call content</p>
              </div>
            </Section>

            {/* Transfer to Human */}
            <Section id="transfer" title="Transfer to Human" description="Configure when and how to transfer calls">
              <Controller
                name="transfer.triggers"
                control={control}
                render={({ field: triggersField }) => (
                  <Controller
                    name="transfer.duringOfficeHours"
                    control={control}
                    render={({ field: destField }) => (
                      <TransferTriggers
                        triggers={triggersField.value}
                        destination={destField.value}
                        onTriggersChange={triggersField.onChange}
                        onDestinationChange={destField.onChange}
                      />
                    )}
                  />
                )}
              />

              <Separator className="my-6" />

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Office Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure when live transfers are available
                  </p>
                </div>
                <Controller
                  name="transfer.officeHours"
                  control={control}
                  render={({ field }) => (
                    <OfficeHoursEditor value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <Label>Outside Office Hours Action</Label>
                <Controller
                  name="transfer.outsideOfficeHours"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leave_voicemail">Leave voicemail</SelectItem>
                        <SelectItem value="offer_callback">Offer callback</SelectItem>
                        <SelectItem value="send_sms">Send SMS</SelectItem>
                        <SelectItem value="end_call">End call gracefully</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </Section>

            {/* SMS Follow-up */}
            <Section id="sms" title="SMS Follow-up" description="Automated SMS after calls">
              {[
                { name: 'sendAppointmentReminder', label: 'Send Appointment Reminder', desc: 'Text reminder with appointment details' },
                { name: 'sendIntakeSummary', label: 'Send Intake Summary', desc: 'Summary of collected information' },
                { name: 'sendPaymentLink', label: 'Send Payment Link', desc: 'Link to make payments' },
                { name: 'sendFormLinkIfIncomplete', label: 'Send Form Link if Incomplete', desc: 'Link to complete unfinished forms' },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <Label>{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Controller
                    name={`smsFollowup.${item.name}` as any}
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              ))}
            </Section>

            {/* Bottom padding */}
            <div className="h-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
