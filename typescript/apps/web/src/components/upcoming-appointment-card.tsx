import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, User, Stethoscope } from "lucide-react"
import { UpcomingIssueBadge } from "@/components/upcoming-issue-badge"
import type { UpcomingAppointment } from "@/lib/types"

interface UpcomingAppointmentCardProps {
  appointment: UpcomingAppointment
}

export function UpcomingAppointmentCard({ appointment }: UpcomingAppointmentCardProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getDaysUntil = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntil = getDaysUntil(appointment.dateTime)
  const hasIssues = appointment.issues.length > 0

  return (
    <Card
      className={`transition-all hover:shadow-md ${
        hasIssues ? "border-l-4 border-l-amber-500" : "border-l-4 border-l-green-500"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">
              <Link
                to={`/patient/${appointment.patient.id}`}
                className="text-primary hover:underline inline-flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                {appointment.patient.name}
              </Link>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">{formatDate(appointment.dateTime)}</span>
                <span>at {formatTime(appointment.dateTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4" />
                <span>{appointment.provider}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{daysUntil}</div>
            <div className="text-xs text-muted-foreground">{daysUntil === 1 ? "day" : "days"} away</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">Reason for Visit</div>
            <div className="text-sm">{appointment.reason}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-0.5">Patient Information</div>
            <div className="text-xs space-y-0">
              <div>DOB: {appointment.patient.dob}</div>
              <div>Phone: {appointment.patient.phone}</div>
              <div>ID: {appointment.patient.id}</div>
            </div>
          </div>
        </div>

        {hasIssues && (
          <div className="space-y-2 pt-2 border-t">
            {appointment.issues.length > 1 && (
              <div className="font-semibold text-xs text-amber-600 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                  {appointment.issues.length}
                </span>
                Issues Requiring Attention
              </div>
            )}
            <div className="space-y-1.5">
              {appointment.issues.map((issue, index) => (
                <UpcomingIssueBadge key={index} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {!hasIssues && (
          <div className="flex items-center gap-2 text-green-600 text-xs font-medium pt-2 border-t">
            <div className="w-2 h-2 rounded-full bg-green-600" />
            All requirements verified - Ready for appointment
          </div>
        )}
      </CardContent>
    </Card>
  )
}
