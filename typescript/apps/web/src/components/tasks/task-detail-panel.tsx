import { useState } from 'react'
import { ExternalLink, Flag, Check, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTasks } from '@/contexts/tasks-context'
import { AgentAvatar } from '@/components/agents/agent-avatar'
import { AgentSelector } from '@/components/agents/agent-selector'
import { PatientFlagBanner } from '@/components/patients/patient-flag-banner'
import { PatientFlagModal } from '@/components/patients/patient-flag-modal'
import { TaskTimeline } from './task-timeline'
import { OutboundCallPanel } from './outbound-call-panel'

const statusColors: Record<string, string> = {
  'in-progress': 'bg-amber-500 text-white',
  scheduled: 'bg-blue-500 text-white',
  escalated: 'bg-red-500 text-white',
  pending: 'bg-gray-500 text-white',
  completed: 'bg-green-500 text-white',
}

const statusLabels: Record<string, string> = {
  'in-progress': 'In Progress',
  scheduled: 'Scheduled',
  escalated: 'Escalated',
  pending: 'Pending',
  completed: 'Completed',
}

export function TaskDetailPanel() {
  const {
    getSelectedTask,
    isPatientFlagged,
    getPatientFlag,
    flagPatient,
    removePatientFlag,
    assignTask,
    markTaskDone,
    reopenTask,
    getAgent,
  } = useTasks()

  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showDemoCall, setShowDemoCall] = useState(false)

  const task = getSelectedTask()

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground bg-gray-50 dark:bg-gray-950">
        Select a task to view details
      </div>
    )
  }

  const agent = getAgent(task.assignedAgent)
  const flagged = isPatientFlagged(task.patient.id)
  const flag = getPatientFlag(task.patient.id)

  const handleFlag = (reason: string, notes: string) => {
    flagPatient(
      task.patient.id,
      reason as 'abusive-language' | 'verbal-threats' | 'harassment' | 'discriminatory' | 'other',
      notes,
      agent?.name || 'Staff'
    )
  }

  const initials = task.patient.name
    .split(' ')
    .map(n => n[0])
    .join('')

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
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium">
            {initials}
          </div>

          {/* Name and link */}
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{task.patient.name}</h2>
            {task.unread && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white hover:bg-blue-500">
                NEW
              </Badge>
            )}
            <button className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              Open Chart
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1" />

          {/* Status badges and agent selector */}
          <div className="flex items-center gap-2">
            <Badge className={statusColors[task.status]}>
              {statusLabels[task.status]}
            </Badge>
            {task.ehrSync.status === 'synced' && (
              <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                <Check className="h-3 w-3" />
                Synced
              </Badge>
            )}
            <AgentAvatar agent={agent} size="sm" />
            <AgentSelector
              value={task.assignedAgent}
              onValueChange={value => assignTask(task.id, value)}
              className="h-8 w-28"
            />
          </div>
        </div>

        {/* Patient info row */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 ml-14">
          <span>{task.patient.phone}</span>
          <span className="mx-1">•</span>
          <span>DOB: {task.patient.dob}</span>
          <span className="mx-1">•</span>
          <span>{task.patient.id}</span>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {/* Flag banner */}
          {flagged && flag && (
            <PatientFlagBanner
              flag={flag}
              onRemoveFlag={() => removePatientFlag(task.patient.id)}
            />
          )}

          {/* Timeline */}
          <TaskTimeline task={task} />
        </div>
      </ScrollArea>

      {/* Action bar */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="default">
              Add Note
            </Button>
            {!flagged && (
              <Button
                variant="outline"
                size="default"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950 gap-2"
                onClick={() => setShowFlagModal(true)}
              >
                <Flag className="h-4 w-4" />
                Flag Patient
              </Button>
            )}
            <Button
              variant="outline"
              size="default"
              className="text-green-600 border-green-300 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950 gap-2"
              onClick={() => setShowDemoCall(true)}
            >
              <Phone className="h-4 w-4" />
              Demo Call
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {task.status !== 'completed' && (
              <>
                <Button
                  variant="outline"
                  size="default"
                  className="text-amber-600 border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950"
                >
                  Escalate
                </Button>
                <Button
                  size="default"
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 gap-2"
                  onClick={() => markTaskDone(task.id)}
                >
                  <Check className="h-4 w-4" />
                  Mark Done
                </Button>
              </>
            )}
            {task.status === 'completed' && (
              <Button variant="outline" size="default" onClick={() => reopenTask(task.id)}>
                Reopen Task
              </Button>
            )}
          </div>
        </div>
      </div>

      <PatientFlagModal
        open={showFlagModal}
        onOpenChange={setShowFlagModal}
        patientName={task.patient.name}
        onFlag={handleFlag}
      />
    </div>
  )
}
