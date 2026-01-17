import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api-client'

interface ImportPatientsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface ImportResult {
  success: boolean
  totalRows: number
  patientsCreated: number
  patientsUpdated: number
  appointmentsCreated: number
  tasksCreated: number
  errors: Array<{ row: number; error: string }>
}

export function ImportPatientsModal({ open, onOpenChange, onSuccess }: ImportPatientsModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setError('Please select an Excel file (.xlsx or .xls)')
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const importResult = await api.patients.import(file)
      setResult(importResult)
      if (importResult.success) {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Patients</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import patients, appointments, and tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Expected columns info */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Expected Excel columns:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><span className="font-medium">First Name</span> (required)</li>
              <li><span className="font-medium">Last Name</span> (required)</li>
              <li><span className="font-medium">phone</span> (required)</li>
              <li><span className="font-medium">Date of visit</span> (optional - creates appointment)</li>
              <li><span className="font-medium">Whether to create task</span> (optional - true/yes/1)</li>
              <li><span className="font-medium">Task Type</span> (optional - confirmation, no-show, pre-visit, post-visit, recall, collections)</li>
              <li><span className="font-medium">Agent Name</span> (optional - defaults to ai-maggi)</li>
            </ul>
          </div>

          {/* File input */}
          {!result && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Click to select an Excel file</p>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                </>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Import result */}
          {result && (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 ${result.success ? 'text-green-600' : 'text-yellow-600'}`}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {result.success ? 'Import completed' : 'Import completed with warnings'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-muted-foreground">Patients Created</p>
                  <p className="font-semibold text-lg">{result.patientsCreated}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-muted-foreground">Patients Updated</p>
                  <p className="font-semibold text-lg">{result.patientsUpdated}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-muted-foreground">Appointments Created</p>
                  <p className="font-semibold text-lg">{result.appointmentsCreated}</p>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <p className="text-muted-foreground">Tasks Created</p>
                  <p className="font-semibold text-lg">{result.tasksCreated}</p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-sm mb-2 text-yellow-600">
                    {result.errors.length} row(s) had errors:
                  </p>
                  <div className="max-h-32 overflow-y-auto bg-muted/50 rounded p-2 text-sm">
                    {result.errors.map((err, idx) => (
                      <p key={idx} className="text-muted-foreground">
                        Row {err.row}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!file || isLoading}>
                {isLoading ? 'Importing...' : 'Import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
