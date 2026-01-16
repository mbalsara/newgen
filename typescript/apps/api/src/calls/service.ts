import { callRepository } from './repository'
import { vapiApi, parseVapiMessages, detectAbusiveLanguage, shouldCompleteTask, getCallEndedReasonDescription } from './vapi-handler'
import { taskService } from '../tasks/service'
import { agentService } from '../agents/service'
import { buildCallPrompt, buildAssistantOverrides, type PatientContext } from '../agents/prompt-builder'
import type { Call, NewCall, TranscriptMessage, Agent } from '@repo/database'

// Agent IDs that use squads (vapiAssistantId contains squad ID, not assistant ID)
const SQUAD_ENABLED_AGENTS = new Set(['ai-trika-pft'])

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

  // Start an outbound call with runtime prompt injection
  async startOutboundCall(params: {
    taskId: number
    agentId: string
    patientName: string
    phoneNumberId: string // VAPI phone number ID
    customerNumber: string // Patient phone number
    patientContext?: PatientContext // Optional patient context for prompt variables
  }): Promise<{ call: Call; vapiCallId: string } | { error: string }> {
    // Get the agent's VAPI assistant ID and config
    const agent = await agentService.getAgentById(params.agentId)
    if (!agent || !agent.vapiAssistantId) {
      return { error: 'Agent not found or has no VAPI assistant ID' }
    }

    // Get the task with patient info for prompt building
    const task = await taskService.getTaskById(params.taskId)
    if (!task) {
      return { error: 'Task not found' }
    }

    // Build runtime prompt configuration from agent config
    const promptConfig = buildCallPrompt({
      agent,
      task,
      patientContext: params.patientContext,
    })

    // Build VAPI assistant overrides (pass agent for model provider info)
    const assistantOverrides = buildAssistantOverrides(promptConfig, agent)

    // Check if this agent uses a squad (vapiAssistantId is squad ID)
    let vapiResult: { id: string; status: string } | null = null

    if (SQUAD_ENABLED_AGENTS.has(params.agentId)) {
      // Use squad - vapiAssistantId contains the squad ID
      const squadId = agent.vapiAssistantId
      console.log(`[CALL] Starting squad call for agent ${params.agentId}, squad: ${squadId}`)

      vapiResult = await vapiApi.startCall({
        squadId,
        phoneNumber: params.phoneNumberId,
        customerNumber: params.customerNumber,
        variableValues: {
          patient_name: params.patientName,
          agent_name: agent.name,
          provider_id: 'dr-sahai',
        },
      })
    } else {
      // Use single assistant for agents without handoffs
      vapiResult = await vapiApi.startCall({
        assistantId: agent.vapiAssistantId,
        phoneNumber: params.phoneNumberId,
        customerNumber: params.customerNumber,
        assistantOverrides,
      })
    }

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
    recordingUrl?: string
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
    const recordingUrl = vapiStatus.artifact?.recordingUrl || vapiStatus.recordingUrl

    // Update local record
    await callRepository.update(callId, {
      status: vapiStatus.status === 'ended' ? 'ended' : 'in-progress',
      endedReason: vapiStatus.endedReason,
      messages,
      hasAbusiveLanguage,
      transcript: vapiStatus.artifact?.transcript || vapiStatus.transcript,
      recordingUrl,
    })

    return {
      status: vapiStatus.status,
      endedReason: vapiStatus.endedReason,
      messages,
      hasAbusiveLanguage,
      recordingUrl,
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
    action: 'completed' | 'escalated' | 'flagged' | 'retry_scheduled' | 'voicemail'
    message: string
  } | null> {
    let call = await callRepository.findById(callId)
    if (!call || !call.taskId) return null

    // Always fetch latest call data from VAPI to get recording, transcript, and analysis
    console.log('[CALL] Fetching latest data from VAPI for call:', callId)
    let vapiCall = await vapiApi.getCallStatus(callId)
    console.log('[CALL] VAPI response:', JSON.stringify({
      status: vapiCall?.status,
      hasRecordingUrl: !!vapiCall?.recordingUrl,
      hasStereoRecordingUrl: !!vapiCall?.stereoRecordingUrl,
      hasArtifactRecordingUrl: !!vapiCall?.artifact?.recordingUrl,
      hasTranscript: !!vapiCall?.transcript,
      hasArtifactTranscript: !!vapiCall?.artifact?.transcript,
      hasAnalysis: !!vapiCall?.analysis,
      analysis: vapiCall?.analysis,
      summary: vapiCall?.summary,
    }))

    // Retry loop - wait for recording AND analysis (VAPI generates analysis async)
    let retries = 0
    const maxRetries = 8
    const hasRecording = () => vapiCall?.artifact?.recordingUrl || vapiCall?.recordingUrl || vapiCall?.stereoRecordingUrl
    const hasAnalysis = () => vapiCall?.analysis?.structuredData && Object.keys(vapiCall.analysis.structuredData).length > 0

    while (retries < maxRetries && vapiCall && (!hasRecording() || !hasAnalysis())) {
      console.log('[CALL] Waiting for data, retry:', retries + 1, '- hasRecording:', !!hasRecording(), 'hasAnalysis:', !!hasAnalysis())
      await new Promise(resolve => setTimeout(resolve, 3000))
      vapiCall = await vapiApi.getCallStatus(callId)
      console.log('[CALL] VAPI retry response:', JSON.stringify({
        hasRecordingUrl: !!vapiCall?.recordingUrl,
        hasArtifactRecordingUrl: !!vapiCall?.artifact?.recordingUrl,
        hasAnalysis: !!vapiCall?.analysis?.structuredData,
      }))
      retries++
    }

    if (vapiCall) {
      const messages = parseVapiMessages(vapiCall)
      // Try multiple sources for recording URL
      const recordingUrl = vapiCall.artifact?.recordingUrl || vapiCall.recordingUrl || vapiCall.stereoRecordingUrl
      console.log('[CALL] Final recording URL:', recordingUrl)
      console.log('[CALL] Final analysis:', JSON.stringify(vapiCall.analysis))
      console.log('[CALL] Final summary:', vapiCall.summary || vapiCall.analysis?.summary)

      await callRepository.update(callId, {
        messages,
        transcript: vapiCall.artifact?.transcript || vapiCall.transcript,
        recordingUrl,
        analysis: vapiCall.analysis,
        summary: vapiCall.summary || vapiCall.analysis?.summary,
      })
      // Re-fetch the updated call
      call = await callRepository.findById(callId)
      if (!call) return null
    }

    const task = await taskService.getTaskById(call.taskId)
    if (!task) return null

    // Get the agent for retry/fallback settings
    const agent = call.agentId ? await agentService.getAgentById(call.agentId) : null

    // Calculate call duration in seconds
    const duration = call.startedAt && call.endedAt
      ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
      : 0

    // Add call event to task timeline with transcript and recording
    console.log('[CALL] Adding call event to task timeline:', {
      taskId: call.taskId,
      endedReason: call.endedReason,
      hasTranscript: !!call.transcript,
      messageCount: call.messages?.length || 0,
      hasRecordingUrl: !!call.recordingUrl,
      hasAnalysis: !!(call as any).analysis,
      hasSummary: !!(call as any).summary,
    })

    await taskService.addCallEvent(call.taskId, {
      endedReason: call.endedReason || 'unknown',
      transcript: call.transcript ?? undefined,
      messages: call.messages ?? undefined,
      recordingUrl: call.recordingUrl ?? undefined,
      analysis: (call as any).analysis ?? undefined,
      summary: (call as any).summary ?? undefined,
    })

    // Check for abusive language
    if (call.hasAbusiveLanguage) {
      // Flag patient and escalate
      const fallbackStaff = await this.findFallbackStaff(agent)
      await taskService.escalateTask(
        call.taskId,
        fallbackStaff,
        'Patient flagged for abusive language during call'
      )
      return {
        action: 'flagged',
        message: 'Patient flagged for abusive language. Task escalated for review.',
      }
    }

    // Determine outcome based on ended reason
    const reasonInfo = getCallEndedReasonDescription(call.endedReason)

    // Handle voicemail - not a complete success, schedule retry
    if (call.endedReason === 'voicemail') {
      await taskService.recordVoicemail(call.taskId, callId)
      await taskService.recordRetryAttempt(call.taskId, callId, 'voicemail', duration)

      // Check if max retries exceeded
      const exceededRetries = await taskService.hasExceededMaxRetries(call.taskId)
      if (exceededRetries) {
        const fallbackStaff = await this.findFallbackStaff(agent)
        await taskService.escalateTask(
          call.taskId,
          fallbackStaff,
          `Maximum retry attempts reached. Last outcome: voicemail`
        )
        return {
          action: 'escalated',
          message: 'Max retries exceeded after voicemail attempts. Task escalated.',
        }
      }

      // Schedule retry
      const delayMinutes = agent?.retryDelayMinutes || 60
      await taskService.scheduleRetry(call.taskId, 'Voicemail left, awaiting callback or retry', delayMinutes)
      return {
        action: 'voicemail',
        message: 'Voicemail left. Retry scheduled.',
      }
    }

    // Handle success cases
    if (reasonInfo.isSuccess) {
      await taskService.clearRetrySchedule(call.taskId)
      await taskService.completeTask(call.taskId, reasonInfo.description)
      return {
        action: 'completed',
        message: reasonInfo.description,
      }
    }

    // Handle retryable failures (no-answer, busy, disconnected, etc.)
    if (reasonInfo.canRetry) {
      // Map ended reason to outcome string
      const outcomeMap: Record<string, string> = {
        'customer-did-not-answer': 'no-answer',
        'customer-busy': 'busy',
        'customer-ended-call': 'disconnected',
        'silence-timed-out': 'disconnected',
        'exceeded-max-duration': 'disconnected',
        'assistant-error': 'failed',
        'assistant-did-not-give-response': 'failed',
        'assistant-request-failed': 'failed',
        'pipeline-error': 'failed',
      }
      const outcome = outcomeMap[call.endedReason || ''] || 'failed'

      await taskService.recordRetryAttempt(call.taskId, callId, outcome, duration, reasonInfo.title)

      // Check if max retries exceeded
      const exceededRetries = await taskService.hasExceededMaxRetries(call.taskId)
      if (exceededRetries) {
        const fallbackStaff = await this.findFallbackStaff(agent)
        await taskService.escalateTask(
          call.taskId,
          fallbackStaff,
          `Maximum retry attempts (${task.maxRetries || 5}) reached. Last outcome: ${reasonInfo.title}`
        )
        return {
          action: 'escalated',
          message: `Max retries exceeded. Task escalated to staff.`,
        }
      }

      // Schedule retry
      const delayMinutes = agent?.retryDelayMinutes || 60
      await taskService.scheduleRetry(call.taskId, `${reasonInfo.title}: ${reasonInfo.description}`, delayMinutes)
      return {
        action: 'retry_scheduled',
        message: `${reasonInfo.title}. Retry scheduled.`,
      }
    }

    // Non-retryable failures - escalate immediately
    const fallbackStaff = await this.findFallbackStaff(agent)
    await taskService.escalateTask(
      call.taskId,
      fallbackStaff,
      `Call outcome: ${reasonInfo.title} - ${reasonInfo.description}`
    )
    return {
      action: 'escalated',
      message: `${reasonInfo.title}: ${reasonInfo.description}`,
    }
  },

  // Find fallback staff for escalation
  async findFallbackStaff(agent: Agent | null | undefined): Promise<string> {
    // Default fallback
    const DEFAULT_FALLBACK = 'sarah'

    if (!agent) return DEFAULT_FALLBACK

    // Try primary fallback
    if (agent.fallbackStaffId) {
      const staff = await agentService.getAgentById(agent.fallbackStaffId)
      if (staff && staff.type === 'staff') {
        return staff.id
      }
    }

    // Try backup list in order
    const fallbackList = agent.fallbackStaffIds || []
    for (const staffId of fallbackList) {
      const staff = await agentService.getAgentById(staffId)
      if (staff && staff.type === 'staff') {
        return staff.id
      }
    }

    // Fall back to any available staff
    const allStaff = await agentService.getStaff()
    if (allStaff.length > 0) {
      return allStaff[0].id
    }

    return DEFAULT_FALLBACK
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

        // Fetch latest call data from VAPI (includes transcript and recording URL)
        // Note: VAPI may need some time to process the recording, so we poll a few times
        let vapiCall = await vapiApi.getCallStatus(callId)
        let retries = 0
        const maxRetries = 3
        while (retries < maxRetries && vapiCall && !vapiCall.artifact?.recordingUrl) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
          vapiCall = await vapiApi.getCallStatus(callId)
          retries++
        }

        if (vapiCall) {
          const messages = parseVapiMessages(vapiCall)
          const recordingUrl = vapiCall.artifact?.recordingUrl || vapiCall.recordingUrl
          await callRepository.update(callId, {
            messages,
            transcript: vapiCall.artifact?.transcript || vapiCall.transcript,
            recordingUrl,
          })
        }

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
