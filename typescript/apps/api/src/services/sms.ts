/**
 * SMS Service using Twilio Messaging Service
 * Uses Messaging Service SID for number pool support with sticky sender
 */

import twilio from 'twilio'

// Lazy initialization to ensure env vars are loaded
let _twilioClient: twilio.Twilio | null = null

function getTwilioClient(): twilio.Twilio | null {
  if (_twilioClient) return _twilioClient

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    console.warn('[SMS] Twilio credentials not configured - SMS will be logged only')
    return null
  }

  _twilioClient = twilio(accountSid, authToken)
  return _twilioClient
}

export interface SendSmsParams {
  to: string
  message: string
}

export interface SendSmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an SMS using Twilio Messaging Service
 * Uses Messaging Service SID for number pool with sticky sender support
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const { to, message } = params
  const client = getTwilioClient()
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

  // Log the message regardless of whether we can send it
  console.log(`[SMS] To: ${to}`)
  console.log(`[SMS] Message: ${message}`)

  if (!client) {
    console.log('[SMS] Twilio not configured - message logged only')
    return { success: true, messageId: 'logged-only' }
  }

  if (!messagingServiceSid) {
    console.error('[SMS] TWILIO_MESSAGING_SERVICE_SID not configured')
    return { success: false, error: 'Messaging Service SID not configured' }
  }

  try {
    const result = await client.messages.create({
      to,
      messagingServiceSid, // Uses Messaging Service for number pool + sticky sender
      body: message,
    })

    console.log(`[SMS] Sent successfully: ${result.sid}`)
    return { success: true, messageId: result.sid }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[SMS] Failed to send:`, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send an appointment confirmation SMS
 */
export async function sendAppointmentConfirmation(params: {
  phoneNumber: string
  appointmentDate: string
  appointmentTime: string
  providerName: string
}): Promise<SendSmsResult> {
  const { phoneNumber, appointmentDate, appointmentTime, providerName } = params

  const message = `Your appointment with ${providerName} is confirmed for ${appointmentDate} at ${appointmentTime}. Reply STOP to opt out. - Dr. Sahai's Office`

  return sendSms({
    to: phoneNumber,
    message,
  })
}
