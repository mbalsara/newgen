export type InsuranceStatus = "valid" | "invalid" | "pending"

export type PatientFlag =
  | "payment-delays"
  | "outstanding-balance"
  | "high-deductible"
  | "no-shows"
  | "legal-holds"
  | "missing-docs"
  | "identity-mismatch"
  | "multiple-ids"
  | "high-risk-contact"
  | "incorrect-demographics"
  | "insurance-expired"
  | "out-of-network"
  | "coverage-exceptions"

export interface Insurance {
  id: string
  provider: string
  copay: number
  status: InsuranceStatus
  verifiedDate?: string
  failureReason?: string
  authCodes?: string[]
}

export interface Patient {
  id: string
  name: string
  dob: string
  phone: string
  balance: number
  outstandingDetails?: string
  flags?: PatientFlag[]
  insurance: Insurance
}

export interface Appointment {
  id: string
  patient: Patient
  provider: string
  dateTime: Date
  reason: string
  status: "scheduled" | "cancelled" | "rescheduled"
}

export interface UpcomingIssue {
  type: "missing-insurance" | "expired-insurance" | "auth-denied" | "reschedule-requested"
  message: string
  actionLink?: string
}

export interface UpcomingAppointment extends Appointment {
  issues: UpcomingIssue[]
}

export const patientFlagLabels: Record<PatientFlag, string> = {
  "payment-delays": "Frequent Payment Delays",
  "outstanding-balance": "Outstanding Balance / Unpaid Bills",
  "high-deductible": "High Deductible Remaining",
  "no-shows": "Multiple No-Shows or Cancellations",
  "legal-holds": "Legal Holds",
  "missing-docs": "No Consent / Missing Documentation",
  "identity-mismatch": "Mismatched Identity Information",
  "multiple-ids": "Repeated Use of Multiple IDs",
  "high-risk-contact": "High-Risk Address / Phone Number",
  "incorrect-demographics": "Incorrect Demographics",
  "insurance-expired": "Insurance Not Active / Expired",
  "out-of-network": "Out-of-Network Plan",
  "coverage-exceptions": "Coverage Exceptions",
}
