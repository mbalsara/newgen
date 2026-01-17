import { Hono } from 'hono'
import { patientService } from './service.js'
import { importPatientsFromExcel } from './import.js'

const patients = new Hono()

// GET /api/patients - List all patients
patients.get('/', async (c) => {
  try {
    const patientList = await patientService.getAll()
    return c.json(patientList)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return c.json({ error: 'Failed to fetch patients' }, 500)
  }
})

// GET /api/patients/:id - Get patient by ID
patients.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const patient = await patientService.getById(id)

    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404)
    }

    return c.json(patient)
  } catch (error) {
    console.error('Error fetching patient:', error)
    return c.json({ error: 'Failed to fetch patient' }, 500)
  }
})

// POST /api/patients - Create patient
patients.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      firstName: string
      lastName: string
      phone: string
      dob?: string
    }>()

    if (!body.firstName || !body.lastName || !body.phone) {
      return c.json({
        error: 'Missing required fields: firstName, lastName, phone'
      }, 400)
    }

    const patient = await patientService.create(body)
    return c.json(patient, 201)
  } catch (error) {
    console.error('Error creating patient:', error)
    const message = error instanceof Error ? error.message : 'Failed to create patient'
    return c.json({ error: message }, 400)
  }
})

// PATCH /api/patients/:id - Update patient
patients.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json<{
      firstName?: string
      lastName?: string
      phone?: string
      dob?: string
    }>()

    const patient = await patientService.update(id, body)
    return c.json(patient)
  } catch (error) {
    console.error('Error updating patient:', error)
    const message = error instanceof Error ? error.message : 'Failed to update patient'
    return c.json({ error: message }, 400)
  }
})

// DELETE /api/patients/:id - Delete patient
patients.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const deleted = await patientService.delete(id)

    if (!deleted) {
      return c.json({ error: 'Patient not found' }, 404)
    }

    return c.json({ success: true })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return c.json({ error: 'Failed to delete patient' }, 500)
  }
})

// POST /api/patients/import - Import patients from Excel file
patients.post('/import', async (c) => {
  try {
    const contentType = c.req.header('Content-Type') || ''

    // Handle multipart form data
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return c.json({ error: 'No file provided' }, 400)
      }

      // Check file type
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        return c.json({ error: 'File must be an Excel file (.xlsx or .xls)' }, 400)
      }

      // Read file as buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Import patients
      const result = await importPatientsFromExcel(buffer)
      return c.json(result)
    }

    // Handle raw binary data (for testing)
    const buffer = Buffer.from(await c.req.arrayBuffer())
    if (buffer.length === 0) {
      return c.json({ error: 'No file data provided' }, 400)
    }

    const result = await importPatientsFromExcel(buffer)
    return c.json(result)
  } catch (error) {
    console.error('Error importing patients:', error)
    const message = error instanceof Error ? error.message : 'Failed to import patients'
    return c.json({ error: message }, 500)
  }
})

export { patients as patientRoutes }
