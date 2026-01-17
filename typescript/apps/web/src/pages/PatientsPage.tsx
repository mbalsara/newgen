import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Plus, Upload, MoreHorizontal, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { api, type Patient } from '@/lib/api-client'
import { AddPatientModal } from '@/components/patients/add-patient-modal'
import { EditPatientModal } from '@/components/patients/edit-patient-modal'
import { ImportPatientsModal } from '@/components/patients/import-patients-modal'

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const loadPatients = async () => {
    try {
      const data = await api.patients.list()
      setPatients(data)
    } catch (error) {
      console.error('Failed to load patients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPatients()
  }, [])

  const filteredPatients = patients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase()
    const searchLower = search.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.id.toLowerCase().includes(searchLower) ||
      (patient.phone?.includes(search) ?? false)
    )
  })

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowEditModal(true)
  }

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!selectedPatient) return

    try {
      await api.patients.delete(selectedPatient.id)
      loadPatients()
    } catch (error) {
      console.error('Failed to delete patient:', error)
    } finally {
      setShowDeleteDialog(false)
      setSelectedPatient(null)
    }
  }

  // Format phone for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    // Format E.164 to readable format
    if (phone.startsWith('+1') && phone.length === 12) {
      return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`
    }
    return phone
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">View and manage patient records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Patient ID</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading patients...
                </TableCell>
              </TableRow>
            ) : filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {patients.length === 0 ? 'No patients yet. Add or import patients to get started.' : 'No patients found matching your search.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{patient.id}</TableCell>
                  <TableCell>{formatPhone(patient.phone)}</TableCell>
                  <TableCell>{patient.dob || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/patient/${patient.id}`} className="flex items-center">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(patient)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(patient)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AddPatientModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={loadPatients}
      />

      <EditPatientModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        patient={selectedPatient}
        onSuccess={loadPatients}
      />

      <ImportPatientsModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onSuccess={loadPatients}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedPatient?.firstName} {selectedPatient?.lastName}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
