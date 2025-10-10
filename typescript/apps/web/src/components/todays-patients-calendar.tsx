"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import type { Appointment } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { InsuranceStatusIndicator } from "./insurance-status-indicator"
import { PatientFlagsIndicator } from "./patient-flags-indicator"
import { ViewControls } from "./view-controls"
import { DollarSign } from "lucide-react"
import { Link } from "react-router-dom"
import { isCurrentAppointment, isPastAppointment, formatTime, formatCurrency } from "@/lib/appointment-utils"

interface TodaysPatientsCalendarProps {
  appointments: Appointment[]
  viewToggle?: React.ReactNode
}

export function TodaysPatientsCalendar({ appointments, viewToggle }: TodaysPatientsCalendarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const currentSlotRef = useRef<HTMLDivElement>(null)

  const uniqueProviders = useMemo(() => {
    const providers = Array.from(new Set(appointments.map((apt) => apt.provider)))
    return providers.sort()
  }, [appointments])

  useMemo(() => {
    if (selectedProviders.length === 0 && uniqueProviders.length > 0) {
      setSelectedProviders(uniqueProviders)
    }
  }, [uniqueProviders, selectedProviders.length])

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const searchLower = searchQuery.toLowerCase()
      const matchesProvider = selectedProviders.length === 0 || selectedProviders.includes(apt.provider)
      const matchesSearch =
        apt.patient.name.toLowerCase().includes(searchLower) ||
        apt.provider.toLowerCase().includes(searchLower) ||
        apt.reason.toLowerCase().includes(searchLower) ||
        apt.patient.insurance.provider.toLowerCase().includes(searchLower) ||
        apt.patient.phone.includes(searchQuery) ||
        apt.patient.id.toLowerCase().includes(searchLower)

      return matchesProvider && matchesSearch
    })
  }, [appointments, searchQuery, selectedProviders])

  const timeSlots = useMemo(() => {
    const slots = []
    const startHour = 8
    const endHour = 17

    for (let hour = startHour; hour <= endHour; hour++) {
      const date = new Date()
      date.setHours(hour, 0, 0, 0)
      slots.push(date)
    }

    return slots
  }, [])

  const getAppointmentForSlot = (slotTime: Date) => {
    return filteredAppointments.find((apt) => {
      const aptHour = apt.dateTime.getHours()
      const slotHour = slotTime.getHours()
      return aptHour === slotHour
    })
  }

  // Scroll to current time slot on mount
  useEffect(() => {
    if (currentSlotRef.current) {
      currentSlotRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [filteredAppointments])

  return (
    <div className="space-y-4">
      <ViewControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        providers={uniqueProviders}
        selectedProviders={selectedProviders}
        onProviderSelectionChange={setSelectedProviders}
        filteredCount={filteredAppointments.length}
        totalCount={appointments.length}
        viewToggle={viewToggle}
      />

      <div className="space-y-2">
        {timeSlots.map((slot) => {
          const appointment = getAppointmentForSlot(slot)
          const isCurrent = isCurrentAppointment(slot)
          const isPast = isPastAppointment(slot)

          return (
            <div key={slot.toISOString()} className="relative" ref={isCurrent ? currentSlotRef : null}>
              <div className="flex gap-4">
                <div className="w-24 flex-shrink-0 pt-2">
                  <div className={`text-sm font-medium ${isPast ? "text-muted-foreground" : "text-foreground"}`}>
                    <div className="flex items-center gap-2">
                      {formatTime(slot)}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-[60px]">
                  {appointment ? (
                    <Card
                      className={`h-full transition-all hover:shadow-md ${
                        isPast ? "opacity-50" : ""
                      } ${isCurrent ? "bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500" : "border-l-4 border-l-primary"}`}
                    >
                      <CardContent className="p-3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Patient:</span>
                              <Link
                                to={`/patient/${appointment.patient.id}`}
                                className="font-semibold text-primary hover:underline"
                              >
                                {appointment.patient.name}
                              </Link>
                              {appointment.patient.flags && <PatientFlagsIndicator flags={appointment.patient.flags} />}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0">
                              <div>DOB: {appointment.patient.dob}</div>
                              <div>{appointment.patient.phone}</div>
                              <div>ID: {appointment.patient.id}</div>
                              {appointment.patient.balance > 0 && (
                                <div className="flex items-center gap-1 text-amber-600 font-medium mt-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(appointment.patient.balance)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Provider:</span>
                              <span className="font-medium">{appointment.provider}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">Reason:</span>
                              <span className="text-sm text-pretty">{appointment.reason}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Insurance:</span>
                              <span className="font-medium text-sm">{appointment.patient.insurance.provider}</span>
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0">
                              <div>ID: {appointment.patient.insurance.id}</div>
                              <div>Co-pay: {formatCurrency(appointment.patient.insurance.copay)}</div>
                            </div>
                            <div>
                              <InsuranceStatusIndicator insurance={appointment.patient.insurance} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-full border-2 border-dashed border-muted rounded-lg flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">No appointment scheduled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
