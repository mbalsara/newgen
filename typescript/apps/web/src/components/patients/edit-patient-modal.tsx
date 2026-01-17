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
import { api, type Patient } from '@/lib/api-client'

interface EditPatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patient: Patient | null
  onSuccess: () => void
}

export function EditPatientModal({ open, onOpenChange, patient, onSuccess }: EditPatientModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens or patient changes
  useEffect(() => {
    if (open && patient) {
      setFirstName(patient.firstName)
      setLastName(patient.lastName)
      setPhone(patient.phone || '')
      setError(null)
    }
  }, [open, patient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient) return

    setError(null)
    setIsLoading(true)

    try {
      // Format phone to E.164 if it doesn't start with +
      let formattedPhone = phone.trim()
      if (formattedPhone && !formattedPhone.startsWith('+')) {
        // Assume US number if no country code
        formattedPhone = formattedPhone.replace(/\D/g, '')
        if (formattedPhone.length === 10) {
          formattedPhone = '+1' + formattedPhone
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
          formattedPhone = '+' + formattedPhone
        } else {
          throw new Error('Please enter a valid 10-digit US phone number or include country code')
        }
      }

      await api.patients.update(patient.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: formattedPhone || undefined,
      })

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter a 10-digit US phone number
              </p>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
