"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import type { Appointment } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ExternalLink, DollarSign } from "lucide-react"
import { InsuranceStatusIndicator } from "./insurance-status-indicator"
import { InsuranceInfoPopover } from "./insurance-info-popover"
import { PatientFlagsIndicator } from "./patient-flags-indicator"
import { PatientInfoPopover } from "./patient-info-popover"
import { ViewControls } from "./view-controls"
import { Link } from "react-router-dom"
import { isCurrentAppointment, isPastAppointment, formatTime, formatCurrency } from "@/lib/appointment-utils"

interface TodaysPatientsTableProps {
  appointments: Appointment[]
  viewToggle?: React.ReactNode
}

type SortField = "dateTime" | "provider" | "patientName" | "insurance"
type SortDirection = "asc" | "desc"

export function TodaysPatientsTable({ appointments, viewToggle }: TodaysPatientsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("dateTime")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const currentAppointmentRef = useRef<HTMLTableRowElement>(null)

  const uniqueProviders = useMemo(() => {
    const providers = Array.from(new Set(appointments.map((apt) => apt.provider)))
    return providers.sort()
  }, [appointments])

  useMemo(() => {
    if (selectedProviders.length === 0 && uniqueProviders.length > 0) {
      setSelectedProviders(uniqueProviders)
    }
  }, [uniqueProviders, selectedProviders.length])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedAppointments = useMemo(() => {
    const filtered = appointments.filter((apt) => {
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

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "dateTime":
          comparison = a.dateTime.getTime() - b.dateTime.getTime()
          break
        case "provider":
          comparison = a.provider.localeCompare(b.provider)
          break
        case "patientName":
          comparison = a.patient.name.localeCompare(b.patient.name)
          break
        case "insurance":
          comparison = a.patient.insurance.provider.localeCompare(b.patient.insurance.provider)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [appointments, searchQuery, sortField, sortDirection, selectedProviders])

  // Scroll to current appointment on mount
  useEffect(() => {
    if (currentAppointmentRef.current) {
      currentAppointmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [filteredAndSortedAppointments])

  return (
    <div className="space-y-4">
      <ViewControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        providers={uniqueProviders}
        selectedProviders={selectedProviders}
        onProviderSelectionChange={setSelectedProviders}
        filteredCount={filteredAndSortedAppointments.length}
        totalCount={appointments.length}
        viewToggle={viewToggle}
      />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("dateTime")} className="h-8 px-2">
                  Time
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("provider")} className="h-8 px-2">
                  Provider
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("patientName")} className="h-8 px-2">
                  Patient
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>Patient Info</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("insurance")} className="h-8 px-2">
                  Insurance
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason for Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAppointments.map((appointment) => {
              const isPast = isPastAppointment(appointment.dateTime)
              const isCurrent = isCurrentAppointment(appointment.dateTime)

              return (
                <TableRow
                  key={appointment.id}
                  ref={isCurrent ? currentAppointmentRef : null}
                  className={`hover:bg-muted/30 ${isPast ? 'opacity-50' : ''} ${isCurrent ? 'bg-blue-50 dark:bg-blue-950/30 border-l-4 border-l-blue-500' : ''}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {formatTime(appointment.dateTime)}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                  </TableCell>
                <TableCell>{appointment.provider}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <PatientInfoPopover patient={appointment.patient}>
                      <Link
                        to={`/patient/${appointment.patient.id}`}
                        className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {appointment.patient.name}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </PatientInfoPopover>
                    {appointment.patient.flags && <PatientFlagsIndicator flags={appointment.patient.flags} />}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="text-muted-foreground">DOB: {appointment.patient.dob}</div>
                    <div className="text-muted-foreground">{appointment.patient.phone}</div>
                    <div className="text-muted-foreground">ID: {appointment.patient.id}</div>
                    {appointment.patient.balance > 0 && (
                      <div className="flex items-center gap-1 text-amber-600 font-medium">
                        <DollarSign className="h-3 w-3" />
                        Balance: {formatCurrency(appointment.patient.balance)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <InsuranceInfoPopover insurance={appointment.patient.insurance}>
                    <div className="space-y-1 text-sm cursor-pointer">
                      <div className="font-medium">{appointment.patient.insurance.provider}</div>
                      <div className="text-muted-foreground">ID: {appointment.patient.insurance.id}</div>
                      <div className="text-muted-foreground">
                        Co-pay: {formatCurrency(appointment.patient.insurance.copay)}
                      </div>
                    </div>
                  </InsuranceInfoPopover>
                </TableCell>
                <TableCell>
                  <InsuranceStatusIndicator insurance={appointment.patient.insurance} />
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm text-pretty">{appointment.reason}</div>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
