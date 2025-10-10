import { User, Phone, Mail, Users, Stethoscope, Heart } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { Patient } from "@/lib/types"

interface PatientInfoPopoverProps {
  patient: Patient
  children: React.ReactNode
}

export function PatientInfoPopover({ patient, children }: PatientInfoPopoverProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="border-b pb-2">
            <h4 className="font-semibold text-sm">{patient.name}</h4>
            <p className="text-xs text-muted-foreground">Patient ID: {patient.id}</p>
          </div>

          <div className="space-y-2 text-sm">
            {patient.gender && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Gender</div>
                  <div>{patient.gender}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <div className="font-medium text-xs text-muted-foreground">Phone</div>
                <div>{patient.phone}</div>
              </div>
            </div>

            {patient.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Email</div>
                  <div className="break-all">{patient.email}</div>
                </div>
              </div>
            )}

            {patient.primaryCarePhysician && (
              <div className="flex items-start gap-2">
                <Stethoscope className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Primary Care Physician</div>
                  <div>{patient.primaryCarePhysician}</div>
                </div>
              </div>
            )}

            {patient.referringPhysician && (
              <div className="flex items-start gap-2">
                <Heart className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Referring Physician</div>
                  <div>{patient.referringPhysician}</div>
                </div>
              </div>
            )}

            {patient.emergencyContact && (
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-xs text-muted-foreground">Emergency Contact</div>
                  <div>{patient.emergencyContact.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {patient.emergencyContact.relationship}
                  </div>
                  <div className="text-xs">{patient.emergencyContact.phone}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
