import { upcomingAppointments } from "@/lib/mock-data"
import { PageHeader } from "@/components/page-header"
import { UpcomingAppointmentCard } from "@/components/upcoming-appointment-card"

export default function UpcomingPage() {
  const totalIssues = upcomingAppointments.reduce((sum, apt) => sum + apt.issues.length, 0)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Upcoming Visits"
        subtitle="Review and resolve issues before appointments"
        backHref="/"
        rightContent={
          totalIssues > 0 ? (
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-600">{totalIssues}</div>
              <div className="text-sm text-muted-foreground">Issues to Resolve</div>
            </div>
          ) : undefined
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {upcomingAppointments.map((appointment) => (
            <UpcomingAppointmentCard key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </div>
    </div>
  )
}
