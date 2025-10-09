"use client"

import { useState, useMemo } from "react"
import type { Appointment } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ExternalLink, DollarSign } from "lucide-react"
import { InsuranceStatusIndicator } from "./insurance-status-indicator"
import { PatientFlagsIndicator } from "./patient-flags-indicator"
import { ProviderFilter } from "./provider-filter"
import { Link } from "react-router-dom"

interface TodaysPatientsTableProps {
  appointments: Appointment[]
}

type SortField = "dateTime" | "provider" | "patientName" | "insurance"
type SortDirection = "asc" | "desc"

export function TodaysPatientsTable({ appointments }: TodaysPatientsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("dateTime")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
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
          {filteredAndSortedAppointments.length} of {appointments.length} appointments
        </span>
      </div>

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
            {filteredAndSortedAppointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-muted/30">
                <TableCell className="font-medium">{formatTime(appointment.dateTime)}</TableCell>
                <TableCell>{appointment.provider}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/patient/${appointment.patient.id}`}
                      className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {appointment.patient.name}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
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
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">{appointment.patient.insurance.provider}</div>
                    <div className="text-muted-foreground">ID: {appointment.patient.insurance.id}</div>
                    <div className="text-muted-foreground">
                      Co-pay: {formatCurrency(appointment.patient.insurance.copay)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <InsuranceStatusIndicator insurance={appointment.patient.insurance} />
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm text-pretty">{appointment.reason}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
