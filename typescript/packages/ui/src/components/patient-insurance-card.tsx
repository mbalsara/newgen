import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Insurance {
  id: string
  provider: string
  type: string
  memberId: string
  groupNumber: string
  copay: number
  deductible: number
  deductibleMet: number
  effectiveDate: string
  expirationDate: string
  status: string
}

interface PatientInsuranceCardProps {
  insurance: Insurance
}

export function PatientInsuranceCard({ insurance }: PatientInsuranceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{insurance.provider}</CardTitle>
          <Badge variant={insurance.status === "Active" ? "default" : "secondary"}>{insurance.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Insurance Type</div>
              <div className="text-base mt-1">{insurance.type}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Member ID</div>
              <div className="text-base mt-1">{insurance.memberId}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Group Number</div>
              <div className="text-base mt-1">{insurance.groupNumber}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Co-pay</div>
              <div className="text-base mt-1">{formatCurrency(insurance.copay)}</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Deductible</div>
              <div className="text-base mt-1">{formatCurrency(insurance.deductible)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Deductible Met</div>
              <div className="text-base mt-1">
                {formatCurrency(insurance.deductibleMet)} of {formatCurrency(insurance.deductible)}
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${(insurance.deductibleMet / insurance.deductible) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Effective Date</div>
              <div className="text-base mt-1">{formatDate(insurance.effectiveDate)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Expiration Date</div>
              <div className="text-base mt-1">{formatDate(insurance.expirationDate)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
