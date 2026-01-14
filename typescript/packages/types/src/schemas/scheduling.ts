import { z } from 'zod'

// Available time slot from provider schedule
export const AvailabilitySlotSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  duration: z.number().default(30), // minutes
  providerId: z.string(),
})
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>

// Check availability request (from VAPI tool)
export const CheckAvailabilityRequestSchema = z.object({
  providerId: z.string(),
  preferredDays: z.array(z.string()).optional(),
  preferredTime: z.enum(['morning', 'afternoon', 'any']).optional(),
  weeksOut: z.number().default(2),
})
export type CheckAvailabilityRequest = z.infer<typeof CheckAvailabilityRequestSchema>

// Check availability response
export const CheckAvailabilityResponseSchema = z.object({
  slots: z.array(AvailabilitySlotSchema),
  message: z.string().optional(), // Natural language description for agent
})
export type CheckAvailabilityResponse = z.infer<typeof CheckAvailabilityResponseSchema>

// Book appointment request (from VAPI tool)
export const BookAppointmentRequestSchema = z.object({
  patientId: z.string(),
  providerId: z.string(),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  cancelOriginal: z.boolean().default(true),
  originalAppointmentId: z.string().optional(),
})
export type BookAppointmentRequest = z.infer<typeof BookAppointmentRequestSchema>

// Book appointment response
export const BookAppointmentResponseSchema = z.object({
  appointmentId: z.string(),
  date: z.string(),
  time: z.string(),
  providerId: z.string(),
  status: z.enum(['confirmed', 'pending']),
  message: z.string().optional(), // Natural language confirmation for agent
})
export type BookAppointmentResponse = z.infer<typeof BookAppointmentResponseSchema>

// Request callback request (from VAPI tool)
export const RequestCallbackRequestSchema = z.object({
  patientId: z.string(),
  callbackReason: z.string(),
  preferredCallbackTime: z.string().optional(),
  notes: z.string().optional(),
})
export type RequestCallbackRequest = z.infer<typeof RequestCallbackRequestSchema>

// Request callback response
export const RequestCallbackResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})
export type RequestCallbackResponse = z.infer<typeof RequestCallbackResponseSchema>
