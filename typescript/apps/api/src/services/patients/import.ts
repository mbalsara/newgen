import * as XLSX from 'xlsx'
import { patientService, formatPhoneToE164 } from './service.js'
import { db, appointments, type TaskType } from '@repo/database'
import { taskService } from '../../tasks/service.js'
import { agentService } from '../../agents/service.js'

// Default agent ID for tasks when agent not found
const DEFAULT_AGENT_ID = 'ai-maggi'

// Expected Excel column headers
interface ImportRow {
  'First Name': string
  'Last Name': string
  'phone': string
  'Date of visit'?: string
  'Whether to create task'?: string | boolean
  'Task Type'?: string
  'Agent Name'?: string
}

interface ImportResult {
  success: boolean
  totalRows: number
  patientsCreated: number
  patientsUpdated: number
  appointmentsCreated: number
  tasksCreated: number
  errors: Array<{
    row: number
    error: string
  }>
}

/**
 * Parse Excel file buffer and import patients
 */
export async function importPatientsFromExcel(buffer: Buffer): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRows: 0,
    patientsCreated: 0,
    patientsUpdated: 0,
    appointmentsCreated: 0,
    tasksCreated: 0,
    errors: [],
  }

  try {
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet)
    result.totalRows = rows.length

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 for header row and 1-based indexing

      try {
        // Validate required fields
        const firstName = row['First Name']?.toString().trim()
        const lastName = row['Last Name']?.toString().trim()
        const phone = row['phone']?.toString().trim()

        if (!firstName || !lastName || !phone) {
          result.errors.push({
            row: rowNum,
            error: 'Missing required fields: First Name, Last Name, or phone',
          })
          continue
        }

        // Format phone number
        const formattedPhone = formatPhoneToE164(phone)
        if (!formattedPhone) {
          result.errors.push({
            row: rowNum,
            error: `Invalid phone number: ${phone}`,
          })
          continue
        }

        // Upsert patient
        const { patient, created } = await patientService.upsert({
          firstName,
          lastName,
          phone: formattedPhone,
        })

        if (created) {
          result.patientsCreated++
        } else {
          result.patientsUpdated++
        }

        // Create appointment if visit date provided
        const visitDate = row['Date of visit']
        if (visitDate) {
          try {
            // Parse date (Excel might return a number or string)
            let dateStr: string
            if (typeof visitDate === 'number') {
              // Excel serial date
              const date = XLSX.SSF.parse_date_code(visitDate)
              dateStr = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
            } else {
              // Try to parse as date string
              const parsed = new Date(visitDate)
              if (isNaN(parsed.getTime())) {
                throw new Error(`Invalid date format: ${visitDate}`)
              }
              dateStr = parsed.toISOString().split('T')[0]
            }

            // Insert appointment
            await db.insert(appointments).values({
              patientId: patient.id,
              visitDate: dateStr,
            })
            result.appointmentsCreated++
          } catch (dateError) {
            result.errors.push({
              row: rowNum,
              error: `Failed to create appointment: ${dateError instanceof Error ? dateError.message : 'Unknown error'}`,
            })
          }
        }

        // Create task (default to true unless explicitly set to false/no)
        const createTaskValue = row['Whether to create task']
        const shouldCreateTask = createTaskValue === undefined ||
          createTaskValue === null ||
          createTaskValue === '' ||
          createTaskValue === true ||
          createTaskValue === 'true' ||
          createTaskValue === 'yes' ||
          createTaskValue === 'Yes' ||
          createTaskValue === '1'

        if (shouldCreateTask) {
          try {
            // Get task type (default to post-visit)
            let taskType: TaskType = 'post-visit'
            const requestedType = row['Task Type']?.toString().toLowerCase().trim()
            if (requestedType) {
              const validTypes: TaskType[] = ['confirmation', 'no-show', 'pre-visit', 'post-visit', 'recall', 'collections']
              if (validTypes.includes(requestedType as TaskType)) {
                taskType = requestedType as TaskType
              }
            }

            // Get agent ID (default to DEFAULT_AGENT_ID)
            let agentId = DEFAULT_AGENT_ID
            const requestedAgent = row['Agent Name']?.toString().trim()
            if (requestedAgent) {
              // Try to find agent by ID first, then by name
              const agent = await agentService.getAgentById(requestedAgent)
              if (agent) {
                agentId = agent.id
              } else {
                // Search by name
                const allAgents = await agentService.getAIAgents()
                const foundAgent = allAgents.find(
                  (a: { name: string; id: string }) => a.name.toLowerCase() === requestedAgent.toLowerCase() ||
                       a.id.toLowerCase() === requestedAgent.toLowerCase()
                )
                if (foundAgent) {
                  agentId = foundAgent.id
                }
                // If not found, use default
              }
            }

            // Create task
            await taskService.createTask({
              patientId: patient.id,
              provider: 'Imported',
              type: taskType,
              status: 'pending',
              description: `${taskType.charAt(0).toUpperCase() + taskType.slice(1).replace('-', ' ')} call for ${firstName} ${lastName}`,
              assignedAgentId: agentId,
            })
            result.tasksCreated++
          } catch (taskError) {
            result.errors.push({
              row: rowNum,
              error: `Failed to create task: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`,
            })
          }
        }
      } catch (rowError) {
        result.errors.push({
          row: rowNum,
          error: rowError instanceof Error ? rowError.message : 'Unknown error',
        })
      }
    }

    // Set success based on whether there were critical errors
    result.success = result.patientsCreated > 0 || result.patientsUpdated > 0

  } catch (error) {
    result.success = false
    result.errors.push({
      row: 0,
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }

  return result
}
