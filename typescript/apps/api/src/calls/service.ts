import { callRepository } from './repository'
import { vapiApi, parseVapiMessages, detectAbusiveLanguage, shouldCompleteTask, getCallEndedReasonDescription } from './vapi-handler'
import { taskService } from '../tasks/service'
import { agentService } from '../agents/service'
import type { Call, NewCall, TranscriptMessage } from '@repo/database'

export const callService = {
  // Get all calls
  async getCalls(): Promise<Call[]> {
    return callRepository.findAll()
  },

  // Get call by ID
  async getCallById(id: string): Promise<Call | undefined> {
    return callRepository.findById(id)
  },

  // Get calls for a task
  async getCallsByTask(taskId: number): Promise<Call[]> {
    return callRepository.findByTaskId(taskId)
  },

  // Start an outbound call
  async startOutboundCall(params: {
    taskId: number
    agentId: string
    patientName: string
    phoneNumberId: string // VAPI phone number ID
    customerNumber: string // Patient phone number
  }): Promise<{ call: Call; vapiCallId: string } | { error: string }> {
    // Get the agent's VAPI assistant ID
    const agent = await agentService.getAgentById(params.agentId)
    if (!agent || !agent.vapiAssistantId) {
      return { error: 'Agent not found or has no VAPI assistant ID' }
    }

    // Start the VAPI call
    const vapiResult = await vapiApi.startCall({
      assistantId: agent.vapiAssistantId,
      phoneNumber: params.phoneNumberId,
      customerNumber: params.customerNumber,
      assistantOverrides: {
        variableValues: {
          patient_name: params.patientName,
        },
      },
    })

    if (!vapiResult) {
      return { error: 'Failed to start VAPI call' }
    }

    // Create call record
    const call = await callRepository.create({
      id: vapiResult.id,
      taskId: params.taskId,
      agentId: params.agentId,
      phoneNumber: params.customerNumber,
      status: 'queued',
      startedAt: new Date(),
    })

    return { call, vapiCallId: vapiResult.id }
  },

  // Get call status with transcript (polls VAPI)
  async getCallStatus(callId: string): Promise<{
    status: string
    endedReason?: string
    messages: TranscriptMessage[]
    hasAbusiveLanguage: boolean
  } | null> {
    // Fetch from VAPI
    const vapiStatus = await vapiApi.getCallStatus(callId)
    if (!vapiStatus) {
      // Fallback to local record
      const localCall = await callRepository.findById(callId)
      if (localCall) {
        return {
          status: localCall.status,
          endedReason: localCall.endedReason ?? undefined,
          messages: localCall.messages || [],
          hasAbusiveLanguage: localCall.hasAbusiveLanguage || false,
        }
      }
      return null
    }

    // Parse messages
    const messages = parseVapiMessages(vapiStatus)
    const hasAbusiveLanguage = detectAbusiveLanguage(messages)

    // Update local record
    await callRepository.update(callId, {
      status: vapiStatus.status === 'ended' ? 'ended' : 'in-progress',
      endedReason: vapiStatus.endedReason,
      messages,
      hasAbusiveLanguage,
      transcript: vapiStatus.artifact?.transcript || vapiStatus.transcript,
    })

    return {
      status: vapiStatus.status,
      endedReason: vapiStatus.endedReason,
      messages,
      hasAbusiveLanguage,
    }
  },

  // End a call
  async endCall(callId: string): Promise<boolean> {
    const success = await vapiApi.endCall(callId)
    if (success) {
      await callRepository.update(callId, {
        status: 'ended',
        endedReason: 'manually-canceled',
        endedAt: new Date(),
      })
    }
    return success
  },

  // Process call completion (update task based on outcome)
  async processCallCompletion(callId: string): Promise<{
    action: 'completed' | 'escalated' | 'flagged'
    message: string
  } | null> {
    const call = await callRepository.findById(callId)
    if (!call || !call.taskId) return null

    const task = await taskService.getTaskById(call.taskId)
    if (!task) return null

    // Add call event to task timeline
    await taskService.addCallEvent(call.taskId, {
      endedReason: call.endedReason || 'unknown',
      transcript: call.transcript ?? undefined,
    })

    // Check for abusive language
    if (call.hasAbusiveLanguage) {
      // Flag patient and escalate
      await taskService.escalateTask(
        call.taskId,
        'sarah', // Default staff for escalation
        'Patient flagged for abusive language during call'
      )
      return {
        action: 'flagged',
        message: 'Patient flagged for abusive language. Task escalated for review.',
      }
    }

    // Determine outcome based on ended reason
    const reasonInfo = getCallEndedReasonDescription(call.endedReason)

    if (reasonInfo.isSuccess) {
      await taskService.completeTask(call.taskId, reasonInfo.description)
      return {
        action: 'completed',
        message: reasonInfo.description,
      }
    } else {
      // Escalate for follow-up
      await taskService.escalateTask(
        call.taskId,
        'sarah',
        `Call outcome: ${reasonInfo.title} - ${reasonInfo.description}`
      )
      return {
        action: 'escalated',
        message: `${reasonInfo.title}: ${reasonInfo.description}`,
      }
    }
  },

  // VAPI webhook handler
  async handleWebhook(event: {
    type: string
    call?: {
      id: string
      status?: string
      endedReason?: string
    }
    message?: {
      role: string
      message: string
      time?: number
    }
  }): Promise<void> {
    const callId = event.call?.id
    if (!callId) return

    switch (event.type) {
      case 'call-started':
        await callRepository.updateStatus(callId, 'in-progress')
        break

      case 'transcript':
        if (event.message) {
          await callRepository.appendMessage(callId, {
            speaker: event.message.role === 'assistant' ? 'ai' : 'patient',
            text: event.message.message,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          })
        }
        break

      case 'call-ended':
        // Update call record
        await callRepository.update(callId, {
          status: 'ended',
          endedReason: event.call?.endedReason,
          endedAt: new Date(),
        })

        // Check for abusive language
        const call = await callRepository.findById(callId)
        if (call) {
          const hasAbusive = detectAbusiveLanguage(call.messages || [])
          if (hasAbusive) {
            await callRepository.update(callId, { hasAbusiveLanguage: true })
          }

          // Process call completion
          await this.processCallCompletion(callId)
        }
        break
    }
  },
}
