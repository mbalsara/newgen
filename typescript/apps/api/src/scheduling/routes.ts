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
 * Helper to extract VAPI tool call data from request body
 * VAPI sends tool calls in the format: message.toolCallList[].id and message.toolCallList[].arguments
 */
function extractVapiToolCall(body: Record<string, unknown>): {
  toolCallId: string | undefined
  args: Record<string, unknown>
} {
  const message = body.message as Record<string, unknown> | undefined

  // VAPI's primary format: message.toolCallList[]
  const toolCallList = message?.toolCallList as Array<{
    id?: string
    name?: string
    arguments?: Record<string, unknown>
    function?: { arguments?: Record<string, unknown> }
  }> | undefined

  // Fallback formats
  const toolCalls = message?.toolCalls as Array<{
    id?: string
    function?: { arguments?: Record<string, unknown> }
  }> | undefined

  const functionCall = message?.functionCall as {
    id?: string
    parameters?: Record<string, unknown>
  } | undefined

  const toolCall = body.toolCall as {
    id?: string
    function?: { arguments?: Record<string, unknown> }
  } | undefined

  // Extract toolCallId - MUST be returned in response for VAPI to match
  const toolCallId = toolCallList?.[0]?.id
    || toolCalls?.[0]?.id
    || functionCall?.id
    || toolCall?.id
    || (body.toolCallId as string | undefined)

  // Extract arguments - VAPI uses .arguments directly on toolCallList, not .function.arguments
  const args = toolCallList?.[0]?.arguments
    || toolCallList?.[0]?.function?.arguments
    || functionCall?.parameters
    || toolCalls?.[0]?.function?.arguments
    || toolCall?.function?.arguments
    || body as Record<string, unknown>

  return { toolCallId, args }
}

/**
 * Helper to create VAPI tool response format
 * IMPORTANT: Must include toolCallId for VAPI to match response to request
 */
function createVapiToolResponse(toolCallId: string | undefined, result: unknown) {
  const response = {
    results: [{
      ...(toolCallId && { toolCallId }),
      result: typeof result === 'string' ? result : JSON.stringify(result)
    }]
  }
  console.log('[Scheduling] Sending VAPI response:', JSON.stringify(response, null, 2))
  return response
}

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
 * GET /api/scheduling/health
 * Verify scheduling endpoints are working
 */
scheduling.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    endpoints: {
      checkAvailability: '/api/scheduling/check-availability',
      bookAppointment: '/api/scheduling/book-appointment',
      requestCallback: '/api/scheduling/request-callback',
      sendSmsConfirmation: '/api/scheduling/send-sms-confirmation',
    },
    webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'NOT SET',
  })
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
  let toolCallId: string | undefined

  try {
    const body = await c.req.json()
    console.log('[Scheduling] ========== CHECK-AVAILABILITY CALLED ==========')
    console.log('[Scheduling] Full request body:', JSON.stringify(body, null, 2))

    // Extract tool call data including the critical toolCallId
    const extracted = extractVapiToolCall(body)
    toolCallId = extracted.toolCallId
    const args = extracted.args

    console.log('[Scheduling] Extracted toolCallId:', toolCallId)
    console.log('[Scheduling] Extracted args:', args)

    const parsed = CheckAvailabilityRequestSchema.safeParse(args)
    if (!parsed.success) {
      console.error('[Scheduling] Invalid request:', parsed.error)
      return c.json(createVapiToolResponse(toolCallId, {
        error: 'Invalid request parameters',
        message: "I'm having trouble accessing the schedule. Let me have someone call you back.",
      }))
    }

    const response = await schedulingService.checkAvailability(parsed.data)

    // Return in VAPI tool response format with toolCallId
    return c.json(createVapiToolResponse(toolCallId, response))
  } catch (error) {
    console.error('[Scheduling] check-availability error:', error)
    return c.json(createVapiToolResponse(toolCallId, {
      slots: [],
      message: "I'm sorry, I'm having trouble accessing the schedule right now. Let me have someone call you back to help with rescheduling."
    }))
  }
})

/**
 * POST /api/scheduling/book-appointment
 * VAPI tool webhook: Book an appointment
 */
scheduling.post('/book-appointment', async (c) => {
  let toolCallId: string | undefined

  try {
    const body = await c.req.json()
    console.log('[Scheduling] ========== BOOK-APPOINTMENT CALLED ==========')
    console.log('[Scheduling] Full request body:', JSON.stringify(body, null, 2))

    // Extract tool call data including the critical toolCallId
    const extracted = extractVapiToolCall(body)
    toolCallId = extracted.toolCallId
    const args = extracted.args

    console.log('[Scheduling] Extracted toolCallId:', toolCallId)
    console.log('[Scheduling] Extracted args:', args)

    const parsed = BookAppointmentRequestSchema.safeParse(args)
    if (!parsed.success) {
      console.error('[Scheduling] Invalid request:', parsed.error)
      return c.json(createVapiToolResponse(toolCallId, {
        error: 'Invalid request parameters',
        message: "I'm having trouble booking that appointment. Let me check for other options.",
      }))
    }

    const response = await schedulingService.bookAppointment(parsed.data)

    // Return in VAPI tool response format with toolCallId
    return c.json(createVapiToolResponse(toolCallId, response))
  } catch (error) {
    console.error('[Scheduling] book-appointment error:', error)
    return c.json(createVapiToolResponse(toolCallId, {
      status: 'failed',
      message: "I'm sorry, that slot was just taken. Let me check for other available times."
    }))
  }
})

/**
 * POST /api/scheduling/request-callback
 * VAPI tool webhook: Request a callback from scheduling staff
 */
scheduling.post('/request-callback', async (c) => {
  let toolCallId: string | undefined

  try {
    const body = await c.req.json()
    console.log('[Scheduling] ========== REQUEST-CALLBACK CALLED ==========')
    console.log('[Scheduling] Full request body:', JSON.stringify(body, null, 2))

    // Extract tool call data including the critical toolCallId
    const extracted = extractVapiToolCall(body)
    toolCallId = extracted.toolCallId
    const args = extracted.args

    console.log('[Scheduling] Extracted toolCallId:', toolCallId)
    console.log('[Scheduling] Extracted args:', args)

    const parsed = RequestCallbackRequestSchema.safeParse(args)
    if (!parsed.success) {
      console.error('[Scheduling] Invalid request:', parsed.error)
      return c.json(createVapiToolResponse(toolCallId, {
        success: false,
        message: "I've made a note to have someone call you back about scheduling."
      }))
    }

    const response = await schedulingService.requestCallback(parsed.data)

    // Return in VAPI tool response format with toolCallId
    return c.json(createVapiToolResponse(toolCallId, response))
  } catch (error) {
    console.error('[Scheduling] request-callback error:', error)
    return c.json(createVapiToolResponse(toolCallId, {
      success: true,
      message: "I've requested a callback from our scheduling team."
    }))
  }
})

/**
 * POST /api/scheduling/handoff-destination
 * VAPI dynamic handoff webhook: Determine where to transfer back
 * Called when scheduler uses handoff_to_primary tool
 */
scheduling.post('/handoff-destination', async (c) => {
  try {
    const body = await c.req.json()
    console.log('[Scheduling] handoff-destination request:', JSON.stringify(body, null, 2))

    // Extract call info to determine the primary agent
    // VAPI should send the squad members and call context
    const call = body.call
    const squad = call?.squad
    const currentAssistantId = call?.assistantId

    // Find the primary agent (the one that's NOT the scheduler)
    let primaryAgentName: string | null = null

    if (squad?.members) {
      for (const member of squad.members) {
        // Skip the current assistant (scheduler)
        if (member.assistantId === currentAssistantId) continue

        // This is the primary agent
        if (member.assistant?.name) {
          primaryAgentName = member.assistant.name
          break
        }
      }
    }

    // Fallback: look at conversation history to find who handed off to scheduler
    if (!primaryAgentName && call?.messages) {
      // Find the last handoff message to scheduler
      for (let i = call.messages.length - 1; i >= 0; i--) {
        const msg = call.messages[i]
        if (msg.role === 'tool_calls' && msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            if (tc.function?.name === 'handoff_to_scheduler') {
              // The assistant before this handoff is our primary
              // Look backwards for the assistant name
              for (let j = i - 1; j >= 0; j--) {
                if (call.messages[j].role === 'assistant') {
                  // This was the primary agent speaking
                  primaryAgentName = call.messages[j].name || 'Primary Agent'
                  break
                }
              }
              break
            }
          }
        }
        if (primaryAgentName) break
      }
    }

    if (!primaryAgentName) {
      console.error('[Scheduling] Could not determine primary agent for handoff')
      // Return error - handoff won't happen
      return c.json({
        error: "Could not determine which agent to return to. Continuing with scheduler."
      })
    }

    console.log(`[Scheduling] Handoff destination: ${primaryAgentName}`)

    // Return the destination for VAPI to transfer to
    return c.json({
      destination: {
        type: 'assistant',
        assistantName: primaryAgentName,
      }
    })
  } catch (error) {
    console.error('[Scheduling] handoff-destination error:', error)
    return c.json({
      error: "Error determining handoff destination"
    })
  }
})

/**
 * POST /api/scheduling/send-sms-confirmation
 * VAPI tool webhook: Send SMS confirmation after booking
 */
scheduling.post('/send-sms-confirmation', async (c) => {
  let toolCallId: string | undefined

  try {
    const body = await c.req.json()
    console.log('[Scheduling] ========== SEND-SMS-CONFIRMATION CALLED ==========')
    console.log('[Scheduling] Full request body:', JSON.stringify(body, null, 2))

    // Extract tool call data including the critical toolCallId
    const extracted = extractVapiToolCall(body)
    toolCallId = extracted.toolCallId
    const args = extracted.args as Record<string, string>

    console.log('[Scheduling] Extracted toolCallId:', toolCallId)
    console.log('[Scheduling] Extracted args:', args)

    // Try multiple paths where VAPI might put customer info
    const call = body.call as Record<string, unknown> | undefined
    const message = body.message as Record<string, unknown> | undefined
    const messageCall = message?.call as Record<string, unknown> | undefined

    // Check all possible locations for customer number
    const phoneNumber =
      (call?.customer as Record<string, string>)?.number ||
      (messageCall?.customer as Record<string, string>)?.number ||
      (body.customer as Record<string, string>)?.number ||
      args.phoneNumber ||  // In case agent passed it as argument
      null

    console.log('[Scheduling] Found phone number:', phoneNumber || 'NONE')

    if (!phoneNumber) {
      console.log('[Scheduling] No customer number found - asking agent to get it')
      return c.json(createVapiToolResponse(toolCallId, {
        success: false,
        needsPhoneNumber: true,
        message: "I need a phone number to send the text. Ask the patient for their phone number."
      }))
    }

    const { appointmentDate, appointmentTime, providerName, locationOrNotes } = args

    // Send SMS (mock for now - replace with Twilio integration)
    const smsResult = await schedulingService.sendSmsConfirmation({
      phoneNumber,
      appointmentDate: appointmentDate || 'your scheduled date',
      appointmentTime: appointmentTime || 'your scheduled time',
      providerName: providerName || "Dr. Sahai",
      locationOrNotes,
    })

    return c.json(createVapiToolResponse(toolCallId, smsResult))
  } catch (error) {
    console.error('[Scheduling] send-sms-confirmation error:', error)
    return c.json(createVapiToolResponse(toolCallId, {
      success: true, // Don't fail the call over SMS
      message: "I made a note to send you the confirmation."
    }))
  }
})

export { scheduling as schedulingRoutes }
