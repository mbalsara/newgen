"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"

interface TimeSlot {
  time: string
  available: boolean
}

interface DaySlots {
  day: string
  dayOfWeek: string
  date: string
  slots: TimeSlot[]
}

export function OpenSlotsWidget() {
  // Generate next 7 days with mock availability data
  const generateNext7Days = (): DaySlots[] => {
    const days: DaySlots[] = []
    const today = new Date()
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      // Generate 30-min slots from 8 AM to 5 PM (18 slots per day)
      const slots: TimeSlot[] = []
      const startHour = 8
      const endHour = 17

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
          // Randomly mark some slots as available (mock data)
          const available = Math.random() > 0.9
          slots.push({ time, available })
        }
      }

      days.push({
        day: dayNames[date.getDay()],
        dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
        slots,
      })
    }

    return days
  }

  const weekData = generateNext7Days()
  const totalAvailable = weekData.reduce((sum, day) => sum + day.slots.filter((s) => s.available).length, 0)

  const availableSlotsByDay = weekData.map((day) => ({
    ...day,
    availableSlots: day.slots.filter((s) => s.available),
  }))

  // const maxSlots = Math.max(...availableSlotsByDay.map((d) => d.availableSlots.length))

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/10 shrink-0">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground leading-tight">Availability</p>
            <p className="text-xl font-bold text-blue-600 leading-tight">{totalAvailable}</p>
          </div>
        </div>

        <div className="flex justify-between items-end gap-1.5 h-24">
          {availableSlotsByDay.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
              {/* Count above each column */}
              {/* <div className="text-[10px] font-medium text-muted-foreground h-3">
                {day.availableSlots.length > 0 ? day.availableSlots.length : ""}
              </div> */}

              {/* Slots column */}
              <div className="flex flex-col-reverse gap-0.5 flex-1 justify-start min-h-[60px] w-full">
                {day.availableSlots.slice(0, 8).map((slot, slotIdx) => (
                  <div
                    key={slotIdx}
                    className="w-full h-2 bg-blue-500 hover:bg-green-600 transition-colors rounded-sm group relative cursor-pointer shrink-0"
                    style={{ minHeight: '8px' }}
                    title={`${day.dayOfWeek} ${day.date} at ${slot.time}`}
                  >
                    <div className="absolute hidden group-hover:block bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap -top-6 left-1/2 -translate-x-1/2 z-10">
                      {slot.time}
                    </div>
                  </div>
                ))}
              </div>

              {/* Day label at bottom */}
              <div className="text-[10px] font-medium text-muted-foreground">{day.day.charAt(0)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
