import { useState } from "react"
import { todaysAppointments } from "@/lib/mock-data"
import { TodaysPatientsTable } from "@/components/todays-patients-table"
import { TodaysPatientsCalendar } from "@/components/todays-patients-calendar"
import { SummaryMetrics } from "@/components/summary-metrics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TableIcon, CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DateNavigation } from "@/components/date-navigation"
import { format, isToday } from "date-fns"

export default function TodayPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const getPageTitle = () => {
    if (isToday(selectedDate)) {
      return "Today's Patients"
    }
    return "Patients"
  }

  const getPageSubtitle = () => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={getPageTitle()}
        subtitle={getPageSubtitle()}
        backHref="/"
        rightContent={
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        }
      />

      <div className="container mx-auto px-4 py-6">
        <SummaryMetrics appointments={todaysAppointments} />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="table" className="space-y-6">
          <TabsContent value="table" className="space-y-4">
            <TodaysPatientsTable
              appointments={todaysAppointments}
              viewToggle={
                <TabsList className="h-9">
                  <TabsTrigger value="table" className="px-3" title="Table View">
                    <TableIcon className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="px-3" title="Calendar View">
                    <CalendarDays className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              }
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <TodaysPatientsCalendar appointments={todaysAppointments} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
