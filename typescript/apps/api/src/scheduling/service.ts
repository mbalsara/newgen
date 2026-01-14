/**
 * Scheduling Service
 * Handles appointment availability and booking (mock data for now)
 */

import type {
  CheckAvailabilityRequest,
  CheckAvailabilityResponse,
  BookAppointmentRequest,
  BookAppointmentResponse,
  RequestCallbackRequest,
  RequestCallbackResponse,
  AvailabilitySlot,
} from '@repo/types'

// Generate mock availability slots for the next 2 weeks
function generateMockSlots(providerId: string, weeksOut: number = 2): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = []
  const now = new Date()

  // Generate slots for the next N weeks
  for (let day = 1; day <= weeksOut * 7; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() + day)

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue

    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0]

    // Add morning slots (9am, 10am, 11am)
    const morningTimes = ['09:00', '10:00', '11:00']
    // Add afternoon slots (2pm, 3pm, 4pm)
    const afternoonTimes = ['14:00', '15:00', '16:00']

    // Randomly remove some slots to simulate bookings
    const allTimes = [...morningTimes, ...afternoonTimes]
    const availableTimes = allTimes.filter(() => Math.random() > 0.4) // 60% chance of being available

    for (const time of availableTimes) {
      slots.push({
        date: dateStr,
        time,
        duration: 30,
        providerId,
      })
    }
  }

  return slots
}

// Filter slots by preference
function filterSlotsByPreference(
  slots: AvailabilitySlot[],
  preferredDays?: string[],
  preferredTime?: 'morning' | 'afternoon' | 'any'
): AvailabilitySlot[] {
  let filtered = slots

  // Filter by preferred days (e.g., ['Monday', 'Tuesday'])
  if (preferredDays && preferredDays.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    filtered = filtered.filter(slot => {
      const date = new Date(slot.date)
      const dayName = dayNames[date.getDay()]
      return preferredDays.some(d => d.toLowerCase() === dayName.toLowerCase())
    })
  }

  // Filter by time of day
  if (preferredTime && preferredTime !== 'any') {
    filtered = filtered.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0], 10)
      if (preferredTime === 'morning') {
        return hour < 12
      } else {
        return hour >= 12
      }
    })
  }

  return filtered
}

// Format slot for natural language
function formatSlotForAgent(slot: AvailabilitySlot): string {
  const date = new Date(slot.date)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const dayName = dayNames[date.getDay()]
  const monthName = monthNames[date.getMonth()]
  const dayNum = date.getDate()

  // Convert 24h to 12h format
  const [hours, minutes] = slot.time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  const timeStr = `${hour12}:${minutes} ${ampm}`

  return `${dayName}, ${monthName} ${dayNum} at ${timeStr}`
}

export const schedulingService = {
  /**
   * Check available appointment slots
   */
  async checkAvailability(request: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> {
    const { providerId, preferredDays, preferredTime, weeksOut } = request

    // Generate mock slots
    let slots = generateMockSlots(providerId, weeksOut)

    // Apply filters
    slots = filterSlotsByPreference(slots, preferredDays, preferredTime)

    // Limit to first 5 slots for agent to offer
    const limitedSlots = slots.slice(0, 5)

    // Generate natural language message for agent
    let message: string
    if (limitedSlots.length === 0) {
      message = "I'm sorry, I don't see any available appointments matching your preferences in the next two weeks."
    } else if (limitedSlots.length === 1) {
      message = `I have one opening: ${formatSlotForAgent(limitedSlots[0])}.`
    } else {
      const slotDescriptions = limitedSlots.slice(0, 3).map(formatSlotForAgent)
      message = `I have a few openings: ${slotDescriptions.join(', or ')}.`
    }

    return {
      slots: limitedSlots,
      message,
    }
  },

  /**
   * Book an appointment
   */
  async bookAppointment(request: BookAppointmentRequest): Promise<BookAppointmentResponse> {
    const { patientId, providerId, date, time } = request

    // Generate a mock appointment ID
    const appointmentId = `APT-${Date.now()}`

    // Format confirmation message
    const slot: AvailabilitySlot = { date, time, duration: 30, providerId }
    const formattedSlot = formatSlotForAgent(slot)

    console.log(`[Scheduling] Booked appointment ${appointmentId} for patient ${patientId}: ${formattedSlot}`)

    return {
      appointmentId,
      date,
      time,
      providerId,
      status: 'confirmed',
      message: `Your appointment is confirmed for ${formattedSlot}.`,
    }
  },

  /**
   * Request a callback from scheduling staff
   */
  async requestCallback(request: RequestCallbackRequest): Promise<RequestCallbackResponse> {
    const { patientId, callbackReason, notes } = request

    console.log(`[Scheduling] Callback requested for patient ${patientId}: ${callbackReason}`, notes)

    // In a real implementation, this would create a task for staff
    // For now, just log and return success

    return {
      success: true,
      message: "I've requested a callback from our scheduling team. They'll call you back within 24 hours.",
    }
  },
}
