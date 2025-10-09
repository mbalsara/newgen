import { Card, CardContent } from "@/components/ui/card"
import { Users, XCircle, Calendar, AlertTriangle, CheckCircle } from "lucide-react"
import type { Appointment } from "@/lib/types"

interface SummaryMetricsProps {
  appointments: Appointment[]
}

export function SummaryMetrics({ appointments }: SummaryMetricsProps) {
  const totalPatients = appointments.length
  const cancellations = appointments.filter((apt) => apt.status === "cancelled").length
  const reschedules = appointments.filter((apt) => apt.status === "rescheduled").length

  const insuranceIssues = appointments.filter(
    (apt) => apt.patient.insurance.status === "invalid" || apt.patient.insurance.status === "pending",
  ).length
  const verifiedInsurance = appointments.filter((apt) => apt.patient.insurance.status === "valid").length

  const metrics = [
    {
      label: "Total Patients",
      value: totalPatients,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Verified Insurance",
      value: verifiedInsurance,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Insurance Issues",
      value: insuranceIssues,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      label: "Cancellations",
      value: cancellations,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      label: "Reschedules",
      value: reschedules,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label} className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${metric.bgColor} shrink-0`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">{metric.label}</p>
                  <p className={`text-xl font-bold ${metric.color} leading-tight`}>{metric.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
