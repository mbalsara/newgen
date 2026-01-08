import { useState } from 'react'
import { Link } from 'react-router'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, ExternalLink } from 'lucide-react'
import { todaysAppointments } from '@/lib/mock-data'
import type { Appointment, Patient } from '@/lib/types'

export default function PatientsPage() {
  const [search, setSearch] = useState('')

  // Get unique patients from mock appointments
  const patients = todaysAppointments
    .map((a: Appointment) => a.patient)
    .filter((patient: Patient, index: number, self: Patient[]) =>
      index === self.findIndex((p: Patient) => p.id === patient.id)
    )

  const filteredPatients = patients.filter(
    (patient: Patient) =>
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Patients</h1>
        <p className="text-muted-foreground">View and manage patient records</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Patient ID</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Insurance</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient: Patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">{patient.name}</TableCell>
                <TableCell className="text-muted-foreground">{patient.id}</TableCell>
                <TableCell>{patient.dob}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      patient.insurance.status === 'valid'
                        ? 'default'
                        : patient.insurance.status === 'pending'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {patient.insurance.provider}
                  </Badge>
                </TableCell>
                <TableCell>
                  {patient.balance > 0 ? (
                    <span className="text-red-600">${patient.balance.toFixed(2)}</span>
                  ) : (
                    <span className="text-muted-foreground">$0.00</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link
                    to={`/patient/${patient.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {filteredPatients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No patients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
