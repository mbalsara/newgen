import { useMemo, useEffect, useState } from 'react'
import type { Appointment } from '@repo/types'

interface DayCalendarViewProps {
  appointments: Appointment[]
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 60 // pixels per hour

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [time, period] = timeStr.split(' ')
  let [hours, minutes] = time.split(':').map(Number)

  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return { hours, minutes }
}

function timeToPosition(timeStr: string): number {
  const { hours, minutes } = parseTime(timeStr)
  return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT
}

function getCurrentTimePosition(): number {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  return hours * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT
}

export function DayCalendarView({ appointments }: DayCalendarViewProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState(getCurrentTimePosition())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimePosition(getCurrentTimePosition())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const appointmentCards = useMemo(() => {
    return appointments.map((apt) => {
      const topPosition = timeToPosition(apt.time)
      const height = 15 * 4 // 15 mins = quarter of hour height (60px / 4)

      return {
        ...apt,
        topPosition,
        height,
      }
    })
  }, [appointments])

  const statusColors = {
    Active: 'bg-blue-100 border-blue-300 text-blue-900',
    Confirmed: 'bg-green-100 border-green-300 text-green-900',
    'Left Message': 'bg-yellow-100 border-yellow-300 text-yellow-900',
    Reschedule: 'bg-red-100 border-red-300 text-red-900',
  }

  return (
    <div className="border rounded-lg bg-card overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {/* Hour grid */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-b border-border"
              style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
            >
              <div className="absolute left-0 top-0 px-4 py-1 text-sm font-medium text-muted-foreground w-20">
                {hour === 0
                  ? '12 AM'
                  : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                  ? '12 PM'
                  : `${hour - 12} PM`}
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          <div
            className="absolute w-full z-10 flex items-center"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full ml-2"></div>
            <div className="flex-1 h-0.5 bg-red-500"></div>
          </div>

          {/* Appointments */}
          <div className="absolute left-20 right-0 top-0 bottom-0">
            {appointmentCards.map((apt) => (
              <div
                key={apt.id}
                className={`absolute left-4 right-4 p-3 border-l-4 rounded shadow-sm ${
                  statusColors[apt.status as keyof typeof statusColors]
                }`}
                style={{
                  top: `${apt.topPosition}px`,
                  height: `${apt.height}px`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {apt.time} - {apt.patientName}
                    </div>
                    <div className="text-xs opacity-90 truncate">
                      {apt.provider}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {apt.reasonForVisit}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-medium px-2 py-0.5 bg-white/50 rounded">
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
