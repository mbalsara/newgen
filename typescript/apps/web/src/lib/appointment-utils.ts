/**
 * Utility functions for appointment time calculations
 */

/**
 * Check if an appointment/time slot is currently active
 * @param appointmentTime - The appointment start time
 * @returns true if current time is within the appointment hour
 */
export function isCurrentAppointment(appointmentTime: Date): boolean {
  const currentTime = new Date()
  // Appointment is "current" if we're within the appointment hour
  // (after appointment start time but before the next hour)
  const appointmentEndTime = new Date(appointmentTime.getTime() + 60 * 60 * 1000) // Add 1 hour
  return currentTime >= appointmentTime && currentTime < appointmentEndTime
}

/**
 * Check if an appointment/time slot is in the past
 * @param appointmentTime - The appointment start time
 * @returns true if the appointment is past (but not current)
 */
export function isPastAppointment(appointmentTime: Date): boolean {
  const currentTime = new Date()
  // Only consider it past if it's not the current appointment
  if (isCurrentAppointment(appointmentTime)) {
    return false
  }
  return currentTime > appointmentTime
}

/**
 * Format time in 12-hour format
 * @param date - The date to format
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Format currency in USD
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$50.00")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
