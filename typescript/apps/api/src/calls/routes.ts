import { Hono } from 'hono'
import { callService } from './service'
import { getCallEndedReasonDescription } from './vapi-handler'

const calls = new Hono()

// GET /api/calls - List all calls
calls.get('/', async (c) => {
  try {
    const callList = await callService.getCalls()
    return c.json(callList)
  } catch (error) {
    console.error('Error fetching calls:', error)
    return c.json({ error: 'Failed to fetch calls' }, 500)
  }
})

// GET /api/calls/:id - Get call by ID
calls.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const call = await callService.getCallById(id)
    if (!call) {
      return c.json({ error: 'Call not found' }, 404)
    }
    return c.json(call)
  } catch (error) {
    console.error('Error fetching call:', error)
    return c.json({ error: 'Failed to fetch call' }, 500)
  }
})

// GET /api/calls/:id/status - Get call status with transcript (polls VAPI)
calls.get('/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const status = await callService.getCallStatus(id)
    if (!status) {
      return c.json({ error: 'Call not found' }, 404)
    }

    // Add reason description
    const reasonInfo = getCallEndedReasonDescription(status.endedReason)

    return c.json({
      ...status,
      reasonInfo,
    })
  } catch (error) {
    console.error('Error fetching call status:', error)
    return c.json({ error: 'Failed to fetch call status' }, 500)
  }
})

// POST /api/calls/outbound - Start an outbound call
calls.post('/outbound', async (c) => {
  try {
    const body = await c.req.json<{
      taskId: number
      agentId: string
      patientName: string
      customerNumber: string
    }>()

    if (!body.taskId || !body.agentId || !body.patientName || !body.customerNumber) {
      return c.json({
        error: 'Missing required fields: taskId, agentId, patientName, customerNumber'
      }, 400)
    }

    // Get VAPI phone number ID from environment (not from client)
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID
    if (!phoneNumberId) {
      return c.json({ error: 'VAPI_PHONE_NUMBER_ID not configured' }, 500)
    }

    const result = await callService.startOutboundCall({ ...body, phoneNumberId })

    if ('error' in result) {
      return c.json({ error: result.error }, 400)
    }

    return c.json({
      callId: result.vapiCallId,
      call: result.call,
    }, 201)
  } catch (error) {
    console.error('Error starting outbound call:', error)
    return c.json({ error: 'Failed to start call' }, 500)
  }
})

// POST /api/calls/:id/end - End an active call
calls.post('/:id/end', async (c) => {
  try {
    const id = c.req.param('id')
    const success = await callService.endCall(id)
    if (!success) {
      return c.json({ error: 'Failed to end call' }, 400)
    }
    return c.json({ success: true })
  } catch (error) {
    console.error('Error ending call:', error)
    return c.json({ error: 'Failed to end call' }, 500)
  }
})

// POST /api/calls/:id/process - Process call completion (update task)
calls.post('/:id/process', async (c) => {
  try {
    const id = c.req.param('id')
    const result = await callService.processCallCompletion(id)
    if (!result) {
      return c.json({ error: 'Call not found or no associated task' }, 404)
    }
    return c.json(result)
  } catch (error) {
    console.error('Error processing call:', error)
    return c.json({ error: 'Failed to process call' }, 500)
  }
})

// POST /api/calls/webhook - VAPI webhook handler
calls.post('/webhook', async (c) => {
  try {
    const event = await c.req.json()
    console.log('VAPI webhook event:', event.type, event.call?.id)

    await callService.handleWebhook(event)

    return c.json({ success: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return c.json({ error: 'Webhook processing failed' }, 500)
  }
})

// GET /api/calls/task/:taskId - Get calls for a task
calls.get('/task/:taskId', async (c) => {
  try {
    const taskId = parseInt(c.req.param('taskId'), 10)
    if (isNaN(taskId)) {
      return c.json({ error: 'Invalid task ID' }, 400)
    }
    const taskCalls = await callService.getCallsByTask(taskId)
    return c.json(taskCalls)
  } catch (error) {
    console.error('Error fetching calls for task:', error)
    return c.json({ error: 'Failed to fetch calls' }, 500)
  }
})

export { calls as callRoutes }
