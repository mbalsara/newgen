import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Demographics {
  fullName: string
  dob: string
  age: number
  gender: string
  ssn: string
  address: string
  email: string
  phone: string
  emergencyContact: string
}

interface PatientDemographicsSectionProps {
  demographics: Demographics
}

export function PatientDemographicsSection({ demographics }: PatientDemographicsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Demographics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Full Name</div>
              <div className="text-base mt-1">{demographics.fullName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
              <div className="text-base mt-1">
                {demographics.dob} ({demographics.age} years old)
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Gender</div>
              <div className="text-base mt-1">{demographics.gender}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">SSN</div>
              <div className="text-base mt-1">{demographics.ssn}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Address</div>
              <div className="text-base mt-1">{demographics.address}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="text-base mt-1">{demographics.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Phone</div>
              <div className="text-base mt-1">{demographics.phone}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Emergency Contact</div>
              <div className="text-base mt-1">{demographics.emergencyContact}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
