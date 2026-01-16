import { useState, useEffect } from 'react'
import { useLocation, useParams, useNavigate, Link } from 'react-router'
import { Search, RefreshCw, Filter, ExternalLink, Check, Flag, Play, ChevronDown, Plus, Mic, AlertTriangle, ArrowRight, X, Pencil, Phone, StickyNote } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useTasks } from '@/contexts/tasks-context'
import { cn } from '@/lib/utils'
import type { Task, TimelineEvent, VoiceEvent, ObjectivesEvent, NextStepsEvent, CallEvent, TaskFilters, TaskStatus, PatientFlagReason } from '@/lib/task-types'
import { OutboundCallPanel } from '@/components/tasks/outbound-call-panel'
import { PatientFlagModal } from '@/components/patients/patient-flag-modal'

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
  const navigate = useNavigate()
  const { taskId: taskIdParam } = useParams<{ taskId?: string }>()
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
    flagPatient,
    assignTask,
    addNoteToTask,
    markTaskDone,
    reopenTask,
    toggleNextStep,
    loading,
    getAgent,
  } = useTasks()

  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({})
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Handle task selection from URL param - clear filters to show the task
  useEffect(() => {
    if (taskIdParam && !loading) {
      const taskId = parseInt(taskIdParam, 10)
      if (!isNaN(taskId)) {
        // Always clear filters when URL has a task ID, so the task is visible in left panel
        if (filters.agent !== 'all' || filters.statuses.length > 0 || filters.search) {
          setFilters({ statuses: [], agent: 'all', search: '' })
        }
        if (taskId !== selectedTaskId) {
          selectTask(taskId)
        }
      }
    }
  }, [taskIdParam, loading, selectTask, setFilters, filters.agent, filters.statuses.length, filters.search, selectedTaskId])

  // Handle navigation from Queue page with task ID in state
  useEffect(() => {
    const state = location.state as { taskId?: number } | null
    if (state?.taskId) {
      selectTask(state.taskId)
      // Update URL to include the task ID
      navigate(`/tasks/${state.taskId}`, { replace: true })
    }
  }, [location.state, selectTask, navigate])

  const filteredTasks = getFilteredTasks()

  // Auto-select first task when page loads or when filtered tasks change and no task is selected
  useEffect(() => {
    if (loading) return
    const hasSelectedTaskInFiltered = filteredTasks.some(t => t.id === selectedTaskId)
    if (!hasSelectedTaskInFiltered && filteredTasks.length > 0 && !taskIdParam) {
      selectTask(filteredTasks[0].id)
      navigate(`/tasks/${filteredTasks[0].id}`, { replace: true })
    }
  }, [filteredTasks, selectedTaskId, selectTask, navigate, taskIdParam, loading])

  // Update URL when task selection changes
  const handleSelectTask = (id: number) => {
    selectTask(id)
    navigate(`/tasks/${id}`, { replace: true })
  }

  // Look for selected task in all tasks first (for Queue navigation), then in filtered tasks
  const selectedTask = tasks.find(t => t.id === selectedTaskId) || filteredTasks.find(t => t.id === selectedTaskId) || filteredTasks[0]

  const toggleTranscript = (eventId: string) => {
    setExpandedTranscripts(prev => ({ ...prev, [eventId]: !prev[eventId] }))
  }

  return (
    <div className="h-[calc(100svh-0px)] flex bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Task List */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-0">
        {/* Search Header - matches right panel header height */}
        <div className="px-3 py-[14px] border-b border-gray-200">
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
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={cn(
                  'p-1.5 hover:bg-gray-100 rounded-lg',
                  (filters.statuses.length > 0 || filters.agent !== 'all') ? 'text-violet-600 bg-violet-50' : 'text-gray-500'
                )}
              >
                <Filter className="w-4 h-4" />
              </button>
              {showFilterDropdown && (
                <FilterDropdown
                  filters={filters}
                  setFilters={setFilters}
                  onClose={() => setShowFilterDropdown(false)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(filters.statuses.length > 0 || filters.agent !== 'all') && (
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2 flex-wrap">
            {filters.statuses.map(status => (
              <span key={status} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                {statusLabels[status]}
                <button onClick={() => setFilters({ statuses: filters.statuses.filter(s => s !== status) })} className="hover:text-violet-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.agent === 'me' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                My Tasks
                <button onClick={() => setFilters({ agent: 'all' })} className="hover:text-violet-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.agent !== 'all' && filters.agent !== 'me' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                {getAgent(filters.agent)?.name}
                <button onClick={() => setFilters({ agent: 'all' })} className="hover:text-violet-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => setFilters({ statuses: [], agent: 'all' })}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Task List */}
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-100">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                isFlagged={isPatientFlagged(task.patient.id)}
                onClick={() => handleSelectTask(task.id)}
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
            onMarkDone={() => {
              // Find the next task in the filtered list before marking done
              const currentIndex = filteredTasks.findIndex(t => t.id === selectedTask.id)
              const nextTask = filteredTasks[currentIndex + 1] || filteredTasks[currentIndex - 1]
              markTaskDone(selectedTask.id)
              // Select next task if available
              if (nextTask && nextTask.id !== selectedTask.id) {
                handleSelectTask(nextTask.id)
              }
            }}
            onReopen={() => reopenTask(selectedTask.id)}
            onFlagPatient={(reason, notes) => {
              const agent = getAgent(selectedTask.assignedAgent)
              flagPatient(selectedTask.patient.id, reason, notes, agent?.name || 'Staff')
            }}
            onAddNote={(note) => addNoteToTask(selectedTask.id, note)}
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
  const { getAgent } = useTasks()
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
function TaskDetail({ task, isFlagged, flag, onAssign, onMarkDone, onReopen, onFlagPatient, onAddNote, onToggleNextStep, expandedTranscripts, onToggleTranscript, showAssignDropdown, setShowAssignDropdown }: {
  task: Task
  isFlagged: boolean
  flag: any
  onAssign: (agentId: string) => void
  onMarkDone: () => void
  onReopen: () => void
  onFlagPatient: (reason: PatientFlagReason, notes: string) => void
  onAddNote: (note: string) => void
  onToggleNextStep: (eventId: string, index: number) => void
  expandedTranscripts: Record<string, boolean>
  onToggleTranscript: (eventId: string) => void
  showAssignDropdown: boolean
  setShowAssignDropdown: (show: boolean) => void
}) {
  const { getAgent } = useTasks()
  const [showDemoCall, setShowDemoCall] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const agent = getAgent(task.assignedAgent)
  const initials = task.patient.name.split(' ').map(n => n[0]).join('')

  // Show demo call panel
  if (showDemoCall) {
    return (
      <OutboundCallPanel
        task={task}
        onClose={() => setShowDemoCall(false)}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Flag Warning Banner - Fixed */}
      {isFlagged && flag && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-2.5 flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-700 flex-1">
            <span className="font-medium">Abusive Language</span> - {flag.notes}
          </span>
        </div>
      )}

      {/* Patient Header - Fixed */}
      <div className="bg-white border-b border-gray-200 px-5 py-[13px] shrink-0">
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

      {/* Timeline - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5">
          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-200" />
            <div className="space-y-4">
              {(task.timeline || []).map(event => (
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

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddNoteModal(true)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <StickyNote className="w-4 h-4" />
            Add Note
          </button>
          {!isFlagged && (
            <button
              onClick={() => setShowFlagModal(true)}
              className="px-3 py-1.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-1.5"
            >
              <Flag className="w-4 h-4" />
              Flag Patient
            </button>
          )}
          {agent?.type === 'ai' && (
            <button
              onClick={() => setShowDemoCall(true)}
              className="px-3 py-1.5 border border-green-300 rounded-lg text-sm font-medium text-green-600 hover:bg-green-50 flex items-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              Demo Call
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

      {/* Flag Patient Modal */}
      <PatientFlagModal
        open={showFlagModal}
        onOpenChange={setShowFlagModal}
        patientName={task.patient.name}
        onFlag={onFlagPatient}
      />

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAddNoteModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Add Note</h3>
            <p className="text-sm text-gray-500 mb-4">Add a note to the task timeline for {task.patient.name}</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowAddNoteModal(false)
                  setNoteText('')
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (noteText.trim()) {
                    onAddNote(noteText.trim())
                    setShowAddNoteModal(false)
                    setNoteText('')
                  }
                }}
                disabled={!noteText.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Agent Dropdown with Search
function AgentDropdown({ currentAgentId, onSelect, onClose }: {
  currentAgentId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const { getAIAgents, getStaffAgents } = useTasks()
  const [search, setSearch] = useState('')

  const aiAgentsList = getAIAgents()
  const staffList = getStaffAgents()

  const filteredAiAgents = aiAgentsList.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  )
  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
        {/* Search Input */}
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto py-1">
          {filteredAiAgents.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide">AI Agents</div>
              {filteredAiAgents.map(a => (
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
            </>
          )}

          {filteredStaff.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">Staff</div>
              {filteredStaff.map(s => (
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
            </>
          )}

          {filteredAiAgents.length === 0 && filteredStaff.length === 0 && (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">No agents found</div>
          )}
        </div>
      </div>
    </>
  )
}

// Filter Dropdown with Status and Agent submenus
function FilterDropdown({ filters, setFilters, onClose }: {
  filters: TaskFilters
  setFilters: (filters: Partial<TaskFilters>) => void
  onClose: () => void
}) {
  const { getAIAgents, getStaffAgents } = useTasks()
  const [activeSubmenu, setActiveSubmenu] = useState<'status' | 'agent' | null>(null)
  const [agentSearch, setAgentSearch] = useState('')

  const aiAgentsList = getAIAgents()
  const staffList = getStaffAgents()

  const filteredAiAgents = aiAgentsList.filter(a =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.role.toLowerCase().includes(agentSearch.toLowerCase())
  )
  const filteredStaff = staffList.filter(s =>
    s.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    s.role.toLowerCase().includes(agentSearch.toLowerCase())
  )

  // Available statuses (excluding Scheduled)
  const statuses: { value: TaskStatus; label: string }[] = [
    { value: 'in-progress', label: 'In Progress' },
    { value: 'escalated', label: 'Escalated' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ]

  const toggleStatus = (status: TaskStatus) => {
    const currentStatuses = filters.statuses
    if (currentStatuses.includes(status)) {
      // Remove status
      setFilters({ statuses: currentStatuses.filter(s => s !== status) })
    } else {
      // Add status
      setFilters({ statuses: [...currentStatuses, status] })
    }
  }

  const selectAllStatuses = () => {
    setFilters({ statuses: [] })  // Empty means all
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
        {activeSubmenu === null && (
          <div className="py-1">
            <button
              onClick={() => setActiveSubmenu('status')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>Status</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
            <button
              onClick={() => setActiveSubmenu('agent')}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>Agent</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        )}

        {activeSubmenu === 'status' && (
          <div className="py-1">
            <button
              onClick={() => setActiveSubmenu(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              <span>Back</span>
            </button>
            {/* All Statuses option */}
            <button
              onClick={selectAllStatuses}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50',
                filters.statuses.length === 0 ? 'text-violet-600 bg-violet-50' : 'text-gray-700'
              )}
            >
              <span>All Statuses</span>
              {filters.statuses.length === 0 && <Check className="w-4 h-4" />}
            </button>
            {statuses.map(s => {
              const isSelected = filters.statuses.includes(s.value)
              return (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50',
                    isSelected ? 'text-violet-600 bg-violet-50' : 'text-gray-700'
                  )}
                >
                  <span>{s.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
        )}

        {activeSubmenu === 'agent' && (
          <div>
            <button
              onClick={() => setActiveSubmenu(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              <span>Back</span>
            </button>

            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {/* My Tasks option */}
              <button
                onClick={() => { setFilters({ agent: 'me' }); onClose(); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50',
                  filters.agent === 'me' ? 'text-violet-600 bg-violet-50' : 'text-gray-700'
                )}
              >
                <span>My Tasks</span>
                {filters.agent === 'me' && <Check className="w-4 h-4" />}
              </button>

              {/* All Agents option */}
              <button
                onClick={() => { setFilters({ agent: 'all' }); onClose(); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50',
                  filters.agent === 'all' ? 'text-violet-600 bg-violet-50' : 'text-gray-700'
                )}
              >
                <span>All Agents</span>
                {filters.agent === 'all' && <Check className="w-4 h-4" />}
              </button>

              {filteredAiAgents.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide">AI Agents</div>
                  {filteredAiAgents.map(a => (
                    <button
                      key={a.id}
                      onClick={() => { setFilters({ agent: a.id }); onClose(); }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                        filters.agent === a.id ? 'text-violet-600 bg-violet-50' : 'text-gray-700'
                      )}
                    >
                      <span className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-[10px]">🤖</span>
                      <span className="flex-1 text-left truncate">{a.name}</span>
                      {filters.agent === a.id && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </>
              )}

              {filteredStaff.length > 0 && (
                <>
                  <div className="px-3 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">Staff</div>
                  {filteredStaff.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setFilters({ agent: s.id }); onClose(); }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50',
                        filters.agent === s.id ? 'text-amber-600 bg-amber-50' : 'text-gray-700'
                      )}
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-medium text-amber-700">{s.avatar}</span>
                      <span className="flex-1 text-left truncate">{s.name}</span>
                      {filters.agent === s.id && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  ))}
                </>
              )}

              {filteredAiAgents.length === 0 && filteredStaff.length === 0 && agentSearch && (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">No agents found</div>
              )}
            </div>
          </div>
        )}
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
    call: { icon: Phone, bg: 'bg-blue-500', text: 'text-white' },
    scheduled: { icon: Plus, bg: 'bg-blue-100', text: 'text-blue-600' },
    escalated: { icon: AlertTriangle, bg: 'bg-amber-100', text: 'text-amber-600' },
    completed: { icon: Check, bg: 'bg-green-100', text: 'text-green-600' },
    'next-steps': { icon: ArrowRight, bg: 'bg-gray-100', text: 'text-gray-600' },
    objectives: { icon: Plus, bg: 'bg-violet-100', text: 'text-violet-600' },
    balance: { icon: Plus, bg: 'bg-red-100', text: 'text-red-600' },
    flag: { icon: Flag, bg: 'bg-red-500', text: 'text-white' },
    note: { icon: StickyNote, bg: 'bg-blue-100', text: 'text-blue-600' },
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

      {event.type === 'call' && (
        <CallEventCard event={event as CallEvent} isExpanded={isExpanded} onToggle={onToggleTranscript} />
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

      {event.type === 'note' && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">{event.title}</span>
            <span className="text-xs text-blue-600">{event.timestamp}</span>
          </div>
          <p className="text-sm text-blue-900 mt-2">{(event as any).content}</p>
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleEditClick = (index: number, currentValue: string) => {
    setEditingIndex(index)
    setEditValue(currentValue)
  }

  const handleSave = () => {
    // In a real app, this would update the backend
    // For now, just close the editor
    setEditingIndex(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setEditingIndex(null)
    setEditValue('')
  }

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
                    {editingIndex === i ? (
                      <div className="space-y-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSave}
                            className="px-3 py-1 bg-violet-600 text-white text-xs font-medium rounded hover:bg-violet-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1 border border-gray-300 text-gray-600 text-xs font-medium rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm flex-1', item.status === 'confirmed' ? 'text-green-800' : 'text-red-800')}>
                          "{item.patientResponse}"
                        </p>
                        <button
                          onClick={() => handleEditClick(i, item.patientResponse || '')}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded shrink-0"
                          title="Edit response"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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

// Call Event Card
function CallEventCard({ event, isExpanded, onToggle }: { event: CallEvent; isExpanded?: boolean; onToggle: () => void }) {
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
  const hasMessages = event.messages && event.messages.length > 0
  const hasRecording = !!event.recordingUrl
  const hasSummary = !!event.summary || !!event.analysis?.summary
  const hasStructuredData = event.analysis?.structuredData && Object.keys(event.analysis.structuredData).length > 0

  // Debug: log analysis data
  console.log('[CallEventCard] event analysis:', event.analysis)
  console.log('[CallEventCard] hasStructuredData:', hasStructuredData)

  // Get a friendly status from endedReason
  const getStatusLabel = (reason: string) => {
    switch (reason) {
      case 'assistant-ended-call':
        return { label: 'Completed', color: 'text-green-600' }
      case 'voicemail':
        return { label: 'Voicemail', color: 'text-amber-600' }
      case 'customer-did-not-answer':
        return { label: 'No Answer', color: 'text-gray-500' }
      case 'customer-ended-call':
        return { label: 'Patient Ended', color: 'text-gray-500' }
      default:
        return { label: reason || 'Unknown', color: 'text-gray-500' }
    }
  }

  const status = getStatusLabel(event.endedReason)
  const summaryText = event.summary || event.analysis?.summary

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-gray-900">{event.title}</span>
          <span className={cn('text-sm font-medium', status.color)}>
            {status.label}
          </span>
        </div>
        <span className="text-xs text-gray-400">{event.timestamp}</span>
      </div>

      {/* Summary */}
      {hasSummary && (
        <p className="text-sm text-gray-600 mt-2">{summaryText}</p>
      )}

      {/* Structured Data / Extracted Answers from VAPI */}
      {hasStructuredData && (
        <div className="mt-3 bg-violet-50 rounded-lg border border-violet-200 p-3">
          <div className="text-xs font-medium text-violet-700 uppercase tracking-wide mb-2">Patient Responses</div>
          <div className="space-y-2">
            {Object.entries(event.analysis!.structuredData!).map(([key, value]) => {
              // Format the key: snake_case to Title Case
              const formattedKey = key
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')

              // Format the value: booleans as Yes/No, arrays as comma-separated, etc.
              let formattedValue: string
              if (typeof value === 'boolean') {
                formattedValue = value ? 'Yes' : 'No'
              } else if (Array.isArray(value)) {
                formattedValue = value.join(', ')
              } else if (value === null || value === undefined) {
                formattedValue = 'Not provided'
              } else if (typeof value === 'object') {
                formattedValue = JSON.stringify(value)
              } else {
                formattedValue = String(value)
              }

              return (
                <div key={key} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-gray-700">{formattedKey}:</span>
                    <span className="text-sm text-gray-600 ml-1">{formattedValue}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {hasRecording && showAudioPlayer && (
        <div className="mt-3">
          <audio
            controls
            autoPlay
            className="w-full h-10"
            src={event.recordingUrl}
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      <div className="flex items-center gap-3 mt-3">
        {hasRecording && (
          <button
            onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5",
              showAudioPlayer
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gray-900 text-white hover:bg-gray-800"
            )}
          >
            <Play className="w-3 h-3" fill="currentColor" />
            {showAudioPlayer ? 'Hide Player' : 'Play Recording'}
          </button>
        )}
        {hasMessages && (
          <button onClick={onToggle} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
            View Transcript
          </button>
        )}
      </div>

      {isExpanded && hasMessages && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {event.messages!.map((msg, i) => (
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

      {/* Show raw transcript if no parsed messages */}
      {!hasMessages && event.transcript && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm whitespace-pre-wrap">
          {event.transcript}
        </div>
      )}
    </div>
  )
}
