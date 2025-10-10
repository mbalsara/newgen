import { useState, useMemo } from "react"
import { upcomingAppointments } from "@/lib/mock-data"
import { PageHeader } from "@/components/page-header"
import { UpcomingAppointmentCard } from "@/components/upcoming-appointment-card"
import { DateRangeNavigation } from "@/components/date-range-navigation"
import { addDays } from "date-fns"

export default function UpcomingPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [startDate, setStartDate] = useState<Date>(today)
  const [endDate, setEndDate] = useState<Date>(addDays(today, 30))

  const filteredAppointments = useMemo(() => {
    return upcomingAppointments.filter((apt) => {
      const aptDate = new Date(apt.dateTime)
      aptDate.setHours(0, 0, 0, 0)
      return aptDate >= startDate && aptDate <= endDate
    })
  }, [startDate, endDate])

  const totalIssues = filteredAppointments.reduce((sum, apt) => sum + apt.issues.length, 0)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Upcoming Visits"
        subtitle="Review and resolve issues before appointments"
        backHref="/"
        rightContent={
          <div className="flex items-center gap-4">
            <DateRangeNavigation
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            {totalIssues > 0 && (
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-600">{totalIssues}</div>
                <div className="text-sm text-muted-foreground">Issues to Resolve</div>
              </div>
            )}
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <UpcomingAppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No appointments found in this date range</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
