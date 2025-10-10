import type { Appointment, UpcomingAppointment, PatientFlag } from "./types"

const today = new Date()
today.setHours(8, 0, 0, 0)

export const todaysAppointments: Appointment[] = [
  {
    id: "1",
    provider: "Dr. Sarah Johnson",
    dateTime: new Date(today.getTime() + 0 * 60 * 60 * 1000), // 8:00 AM
    status: "scheduled",
    reason: "Annual Physical Examination",
    patient: {
      id: "P001",
      name: "Michael Chen",
      dob: "1985-03-15",
      phone: "(555) 123-4567",
      balance: 0,
      insurance: {
        id: "INS-001",
        provider: "Blue Cross Blue Shield",
        copay: 25,
        status: "valid",
        verifiedDate: "2025-10-08",
        authCodes: ["AUTH-2025-001"],
      },
    },
  },
  {
    id: "2",
    provider: "Dr. Sarah Johnson",
    dateTime: new Date(today.getTime() + 1 * 60 * 60 * 1000), // 9:00 AM
    status: "scheduled",
    reason: "Follow-up - Hypertension Management",
    patient: {
      id: "P002",
      name: "Jennifer Martinez",
      dob: "1972-07-22",
      phone: "(555) 234-5678",
      balance: 450.0,
      outstandingDetails: "2 unpaid visits from Aug 2024",
      flags: ["outstanding-balance", "payment-delays"] as PatientFlag[],
      insurance: {
        id: "INS-002",
        provider: "Aetna",
        copay: 30,
        status: "pending",
        verifiedDate: "2025-10-09",
        authCodes: ["AUTH-2025-002"],
      },
    },
  },
  {
    id: "3",
    provider: "Dr. Michael Roberts",
    dateTime: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 10:00 AM
    status: "scheduled",
    reason: "Diabetes Management & Lab Review",
    patient: {
      id: "P003",
      name: "Robert Thompson",
      dob: "1968-11-30",
      phone: "(555) 345-6789",
      balance: 2500.0,
      outstandingDetails: "High deductible plan - $2,500 remaining",
      flags: ["high-deductible", "outstanding-balance"] as PatientFlag[],
      insurance: {
        id: "INS-003",
        provider: "UnitedHealthcare",
        copay: 50,
        status: "valid",
        verifiedDate: "2025-10-08",
        authCodes: ["AUTH-2025-003", "AUTH-2025-004"],
      },
    },
  },
  {
    id: "4",
    provider: "Dr. Michael Roberts",
    dateTime: new Date(today.getTime() + 3 * 60 * 60 * 1000), // 11:00 AM
    status: "scheduled",
    reason: "New Patient Consultation",
    patient: {
      id: "P004",
      name: "Emily Davis",
      dob: "1990-05-18",
      phone: "(555) 456-7890",
      balance: 0,
      flags: ["missing-docs"] as PatientFlag[],
      insurance: {
        id: "INS-004",
        provider: "Cigna",
        copay: 35,
        status: "invalid",
        verifiedDate: "2025-10-09",
        failureReason: "Insurance card expired - needs updated information",
      },
    },
  },
  {
    id: "5",
    provider: "Dr. Sarah Johnson",
    dateTime: new Date(today.getTime() + 5 * 60 * 60 * 1000), // 1:00 PM
    status: "scheduled",
    reason: "Allergy Testing",
    patient: {
      id: "P005",
      name: "David Wilson",
      dob: "1995-09-25",
      phone: "(555) 567-8901",
      balance: 150.0,
      flags: ["no-shows"] as PatientFlag[],
      insurance: {
        id: "INS-005",
        provider: "Humana",
        copay: 20,
        status: "valid",
        verifiedDate: "2025-10-07",
        authCodes: ["AUTH-2025-005"],
      },
    },
  },
  {
    id: "6",
    provider: "Dr. Lisa Anderson",
    dateTime: new Date(today.getTime() + 6 * 60 * 60 * 1000), // 2:00 PM
    status: "scheduled",
    reason: "Prenatal Checkup - 28 weeks",
    patient: {
      id: "P006",
      name: "Amanda Rodriguez",
      dob: "1988-02-14",
      phone: "(555) 678-9012",
      balance: 0,
      insurance: {
        id: "INS-006",
        provider: "Blue Cross Blue Shield",
        copay: 0,
        status: "valid",
        verifiedDate: "2025-10-08",
        authCodes: ["AUTH-2025-006"],
      },
    },
  },
  {
    id: "7",
    provider: "Dr. Lisa Anderson",
    dateTime: new Date(today.getTime() + 7 * 60 * 60 * 1000), // 3:00 PM
    status: "scheduled",
    reason: "Sports Physical",
    patient: {
      id: "P007",
      name: "James Taylor",
      dob: "2008-06-10",
      phone: "(555) 789-0123",
      balance: 0,
      insurance: {
        id: "INS-007",
        provider: "Kaiser Permanente",
        copay: 15,
        status: "valid",
        verifiedDate: "2025-10-09",
        authCodes: ["AUTH-2025-007"],
      },
    },
  },
  {
    id: "8",
    provider: "Dr. Michael Roberts",
    dateTime: new Date(today.getTime() + 8 * 60 * 60 * 1000), // 4:00 PM
    status: "scheduled",
    reason: "Chronic Pain Management",
    patient: {
      id: "P008",
      name: "Patricia Brown",
      dob: "1965-12-05",
      phone: "(555) 890-1234",
      balance: 800.0,
      outstandingDetails: "Workers comp case pending",
      flags: ["legal-holds", "outstanding-balance", "out-of-network"] as PatientFlag[],
      insurance: {
        id: "INS-008",
        provider: "Workers Compensation",
        copay: 0,
        status: "pending",
        verifiedDate: "2025-10-09",
        failureReason: "Awaiting authorization approval",
        authCodes: ["AUTH-2025-008"],
      },
    },
  },
]

export const upcomingAppointments: UpcomingAppointment[] = [
  {
    id: "U1",
    provider: "Dr. Sarah Johnson",
    dateTime: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    status: "scheduled",
    reason: "Cardiology Consultation",
    patient: {
      id: "P009",
      name: "Thomas Anderson",
      dob: "1975-04-20",
      phone: "(555) 901-2345",
      balance: 0,
      insurance: {
        id: "INS-009",
        provider: "Medicare",
        copay: 0,
        status: "invalid",
        failureReason: "Coverage expired on 09/30/2025",
      },
    },
    issues: [
      {
        type: "expired-insurance",
        message: "Insurance coverage expired",
        actionLink: "/verify-insurance/P009",
      },
    ],
  },
  {
    id: "U2",
    provider: "Dr. Michael Roberts",
    dateTime: new Date(today.getTime() + 48 * 60 * 60 * 1000), // 2 days
    status: "scheduled",
    reason: "MRI Scan - Lower Back",
    patient: {
      id: "P010",
      name: "Maria Garcia",
      dob: "1982-08-12",
      phone: "(555) 012-3456",
      balance: 0,
      insurance: {
        id: "INS-010",
        provider: "Aetna",
        copay: 75,
        status: "invalid",
        failureReason: "Authorization denied - requires additional documentation",
      },
    },
    issues: [
      {
        type: "auth-denied",
        message: "Authorization denied - needs peer review",
        actionLink: "/resubmit-auth/P010",
      },
    ],
  },
  {
    id: "U3",
    provider: "Dr. Lisa Anderson",
    dateTime: new Date(today.getTime() + 72 * 60 * 60 * 1000), // 3 days
    status: "scheduled",
    reason: "Annual Wellness Visit",
    patient: {
      id: "P011",
      name: "Christopher Lee",
      dob: "1992-01-28",
      phone: "(555) 123-4567",
      balance: 0,
      insurance: {
        id: "",
        provider: "",
        copay: 0,
        status: "invalid",
      },
    },
    issues: [
      {
        type: "missing-insurance",
        message: "No insurance information on file",
        actionLink: "/add-insurance/P011",
      },
    ],
  },
  {
    id: "U4",
    provider: "Dr. Sarah Johnson",
    dateTime: new Date(today.getTime() + (24 * 28) * 60 * 60 * 1000), // 28 days
    status: "scheduled",
    reason: "Follow-up - Post Surgery",
    patient: {
      id: "P012",
      name: "Susan White",
      dob: "1970-11-15",
      phone: "(555) 234-5678",
      balance: 0,
      insurance: {
        id: "INS-012",
        provider: "Blue Cross Blue Shield",
        copay: 25,
        status: "valid",
        verifiedDate: "2025-10-08",
      },
    },
    issues: [
      {
        type: "reschedule-requested",
        message: "Patient requested to reschedule to next week",
        actionLink: "/reschedule/P012",
      },
    ],
  },
]
