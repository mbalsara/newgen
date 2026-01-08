import { useState } from 'react'
import { todaysAppointments } from '@/lib/mock-data'
import { TodaysPatientsTable } from '@/components/todays-patients-table'
import { TodaysPatientsCalendar } from '@/components/todays-patients-calendar'
import { SummaryMetrics } from '@/components/summary-metrics'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateNavigation } from '@/components/date-navigation'
import { TableIcon, CalendarDays } from 'lucide-react'
import { isToday } from 'date-fns'

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const getPageTitle = () => {
    if (isToday(selectedDate)) {
      return "Today's Patients"
    }
    return 'Patients'
  }

  const getPageSubtitle = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{getPageTitle()}</h1>
          <p className="text-muted-foreground">{getPageSubtitle()}</p>
        </div>
        <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      <SummaryMetrics appointments={todaysAppointments} />

      <Tabs defaultValue="table" className="space-y-4">
        {(() => {
          const viewToggle = (
            <TabsList className="h-9">
              <TabsTrigger value="table" className="px-3" title="Table View">
                <TableIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="calendar" className="px-3" title="Calendar View">
                <CalendarDays className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          )

          return (
            <>
              <TabsContent value="table" className="space-y-4">
                <TodaysPatientsTable appointments={todaysAppointments} viewToggle={viewToggle} />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <TodaysPatientsCalendar
                  appointments={todaysAppointments}
                  viewToggle={viewToggle}
                />
              </TabsContent>
            </>
          )
        })()}
      </Tabs>
    </div>
  )
}
