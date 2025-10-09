export interface Appointment {
  id: string
  date: string
  time: string
  length: string
  patientId: string
  patientName: string
  dob: string
  phone: string
  provider: string
  reasonForVisit: string
  status: 'Active' | 'Confirmed' | 'Left Message' | 'Reschedule'
}
