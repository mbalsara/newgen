/**
 * Scheduling Routes
 * Webhook endpoints for VAPI scheduling tools
 */

import { Hono } from 'hono'
import { schedulingService } from './service'
import { createEricaBrownPftSquad, getOrCreateEricaBrownPftSquad, deleteAllVapiResources } from './squad-manager'
import {
  CheckAvailabilityRequestSchema,
  BookAppointmentRequestSchema,
  RequestCallbackRequestSchema,
} from '@repo/types'

const scheduling = new Hono()

/**
 * POST /api/scheduling/squad/create
 * Create the Erica Brown PFT Squad in VAPI
 */
scheduling.post('/squad/create', async (c) => {
  try {
    console.log('[Scheduling] Creating Erica Brown PFT Squad...')
    const result = await createEricaBrownPftSquad()
    return c.json(result, 201)
  } catch (error) {
    console.error('[Scheduling] Error creating squad:', error)
    return c.json({ error: 'Failed to create squad', details: String(error) }, 500)
  }
})

/**
 * GET /api/scheduling/squad
 * Get or create the Erica Brown PFT Squad
 */
scheduling.get('/squad', async (c) => {
  try {
    const squadId = await getOrCreateEricaBrownPftSquad()
    return c.json({ squadId })
  } catch (error) {
    console.error('[Scheduling] Error getting squad:', error)
    return c.json({ error: 'Failed to get squad', details: String(error) }, 500)
  }
})

/**
 * DELETE /api/scheduling/vapi/reset
 * Delete all VAPI squads and assistants
 */
scheduling.delete('/vapi/reset', async (c) => {
  try {
    console.log('[Scheduling] Resetting VAPI resources...')
    const result = await deleteAllVapiResources()
    return c.json(result)
  } catch (error) {
    console.error('[Scheduling] Error resetting VAPI:', error)
    return c.json({ error: 'Failed to reset VAPI', details: String(error) }, 500)
  }
})

/**
 * POST /api/scheduling/check-availability
 * VAPI tool webhook: Check available appointment slots
 */
scheduling.post('/check-availability', async (c) => {
  try {
    const body = await c.req.json()
    console.log('[Scheduling] check-availability request:', body)

    // VAPI sends tool call data in a specific format
    // Extract the function arguments
    const args = body.message?.functionCall?.parameters || body

    const parsed = CheckAvailabilityRequestSchema.safeParse(args)
    if (!parsed.success) {
      console.error('[Scheduling] Invalid request:', parsed.error)
      return c.json({
        results: [{
          result: JSON.stringify({
            error: 'Invalid request parameters',
            message: "I'm having trouble accessing the schedule. Let me have someone call you back.",
          })
        }]
      })
    }

    const response = await schedulingService.checkAvailability(parsed.data)

    // Return in VAPI tool response format
    return c.json({
      results: [{
        result: JSON.stringify(response)
      }]
    })
  } catch (error) {
    console.error('[Scheduling] check-availability error:', error)
    return c.json({
      results: [{
        result: JSON.stringify({
          slots: [],
          message: "I'm sorry, I'm having trouble accessing the schedule right now. Let me have someone call you back to help with rescheduling."
        })
      }]
    })
  }
})

/**
 * POST /api/scheduling/book-appointment
 * VAPI tool webhook: Book an appointment
 */
scheduling.post('/book-appointment', async (c) => {
  try {
    const body = await c.req.json()
    console.log('[Scheduling] book-appointment request:', body)

    // Extract the function arguments
    const args = body.message?.functionCall?.parameters || body

    const parsed = BookAppointmentRequestSchema.safeParse(args)
    if (!parsed.success) {
      console.error('[Scheduling] Invalid request:', parsed.error)
      return c.json({
        results: [{
          result: JSON.stringify({
            error: 'Invalid request parameters',
            message: "I'm having trouble booking that appointment. Let me check for other options.",
          })
        }]
      })
    }

    const response = await schedulingService.bookAppointment(parsed.data)

    // Return in VAPI tool response format
    return c.json({
      results: [{
        result: JSON.stringify(response)
      }]
    })
  } catch (error) {
    console.error('[Scheduling] book-appointment error:', error)
    return c.json({
      results: [{
        result: JSON.stringify({
          status: 'failed',
          message: "I'm sorry, that slot was just taken. Let me check for other available times."
        })
      }]
    })
  }
})

/**
 * POST /api/scheduling/request-callback
 * VAPI tool webhook: Request a callback from scheduling staff
 */
scheduling.post('/request-callback', async (c) => {
  try {
    const body = await c.req.json()
    console.log('[Scheduling] request-callback request:', body)

    // Extract the function arguments
    const args = body.message?.functionCall?.parameters || body

    const parsed = RequestCallbackRequestSchema.safeParse(args)
    if (!parsed.success) {
      console.error('[Scheduling] Invalid request:', parsed.error)
      return c.json({
        results: [{
          result: JSON.stringify({
            success: false,
            message: "I've made a note to have someone call you back about scheduling."
          })
        }]
      })
    }

    const response = await schedulingService.requestCallback(parsed.data)

    // Return in VAPI tool response format
    return c.json({
      results: [{
        result: JSON.stringify(response)
      }]
    })
  } catch (error) {
    console.error('[Scheduling] request-callback error:', error)
    return c.json({
      results: [{
        result: JSON.stringify({
          success: true,
          message: "I've requested a callback from our scheduling team."
        })
      }]
    })
  }
})

/**
 * POST /api/scheduling/send-sms-confirmation
 * VAPI tool webhook: Send SMS confirmation after booking
 */
scheduling.post('/send-sms-confirmation', async (c) => {
  try {
    const body = await c.req.json()
    console.log('[Scheduling] send-sms-confirmation request:', body)

    // Extract the function arguments and call info
    const args = body.message?.functionCall?.parameters || body
    const customerNumber = body.call?.customer?.number || body.customer?.number

    if (!customerNumber) {
      console.error('[Scheduling] No customer number available for SMS')
      return c.json({
        results: [{
          result: JSON.stringify({
            success: false,
            message: "I don't have a phone number to send the text to."
          })
        }]
      })
    }

    const { appointmentDate, appointmentTime, providerName, locationOrNotes } = args

    // Send SMS (mock for now - replace with Twilio integration)
    const smsResult = await schedulingService.sendSmsConfirmation({
      phoneNumber: customerNumber,
      appointmentDate: appointmentDate || 'your scheduled date',
      appointmentTime: appointmentTime || 'your scheduled time',
      providerName: providerName || "Dr. Sahai",
      locationOrNotes,
    })

    return c.json({
      results: [{
        result: JSON.stringify(smsResult)
      }]
    })
  } catch (error) {
    console.error('[Scheduling] send-sms-confirmation error:', error)
    return c.json({
      results: [{
        result: JSON.stringify({
          success: true, // Don't fail the call over SMS
          message: "I made a note to send you the confirmation."
        })
      }]
    })
  }
})

export { scheduling as schedulingRoutes }
