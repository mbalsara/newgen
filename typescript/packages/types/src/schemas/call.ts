import { z } from 'zod'
import { TranscriptMessageSchema } from './task'

// Call status enum
export const CallStatusSchema = z.enum(['queued', 'ringing', 'in-progress', 'ended'])
export type CallStatus = z.infer<typeof CallStatusSchema>

// Call schema
export const CallSchema = z.object({
  id: z.string(),
  taskId: z.number().nullable(),
  agentId: z.string().nullable(),
  phoneNumber: z.string(),
  status: CallStatusSchema,
  endedReason: z.string().nullable(),
  duration: z.number().nullable(),
  transcript: z.string().nullable(),
  messages: z.array(TranscriptMessageSchema).default([]),
  hasAbusiveLanguage: z.boolean().default(false),
  startedAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
})
export type Call = z.infer<typeof CallSchema>

// Call status response (for polling)
export const CallStatusResponseSchema = z.object({
  status: z.string(),
  endedReason: z.string().optional(),
  messages: z.array(TranscriptMessageSchema),
  hasAbusiveLanguage: z.boolean(),
  reasonInfo: z.object({
    title: z.string(),
    description: z.string(),
    canRetry: z.boolean(),
    isSuccess: z.boolean(),
  }),
})
export type CallStatusResponse = z.infer<typeof CallStatusResponseSchema>

// Start outbound call request (phoneNumberId is configured on backend via VAPI_PHONE_NUMBER_ID env)
export const StartOutboundCallSchema = z.object({
  taskId: z.number(),
  agentId: z.string(),
  patientName: z.string(),
  customerNumber: z.string(),
})
export type StartOutboundCall = z.infer<typeof StartOutboundCallSchema>

// Outbound call response
export const OutboundCallResponseSchema = z.object({
  callId: z.string(),
  call: CallSchema,
})
export type OutboundCallResponse = z.infer<typeof OutboundCallResponseSchema>
