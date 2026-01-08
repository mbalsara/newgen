import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Filter, RefreshCw, X, ExternalLink, Flag, Play, ChevronDown, Plus, Mic, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useTasks } from '@/contexts/tasks-context'
import { getAgent } from '@/lib/mock-agents'
import type { Task, TimelineEvent, VoiceEvent, ObjectivesEvent, NextStepsEvent } from '@/lib/task-types'
import { cn } from '@/lib/utils'

const statusBadgeStyles: Record<string, string> = {
  'in-progress': 'bg-amber-100 text-amber-700',
  scheduled: 'bg-blue-100 text-blue-700',
  escalated: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-600',
  completed: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  'in-progress': 'In Progress',
  scheduled: 'Scheduled',
  escalated: 'Escalated',
  pending: 'Pending',
  completed: 'Completed',
}

export default function QueuePage() {
  const {
    tasks,
    isPatientFlagged,
    getPatientFlag,
    markTaskDone,
    reopenTask,
    toggleNextStep,
  } = useTasks()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({})

  // Group tasks by status
  const scheduled = tasks.filter(t => t.status === 'scheduled')
  const inProgress = tasks.filter(t => t.status === 'in-progress')
  const needsAttention = tasks.filter(t => t.status === 'escalated' || t.status === 'pending')
  const completed = tasks.filter(t => t.status === 'completed')

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task)
  }

  const handleClosePanel = () => {
    setSelectedTask(null)
  }

  const toggleTranscript = (eventId: string) => {
    setExpandedTranscripts(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Queue</h1>
            <p className="text-sm text-gray-500">Manage tasks in kanban board view</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-gray-600">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-gray-600">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="grid grid-cols-4 gap-4 h-full min-h-0">
          <QueueColumn
            title="Scheduled"
            tasks={scheduled}
            color="blue"
            isPatientFlagged={isPatientFlagged}
            onSelectTask={handleSelectTask}
          />
          <QueueColumn
            title="In Progress"
            tasks={inProgress}
            color="amber"
            isPatientFlagged={isPatientFlagged}
            onSelectTask={handleSelectTask}
          />
          <QueueColumn
            title="Needs Attention"
            tasks={needsAttention}
            color="red"
            isPatientFlagged={isPatientFlagged}
            onSelectTask={handleSelectTask}
          />
          <QueueColumn
            title="Completed"
            tasks={completed}
            color="green"
            isPatientFlagged={isPatientFlagged}
            onSelectTask={handleSelectTask}
          />
        </div>
      </div>

      {/* Task Detail Slide-over Panel */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => !open && handleClosePanel()}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0 flex flex-col overflow-hidden">
          {selectedTask && (
            <TaskDetailPanel
              task={selectedTask}
              isFlagged={isPatientFlagged(selectedTask.patient.id)}
              flag={getPatientFlag(selectedTask.patient.id)}
              onMarkDone={() => { markTaskDone(selectedTask.id); handleClosePanel(); }}
              onReopen={() => reopenTask(selectedTask.id)}
              onToggleNextStep={(eventId, index) => toggleNextStep(selectedTask.id, eventId, index)}
              expandedTranscripts={expandedTranscripts}
              onToggleTranscript={toggleTranscript}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Queue Column Component
function QueueColumn({
  title,
  tasks,
  color,
  isPatientFlagged,
  onSelectTask,
}: {
  title: string
  tasks: Task[]
  color: 'blue' | 'amber' | 'red' | 'green'
  isPatientFlagged: (id: string) => boolean
  onSelectTask: (task: Task) => void
}) {
  const colorClasses = {
    blue: {
      dot: 'bg-blue-500',
      headerBg: 'bg-blue-50',
      badge: 'bg-blue-100 text-blue-700',
    },
    amber: {
      dot: 'bg-amber-500',
      headerBg: 'bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
    },
    red: {
      dot: 'bg-red-500',
      headerBg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
    },
    green: {
      dot: 'bg-green-500',
      headerBg: 'bg-green-50',
      badge: 'bg-green-100 text-green-700',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className="flex flex-col bg-gray-100 rounded-lg overflow-hidden min-h-0">
      {/* Column Header */}
      <div className={cn('flex items-center gap-2 px-3 py-3', colors.headerBg)}>
        <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
        <span className="font-medium text-sm text-gray-900">{title}</span>
        <Badge className={cn('ml-auto text-xs font-medium', colors.badge)}>
          {tasks.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tasks.map(task => (
          <QueueCard
            key={task.id}
            task={task}
            flagged={isPatientFlagged(task.patient.id)}
            onSelect={() => onSelectTask(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">No tasks</div>
        )}
      </div>
    </div>
  )
}

// Queue Card Component
function QueueCard({
  task,
  flagged,
  onSelect,
}: {
  task: Task
  flagged: boolean
  onSelect: () => void
}) {
  const agent = getAgent(task.assignedAgent)

  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all"
    >
      {/* Patient name row */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-gray-900 truncate">{task.patient.name}</span>
        {flagged && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
        {task.unread && (
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white hover:bg-blue-500 shrink-0">
            NEW
          </Badge>
        )}
      </div>

      {/* Agent and time row */}
      <div className="flex items-center gap-2 mt-2">
        {agent && (
          <div className={cn(
            'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium',
            agent.type === 'ai' ? 'bg-gray-900 text-white' : 'bg-amber-100 text-amber-700'
          )}>
            {agent.type === 'ai' ? '🤖' : agent.avatar}
          </div>
        )}
        <span className="text-xs text-gray-500">{task.time}</span>
        {task.status === 'completed' && task.ehrSync.status === 'synced' && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-green-600 border-green-300 gap-0.5 ml-auto">
            <Check className="h-2.5 w-2.5" />
            Synced
          </Badge>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mt-2 truncate">{task.description}</p>
      <p className="text-xs text-gray-400 truncate">{task.provider}</p>
    </button>
  )
}

// Task Detail Panel for Slide-over
function TaskDetailPanel({
  task,
  isFlagged,
  flag,
  onMarkDone,
  onReopen,
  onToggleNextStep,
  expandedTranscripts,
  onToggleTranscript,
}: {
  task: Task
  isFlagged: boolean
  flag: any
  onMarkDone: () => void
  onReopen: () => void
  onToggleNextStep: (eventId: string, index: number) => void
  expandedTranscripts: Record<string, boolean>
  onToggleTranscript: (eventId: string) => void
}) {
  const initials = task.patient.name.split(' ').map(n => n[0]).join('')

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Flag Warning Banner - Fixed at top */}
      {isFlagged && flag && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-700 flex-1">
            <span className="font-medium">Abusive Language</span> - {flag.notes}
          </span>
        </div>
      )}

      {/* Header - Fixed */}
      <div className="bg-white border-b border-gray-200 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium',
              isFlagged ? 'bg-red-100 ring-2 ring-red-300 text-red-700' : 'bg-gray-100 text-gray-600'
            )}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-900">{task.patient.name}</h2>
                <Link
                  to={`/patient/${task.patient.id}`}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 hover:underline"
                >
                  Open Chart <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-xs text-gray-500">
                {task.patient.phone} • DOB: {task.patient.dob} • {task.patient.id}
              </p>
            </div>
          </div>
          <span className={cn('px-2 py-1 rounded text-xs font-medium', statusBadgeStyles[task.status])}>
            {statusLabels[task.status]}
          </span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-5">
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200" />
            <div className="space-y-4">
              {task.timeline.map(event => (
                <TimelineEventItem
                  key={event.id}
                  event={event}
                  isExpanded={expandedTranscripts[event.id]}
                  onToggleTranscript={() => onToggleTranscript(event.id)}
                  onToggleNextStep={(index) => onToggleNextStep(event.id, index)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-5 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Add Note</Button>
            {!isFlagged && (
              <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                <Flag className="w-4 h-4 mr-1" /> Flag Patient
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {task.status !== 'completed' ? (
              <>
                <Button variant="outline" size="sm" className="text-amber-600 border-amber-400 hover:bg-amber-50">
                  Escalate
                </Button>
                <Button size="sm" onClick={onMarkDone}>
                  <Check className="w-4 h-4 mr-1" /> Mark Done
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={onReopen}>
                Reopen Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Timeline Event Item
function TimelineEventItem({ event, isExpanded, onToggleTranscript, onToggleNextStep }: {
  event: TimelineEvent
  isExpanded?: boolean
  onToggleTranscript: () => void
  onToggleNextStep: (index: number) => void
}) {
  const iconConfig: Record<string, { icon: React.ElementType; bg: string; text: string }> = {
    created: { icon: Plus, bg: 'bg-gray-100', text: 'text-gray-600' },
    voice: { icon: Mic, bg: 'bg-gray-900', text: 'text-white' },
    scheduled: { icon: Plus, bg: 'bg-blue-100', text: 'text-blue-600' },
    escalated: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600' },
    completed: { icon: Check, bg: 'bg-green-100', text: 'text-green-600' },
    'next-steps': { icon: ArrowRight, bg: 'bg-gray-100', text: 'text-gray-600' },
    objectives: { icon: Plus, bg: 'bg-violet-100', text: 'text-violet-600' },
    balance: { icon: Plus, bg: 'bg-red-100', text: 'text-red-600' },
    flag: { icon: Flag, bg: 'bg-red-500', text: 'text-white' },
  }

  const config = iconConfig[event.type] || iconConfig.created
  const Icon = config.icon

  return (
    <div className="relative pl-8">
      <div className={cn('absolute left-0 w-6 h-6 rounded-full flex items-center justify-center', config.bg, config.text)}>
        <Icon className="w-3 h-3" />
      </div>

      {event.type === 'created' && (
        <div className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{event.title}</span>
            <span className="text-xs text-gray-400">{event.timestamp}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{(event as any).description}</p>
        </div>
      )}

      {event.type === 'voice' && (
        <VoiceEventCard event={event as VoiceEvent} isExpanded={isExpanded} onToggle={onToggleTranscript} />
      )}

      {event.type === 'objectives' && (
        <ObjectivesCard event={event as ObjectivesEvent} />
      )}

      {event.type === 'next-steps' && (
        <NextStepsCard event={event as NextStepsEvent} onToggle={onToggleNextStep} />
      )}

      {event.type === 'completed' && (
        <div className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-700">{event.title}</span>
            <span className="text-xs text-gray-400">{event.timestamp}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{(event as any).description}</p>
        </div>
      )}

      {event.type === 'escalated' && (
        <div className="pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-700">{event.title}</span>
            <span className="text-xs text-gray-400">{event.timestamp}</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Assigned to: {(event as any).assignedTo}</p>
          <p className="text-xs text-gray-500">Reason: {(event as any).reason}</p>
        </div>
      )}
    </div>
  )
}

// Voice Event Card
function VoiceEventCard({ event, isExpanded, onToggle }: { event: VoiceEvent; isExpanded?: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{event.title}</span>
          <span className="text-xs text-gray-500">{event.duration}</span>
        </div>
        <span className="text-xs text-gray-400">{event.timestamp}</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{event.summary}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="default" className="gap-1">
          <Play className="w-3 h-3" /> Play
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggle} className="gap-1">
          <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          {isExpanded ? 'Hide' : 'View'} Transcript
        </Button>
      </div>
      {isExpanded && event.transcript && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {event.transcript.map((msg, i) => (
            <div key={i} className={cn('text-sm', msg.speaker === 'ai' ? 'text-gray-600' : 'text-blue-600')}>
              <span className="font-medium">{msg.speaker === 'ai' ? 'AI:' : 'Patient:'}</span> {msg.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Objectives Card
function ObjectivesCard({ event }: { event: ObjectivesEvent }) {
  const confirmed = event.items.filter(i => i.status === 'confirmed').length
  const needsAttention = event.items.filter(i => i.status === 'needs-attention').length

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{event.title}</span>
          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">{confirmed} Confirmed</span>
          {needsAttention > 0 && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">{needsAttention} Needs Attention</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{event.timestamp}</span>
      </div>
      <div className="space-y-3">
        {event.items.map((item, i) => (
          <div key={i} className={cn('border-l-2 pl-3 py-1', item.status === 'confirmed' ? 'border-green-500' : 'border-red-500')}>
            <div className="flex items-center gap-2">
              {item.status === 'confirmed' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-gray-700">{item.text}</span>
            </div>
            <div className={cn('mt-1 text-xs px-2 py-1 rounded', item.status === 'confirmed' ? 'bg-green-50' : 'bg-red-50')}>
              <span className={cn('font-medium', item.status === 'confirmed' ? 'text-green-700' : 'text-red-700')}>PATIENT RESPONSE</span>
              <p className={item.status === 'confirmed' ? 'text-green-600' : 'text-red-600'}>"{item.patientResponse}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Next Steps Card
function NextStepsCard({ event, onToggle }: { event: NextStepsEvent; onToggle: (index: number) => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">{event.title}</span>
        <span className="text-xs text-gray-400">{event.timestamp}</span>
      </div>
      <div className="space-y-2">
        {event.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <Checkbox
              checked={item.done}
              onCheckedChange={() => onToggle(i)}
              className="h-5 w-5"
            />
            <span className={cn('text-sm', item.done && 'line-through text-gray-400')}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
