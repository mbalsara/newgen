/**
 * Scheduling Routes
 * Webhook endpoints for VAPI scheduling tools
 */

import { Hono } from 'hono'
import { schedulingService } from './service'
import { createTrikaPftSquad, getOrCreateTrikaPftSquad } from './squad-manager'
import {
  CheckAvailabilityRequestSchema,
  BookAppointmentRequestSchema,
  RequestCallbackRequestSchema,
} from '@repo/types'

const scheduling = new Hono()

/**
 * POST /api/scheduling/squad/create
 * Create the Trika PFT Squad in VAPI
 */
scheduling.post('/squad/create', async (c) => {
  try {
    console.log('[Scheduling] Creating Trika PFT Squad...')
    const result = await createTrikaPftSquad()
    return c.json(result, 201)
  } catch (error) {
    console.error('[Scheduling] Error creating squad:', error)
    return c.json({ error: 'Failed to create squad', details: String(error) }, 500)
  }
})

/**
 * GET /api/scheduling/squad
 * Get or create the Trika PFT Squad
 */
scheduling.get('/squad', async (c) => {
  try {
    const squadId = await getOrCreateTrikaPftSquad()
    return c.json({ squadId })
  } catch (error) {
    console.error('[Scheduling] Error getting squad:', error)
    return c.json({ error: 'Failed to get squad', details: String(error) }, 500)
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

export { scheduling as schedulingRoutes }
