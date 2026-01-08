import type { DashboardData, DatePreset } from './task-types'

// Date presets for date range picker
export const datePresets: DatePreset[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this-week', label: 'This Week' },
  { id: 'last-week', label: 'Last Week' },
  { id: 'this-month', label: 'This Month' },
  { id: 'last-month', label: 'Last Month' },
  { id: 'this-year', label: 'This Year' },
  { id: 'last-year', label: 'Last Year' },
]

// Mock dashboard data
export const dashboardData: DashboardData = {
  summary: {
    totalTasks: 156,
    completedTasks: 142,
    aiHandled: 118,
    staffHandled: 24,
    escalated: 14,
  },
  roi: {
    hoursSaved: 47.5,
    moneySaved: 2847.5,
    avgCallDuration: 2.3,
    costPerCall: 0.85,
    manualCostPerCall: 12.5,
  },
  reach: {
    patientsContacted: 142,
    successfulConnections: 128,
    voicemailsLeft: 14,
    callbacksScheduled: 8,
  },
  taskBreakdown: [
    { type: 'Confirmations', count: 52, aiRate: 92 },
    { type: 'Post-Visit', count: 38, aiRate: 87 },
    { type: 'Pre-Visit', count: 24, aiRate: 79 },
    { type: 'Recalls', count: 22, aiRate: 68 },
    { type: 'No-Shows', count: 12, aiRate: 58 },
    { type: 'Collections', count: 8, aiRate: 75 },
  ],
  agentPerformance: [
    { name: 'Luna', type: 'ai', tasks: 62, successRate: 94, avgDuration: '2:12' },
    { name: 'Max', type: 'ai', tasks: 38, successRate: 91, avgDuration: '2:45' },
    { name: 'Nova', type: 'ai', tasks: 18, successRate: 88, avgDuration: '3:15' },
    { name: 'Sarah M.', type: 'staff', tasks: 14, successRate: 96, avgDuration: '4:30' },
    { name: 'John D.', type: 'staff', tasks: 6, successRate: 92, avgDuration: '5:15' },
    { name: 'Maria G.', type: 'staff', tasks: 4, successRate: 100, avgDuration: '6:00' },
  ],
  weeklyTrend: [
    {
      day: 'Mon',
      date: 'Jan 5',
      ai: { tasks: 24, minutes: 58, cost: 20.4 },
      staff: { tasks: 4, minutes: 18, cost: 50.0 },
    },
    {
      day: 'Tue',
      date: 'Jan 6',
      ai: { tasks: 28, minutes: 67, cost: 23.8 },
      staff: { tasks: 6, minutes: 27, cost: 75.0 },
    },
    {
      day: 'Wed',
      date: 'Jan 7',
      ai: { tasks: 22, minutes: 53, cost: 18.7 },
      staff: { tasks: 3, minutes: 14, cost: 37.5 },
    },
    {
      day: 'Thu',
      date: 'Jan 8',
      ai: { tasks: 0, minutes: 0, cost: 0 },
      staff: { tasks: 0, minutes: 0, cost: 0 },
    },
    {
      day: 'Fri',
      date: 'Jan 9',
      ai: { tasks: 0, minutes: 0, cost: 0 },
      staff: { tasks: 0, minutes: 0, cost: 0 },
    },
    {
      day: 'Sat',
      date: 'Jan 10',
      ai: { tasks: 0, minutes: 0, cost: 0 },
      staff: { tasks: 0, minutes: 0, cost: 0 },
    },
    {
      day: 'Sun',
      date: 'Jan 11',
      ai: { tasks: 0, minutes: 0, cost: 0 },
      staff: { tasks: 0, minutes: 0, cost: 0 },
    },
  ],
}

// Calculate totals for weekly trend
export function getWeeklyTotals() {
  const totals = dashboardData.weeklyTrend.reduce(
    (acc, day) => ({
      ai: {
        tasks: acc.ai.tasks + day.ai.tasks,
        minutes: acc.ai.minutes + day.ai.minutes,
        cost: acc.ai.cost + day.ai.cost,
      },
      staff: {
        tasks: acc.staff.tasks + day.staff.tasks,
        minutes: acc.staff.minutes + day.staff.minutes,
        cost: acc.staff.cost + day.staff.cost,
      },
    }),
    {
      ai: { tasks: 0, minutes: 0, cost: 0 },
      staff: { tasks: 0, minutes: 0, cost: 0 },
    }
  )
  return totals
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value}%`
}
