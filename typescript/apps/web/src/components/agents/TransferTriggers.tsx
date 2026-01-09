import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
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
import { Plus, Trash2, User, Phone, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransferTrigger {
  id: string
  description: string
  enabled: boolean
}

interface TransferDestination {
  type: 'staff' | 'phone' | 'queue'
  staffId?: string
  phoneNumber?: string
  queueId?: string
  warmTransfer: boolean
}

interface TransferTriggersProps {
  triggers: TransferTrigger[]
  destination?: TransferDestination
  onTriggersChange: (triggers: TransferTrigger[]) => void
  onDestinationChange: (destination: TransferDestination) => void
  staffList?: { id: string; name: string }[]
}

const DEFAULT_TRIGGERS: TransferTrigger[] = [
  { id: 'request-human', description: 'Patient explicitly requests to speak with a human', enabled: true },
  { id: 'emergency', description: 'Patient mentions emergency or urgent symptoms', enabled: true },
  { id: 'complex-question', description: 'Question requires clinical expertise', enabled: true },
  { id: 'repeated-confusion', description: 'Patient is repeatedly confused or frustrated', enabled: false },
  { id: 'billing-dispute', description: 'Patient has billing or insurance dispute', enabled: false },
]

export function TransferTriggers({
  triggers,
  destination,
  onTriggersChange,
  onDestinationChange,
  staffList = [],
}: TransferTriggersProps) {
  const [newTrigger, setNewTrigger] = useState('')

  const currentTriggers = triggers.length > 0 ? triggers : DEFAULT_TRIGGERS
  const currentDestination = destination || {
    type: 'staff' as const,
    warmTransfer: true,
  }

  const toggleTrigger = (id: string) => {
    const updated = currentTriggers.map((t) =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    )
    onTriggersChange(updated)
  }

  const addTrigger = () => {
    if (!newTrigger.trim()) return
    const updated = [
      ...currentTriggers,
      {
        id: `custom-${Date.now()}`,
        description: newTrigger.trim(),
        enabled: true,
      },
    ]
    onTriggersChange(updated)
    setNewTrigger('')
  }

  const removeTrigger = (id: string) => {
    const updated = currentTriggers.filter((t) => t.id !== id)
    onTriggersChange(updated)
  }

  const updateDestination = (updates: Partial<TransferDestination>) => {
    onDestinationChange({ ...currentDestination, ...updates })
  }

  const enabledCount = currentTriggers.filter((t) => t.enabled).length

  return (
    <div className="space-y-6">
      {/* Transfer Triggers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Transfer Triggers</Label>
          <span className="text-xs text-muted-foreground">
            {enabledCount} active
          </span>
        </div>

        <div className="space-y-2">
          {currentTriggers.map((trigger) => (
            <div
              key={trigger.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                trigger.enabled ? 'bg-card' : 'bg-muted/30'
              )}
            >
              <Switch
                checked={trigger.enabled}
                onCheckedChange={() => toggleTrigger(trigger.id)}
              />
              <span className="flex-1 text-sm">{trigger.description}</span>
              {trigger.id.startsWith('custom-') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeTrigger(trigger.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add custom trigger */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom trigger..."
            value={newTrigger}
            onChange={(e) => setNewTrigger(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTrigger()}
          />
          <Button variant="outline" size="icon" onClick={addTrigger}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Transfer Destination */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base">Transfer Destination</Label>

        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'staff', icon: User, label: 'Staff Member' },
            { type: 'phone', icon: Phone, label: 'Phone Number' },
            { type: 'queue', icon: Users, label: 'Call Queue' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => updateDestination({ type: type as TransferDestination['type'] })}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                currentDestination.type === type
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>

        {currentDestination.type === 'staff' && (
          <div className="space-y-2">
            <Label className="text-sm">Select Staff Member</Label>
            <Select
              value={currentDestination.staffId || ''}
              onValueChange={(staffId) => updateDestination({ staffId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose staff member..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.length > 0 ? (
                  staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="auto">Auto-assign (round robin)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {currentDestination.type === 'phone' && (
          <div className="space-y-2">
            <Label className="text-sm">Phone Number</Label>
            <Input
              placeholder="+1 (555) 123-4567"
              value={currentDestination.phoneNumber || ''}
              onChange={(e) => updateDestination({ phoneNumber: e.target.value })}
            />
          </div>
        )}

        {currentDestination.type === 'queue' && (
          <div className="space-y-2">
            <Label className="text-sm">Queue</Label>
            <Select
              value={currentDestination.queueId || ''}
              onValueChange={(queueId) => updateDestination({ queueId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select queue..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Support</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Warm/Cold Transfer */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div>
            <p className="text-sm font-medium">Warm Transfer</p>
            <p className="text-xs text-muted-foreground">
              Agent stays on the line to introduce the patient
            </p>
          </div>
          <Switch
            checked={currentDestination.warmTransfer}
            onCheckedChange={(warmTransfer) => updateDestination({ warmTransfer })}
          />
        </div>
      </div>
    </div>
  )
}
