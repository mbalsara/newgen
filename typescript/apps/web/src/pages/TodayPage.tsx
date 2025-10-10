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
      />

      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center mb-6">
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
        <SummaryMetrics appointments={todaysAppointments} />
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="table" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            <TodaysPatientsTable appointments={todaysAppointments} />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <TodaysPatientsCalendar appointments={todaysAppointments} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
