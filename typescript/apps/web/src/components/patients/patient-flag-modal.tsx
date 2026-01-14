import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { flagReasons } from '@/lib/constants'
import type { PatientFlagReason } from '@/lib/task-types'

interface PatientFlagModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  onFlag: (reason: PatientFlagReason, notes: string) => void
}

export function PatientFlagModal({
  open,
  onOpenChange,
  patientName,
  onFlag,
}: PatientFlagModalProps) {
  const [reason, setReason] = useState<PatientFlagReason>('abusive-language')
  const [notes, setNotes] = useState('')

  const handleSubmit = () => {
    onFlag(reason, notes)
    onOpenChange(false)
    setNotes('')
    setReason('abusive-language')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Flag Patient</DialogTitle>
          <DialogDescription>
            Flag {patientName} for behavioral concerns. This will alert staff when handling
            future interactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason for flagging</Label>
            <RadioGroup
              value={reason}
              onValueChange={value => setReason(value as PatientFlagReason)}
            >
              {flagReasons.map(option => (
                <div key={option.id} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                  <Label htmlFor={option.id} className="font-normal cursor-pointer">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Provide additional context about the incident..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit}>
            Flag Patient
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
