import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api, type Patient, type Agent } from '@/lib/api-client'

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preselectedPatientId?: string
}

const TASK_TYPES = [
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'no-show', label: 'No Show' },
  { value: 'pre-visit', label: 'Pre-Visit' },
  { value: 'post-visit', label: 'Post-Visit' },
  { value: 'recall', label: 'Recall' },
  { value: 'collections', label: 'Collections' },
]

export function AddTaskModal({ open, onOpenChange, onSuccess, preselectedPatientId }: AddTaskModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [taskType, setTaskType] = useState('post-visit')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      // Load patients and agents
      Promise.all([
        api.patients.list(),
        api.agents.aiAgents(),
      ]).then(([patientList, agentList]) => {
        setPatients(patientList)
        setAgents(agentList)
        if (preselectedPatientId) {
          setSelectedPatientId(preselectedPatientId)
        }
        if (agentList.length > 0) {
          // Default to first AI agent or ai-maggi if available
          const defaultAgent = agentList.find(a => a.id === 'ai-maggi') || agentList[0]
          setSelectedAgentId(defaultAgent.id)
        }
      }).catch(console.error)
    }
  }, [open, preselectedPatientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const selectedPatient = patients.find(p => p.id === selectedPatientId)
      if (!selectedPatient) {
        throw new Error('Please select a patient')
      }

      const taskData: Record<string, unknown> = {
        patientId: selectedPatientId,
        provider: 'Manual Entry',
        type: taskType,
        status: 'pending',
        description: description.trim() || `${TASK_TYPES.find(t => t.value === taskType)?.label} call for ${selectedPatient.firstName} ${selectedPatient.lastName}`,
        assignedAgentId: selectedAgentId || undefined,
      }

      if (taskType === 'collections' && amount) {
        taskData.amount = amount
      }

      await api.tasks.create(taskData as any)

      // Reset form
      setSelectedPatientId('')
      setTaskType('post-visit')
      setDescription('')
      setAmount('')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient">Patient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} ({patient.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent">Assigned Agent</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {taskType === 'collections' && (
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedPatientId}>
              {isLoading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
