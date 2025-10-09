"use client"

import { useMemo, useState } from "react"
import type { Appointment } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { InsuranceStatusIndicator } from "./insurance-status-indicator"
import { PatientFlagsIndicator } from "./patient-flags-indicator"
import { ProviderFilter } from "./provider-filter"
import { Input } from "@/components/ui/input"
import { Clock, DollarSign } from "lucide-react"
import { Link } from "react-router-dom"

interface TodaysPatientsCalendarProps {
  appointments: Appointment[]
}

export function TodaysPatientsCalendar({ appointments }: TodaysPatientsCalendarProps) {
  const currentTime = new Date()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])

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

  const isCurrentTimeSlot = (slotTime: Date) => {
    return currentTime.getHours() === slotTime.getHours()
  }

  const isPastSlot = (slotTime: Date) => {
    return currentTime.getHours() > slotTime.getHours()
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProviderFilter
          providers={uniqueProviders}
          selectedProviders={selectedProviders}
          onSelectionChange={setSelectedProviders}
        />
        <Input
          placeholder="Search patients, providers, insurance, reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <span className="text-sm text-muted-foreground">
          {filteredAppointments.length} of {appointments.length} appointments
        </span>
      </div>

      <div className="space-y-2">
        {timeSlots.map((slot) => {
          const appointment = getAppointmentForSlot(slot)
          const isCurrent = isCurrentTimeSlot(slot)
          const isPast = isPastSlot(slot)

          return (
            <div key={slot.toISOString()} className="relative">
              {isCurrent && (
                <div className="absolute left-0 right-0 top-0 flex items-center z-10">
                  <div className="flex-1 h-0.5 bg-red-500" />
                  <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                    <Clock className="h-3 w-3" />
                    Current Time
                  </div>
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}

              <div className={`flex gap-4 ${isCurrent ? "mt-8" : ""}`}>
                <div className="w-24 flex-shrink-0 pt-2">
                  <div className={`text-sm font-medium ${isPast ? "text-muted-foreground" : "text-foreground"}`}>
                    {formatTime(slot)}
                  </div>
                </div>

                <div className="flex-1 min-h-[60px]">
                  {appointment ? (
                    <Card
                      className={`h-full transition-all hover:shadow-md ${
                        isPast ? "opacity-60" : ""
                      } border-l-4 border-l-primary`}
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
