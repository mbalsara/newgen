import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, RefreshCw, Filter, ExternalLink, Check, Flag, Play, ChevronDown, Plus, Mic, AlertTriangle, ArrowRight, X } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useTasks } from '@/contexts/tasks-context'
import { getAgent, aiAgents, staffMembers } from '@/lib/mock-agents'
import { cn } from '@/lib/utils'
import type { Task, TimelineEvent, VoiceEvent, ObjectivesEvent, NextStepsEvent } from '@/lib/task-types'

// Status colors
const statusColors: Record<string, string> = {
  'in-progress': 'bg-amber-500',
  scheduled: 'bg-blue-500',
  escalated: 'bg-red-500',
  pending: 'bg-gray-400',
  completed: 'bg-green-500',
}

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

export default function TasksPage() {
  const location = useLocation()
  const {
    tasks,
    filters,
    setFilters,
    getFilteredTasks,
    selectedTaskId,
    selectTask,
    refresh,
    refreshing,
    isPatientFlagged,
    getPatientFlag,
    assignTask,
    markTaskDone,
    reopenTask,
    toggleNextStep,
  } = useTasks()

  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({})
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)

  // Handle navigation from Queue page with task ID in state
  useEffect(() => {
    const state = location.state as { taskId?: number } | null
    if (state?.taskId) {
      selectTask(state.taskId)
      // Clear the state to prevent re-selecting on subsequent renders
      window.history.replaceState({}, document.title)
    }
  }, [location.state, selectTask])

  const filteredTasks = getFilteredTasks()
  // Look for selected task in all tasks first (for Queue navigation), then in filtered tasks
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || filteredTasks.find(t => t.id === selectedTaskId) || filteredTasks[0]

  const toggleTranscript = (eventId: string) => {
    setExpandedTranscripts(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left Sidebar - Task List */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Search Header - matches right panel header height */}
        <div className="px-3 py-[13px] border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search patients..."
                value={filters.search}
                onChange={e => setFilters({ search: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
            <button
              onClick={refresh}
              className={cn('p-1.5 hover:bg-gray-100 rounded-lg text-gray-500', refreshing && 'animate-spin')}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-100">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                isFlagged={isPatientFlagged(task.patient.id)}
                onClick={() => selectTask(task.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Right Panel - Task Detail */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedTask ? (
          <TaskDetail
            task={selectedTask}
            isFlagged={isPatientFlagged(selectedTask.patient.id)}
            flag={getPatientFlag(selectedTask.patient.id)}
            onAssign={(agentId) => assignTask(selectedTask.id, agentId)}
            onMarkDone={() => markTaskDone(selectedTask.id)}
            onReopen={() => reopenTask(selectedTask.id)}
            onToggleNextStep={(eventId, index) => toggleNextStep(selectedTask.id, eventId, index)}
            expandedTranscripts={expandedTranscripts}
            onToggleTranscript={toggleTranscript}
            showAssignDropdown={showAssignDropdown}
            setShowAssignDropdown={setShowAssignDropdown}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a task to view details
          </div>
        )}
      </main>
    </div>
  )
}

// Task Card Component
function TaskCard({ task, isSelected, isFlagged, onClick }: {
  task: Task
  isSelected: boolean
  isFlagged: boolean
  onClick: () => void
}) {
  const agent = getAgent(task.assignedAgent)

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-3 py-2.5 cursor-pointer transition-colors relative',
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50',
        // Left border indicator for selected state only
        'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:transition-colors',
        isSelected ? 'before:bg-blue-500' : 'before:bg-transparent'
      )}
    >
      {/* Row 1: Name + badges + agent + time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusColors[task.status])} />
          <span className="font-medium text-sm text-gray-900 truncate">{task.patient.name}</span>
          {isFlagged && (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" fill="currentColor" />
          )}
          {task.unread && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium shrink-0">NEW</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.ehrSync.status === 'synced' && <Check className="w-3.5 h-3.5 text-green-500" />}
          {task.ehrSync.status === 'pending' && <RefreshCw className="w-3.5 h-3.5 text-orange-500" />}
          {task.ehrSync.status === 'failed' && <X className="w-3.5 h-3.5 text-red-500" />}
          {agent?.type === 'ai' ? (
            <span className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-[10px]">🤖</span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-medium text-amber-700">
              {agent?.avatar || 'ST'}
            </span>
          )}
          <span className="text-[11px] text-gray-400">{task.time}</span>
        </div>
      </div>
      {/* Row 2: Description + Provider */}
      <div className="mt-1 ml-3.5">
        <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
        <span className="text-[11px] text-gray-400">{task.provider}</span>
      </div>
    </div>
  )
}

// Task Detail Component
function TaskDetail({ task, isFlagged, flag, onAssign, onMarkDone, onReopen, onToggleNextStep, expandedTranscripts, onToggleTranscript, showAssignDropdown, setShowAssignDropdown }: {
  task: Task
  isFlagged: boolean
  flag: any
  onAssign: (agentId: string) => void
  onMarkDone: () => void
  onReopen: () => void
  onToggleNextStep: (eventId: string, index: number) => void
  expandedTranscripts: Record<string, boolean>
  onToggleTranscript: (eventId: string) => void
  showAssignDropdown: boolean
  setShowAssignDropdown: (show: boolean) => void
}) {
  const agent = getAgent(task.assignedAgent)
  const initials = task.patient.name.split(' ').map(n => n[0]).join('')

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Flag Warning Banner */}
        {isFlagged && flag && (
          <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="text-sm text-red-700 flex-1">
              <span className="font-medium">Abusive Language</span> - {flag.notes}
            </span>
          </div>
        )}

        {/* Patient Header - matches left panel header height */}
        <div className="bg-white border-b border-gray-200 px-5 py-[13px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium',
                isFlagged ? 'bg-red-100 ring-2 ring-red-300 text-red-700' : 'bg-gray-100 text-gray-600'
              )}>
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">{task.patient.name}</h2>
                  {task.unread && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-medium">NEW</span>
                  )}
                  <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 hover:underline">
                    Open Chart <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {task.patient.phone} • DOB: {task.patient.dob} • {task.patient.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', statusBadgeStyles[task.status])}>
                {statusLabels[task.status]}
              </span>
              {task.ehrSync.status === 'synced' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium border border-green-300 text-green-700 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Synced
                </span>
              )}
              {task.ehrSync.status === 'pending' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium border border-orange-300 text-orange-700 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Pending
                </span>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  {agent?.type === 'ai' ? (
                    <span className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-[10px]">🤖</span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-medium text-amber-700">
                      {agent?.avatar || 'ST'}
                    </span>
                  )}
                  <span className="text-xs font-medium text-gray-700">{agent?.name || 'Unassigned'}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showAssignDropdown && (
                  <AgentDropdown
                    currentAgentId={task.assignedAgent}
                    onSelect={(id) => { onAssign(id); setShowAssignDropdown(false) }}
                    onClose={() => setShowAssignDropdown(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5">
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
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Add Note
          </button>
          {!isFlagged && (
            <button className="px-3 py-1.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-1.5">
              <Flag className="w-4 h-4" />
              Flag Patient
            </button>
          )}
          {task.status !== 'completed' && (
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              Schedule Call
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.status !== 'completed' ? (
            <>
              <button className="px-4 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">
                Escalate
              </button>
              <button
                onClick={onMarkDone}
                className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Mark Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onReopen}
                className="px-4 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Reopen
              </button>
              <span className="px-4 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Completed
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Agent Dropdown
function AgentDropdown({ currentAgentId, onSelect, onClose }: {
  currentAgentId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-80 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">AI Agents</div>
        {aiAgents.map(a => (
          <button
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={cn('w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50', currentAgentId === a.id && 'bg-violet-50')}
          >
            <span className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center text-xs">🤖</span>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{a.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{a.role}</p>
            </div>
            {currentAgentId === a.id && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
          </button>
        ))}
        <div className="px-3 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">Staff</div>
        {staffMembers.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn('w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50', currentAgentId === s.id && 'bg-amber-50')}
          >
            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-medium text-amber-700">{s.avatar}</span>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{s.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{s.role}</p>
            </div>
            {currentAgentId === s.id && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
          </button>
        ))}
      </div>
    </>
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
          <p className="text-sm text-gray-600 mt-0.5">{(event as any).description}</p>
        </div>
      )}

      {event.type === 'voice' && (
        <VoiceEventCard event={event as VoiceEvent} isExpanded={isExpanded} onToggle={onToggleTranscript} />
      )}

      {event.type === 'flag' && (
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-800">{event.title}</span>
            <span className="text-xs text-red-600">{event.timestamp}</span>
          </div>
          <p className="text-sm text-red-700 font-medium mt-1">{(event as any).reason}</p>
          <p className="text-xs text-red-600 mt-1">{(event as any).notes}</p>
          <p className="text-[10px] text-red-500 mt-2">Flagged by {(event as any).flaggedBy}</p>
        </div>
      )}

      {event.type === 'escalated' && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-800">{event.title}</span>
            <span className="text-xs text-amber-600">{event.timestamp}</span>
          </div>
          <p className="text-sm text-amber-700 mt-1">Assigned to {(event as any).assignedTo}</p>
        </div>
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
          <p className="text-sm text-gray-600 mt-0.5">{(event as any).description}</p>
        </div>
      )}
    </div>
  )
}

// Voice Event Card
function VoiceEventCard({ event, isExpanded, onToggle }: { event: VoiceEvent; isExpanded?: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{event.title}</span>
          <span className="text-sm text-gray-400">{event.duration}</span>
          {event.status === 'escalated' && (
            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">Escalated</span>
          )}
        </div>
        <span className="text-xs text-gray-400">{event.timestamp}</span>
      </div>
      <p className="text-sm text-gray-600 mt-2">{event.summary}</p>
      <div className="flex items-center gap-3 mt-3">
        <button className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-1.5">
          <Play className="w-3 h-3" fill="currentColor" />
          Play
        </button>
        <button onClick={onToggle} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          View Transcript
        </button>
      </div>
      {isExpanded && event.transcript && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {event.transcript.map((msg, i) => (
            <div key={i} className={cn('flex', msg.speaker === 'ai' ? 'justify-start' : 'justify-end')}>
              <div className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                msg.speaker === 'ai' ? 'bg-gray-100' : 'bg-blue-500 text-white',
                msg.flagged && 'bg-red-50 border border-red-200 text-red-800'
              )}>
                {msg.flagged && (
                  <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-1">
                    <AlertTriangle className="w-3 h-3" /> Flagged content
                  </div>
                )}
                <p>{msg.text}</p>
                <p className={cn('text-[10px] mt-1', msg.speaker === 'ai' ? 'text-gray-500' : msg.flagged ? 'text-red-500' : 'text-blue-100')}>
                  {msg.time}
                </p>
              </div>
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
    <div className="bg-violet-50 rounded-lg border border-violet-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-violet-900">{event.title}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">{confirmed} Confirmed</span>
          {needsAttention > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">{needsAttention} Needs Attention</span>
          )}
        </div>
        <span className="text-xs text-violet-600">{event.timestamp}</span>
      </div>
      <div className="space-y-3">
        {event.items.map((item, i) => (
          <div key={i} className={cn('bg-white rounded-lg border p-3', item.status === 'confirmed' ? 'border-green-200' : 'border-red-200')}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {item.status === 'confirmed' ? (
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <X className="w-3 h-3 text-red-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 font-medium">{item.text}</p>
                {item.patientResponse && (
                  <div className={cn('mt-2 p-2 rounded border', item.status === 'confirmed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <p className={cn('text-[10px] font-medium uppercase tracking-wide mb-1', item.status === 'confirmed' ? 'text-green-700' : 'text-red-700')}>
                      Patient Response
                    </p>
                    <p className={cn('text-sm', item.status === 'confirmed' ? 'text-green-800' : 'text-red-800')}>
                      "{item.patientResponse}"
                    </p>
                  </div>
                )}
              </div>
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
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">{event.title}</span>
        {event.timestamp && <span className="text-xs text-gray-400">{event.timestamp}</span>}
      </div>
      <div className="space-y-2">
        {event.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <Checkbox
              checked={item.done}
              onCheckedChange={() => onToggle(i)}
              className="h-4 w-4"
            />
            <span className={cn('text-sm', item.done && 'line-through text-gray-400')}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
