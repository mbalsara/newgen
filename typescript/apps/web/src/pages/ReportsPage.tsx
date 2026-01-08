import { useState } from 'react'
import { Calendar, ChevronDown, Clock, DollarSign, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { dashboardData, getWeeklyTotals } from '@/lib/mock-reports'
import { cn } from '@/lib/utils'

export default function ReportsPage() {
  const [dateRange] = useState('This Week')

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">AI Voice Agent Performance & ROI</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            {dateRange}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Hero Cards */}
        <HeroCards />

        {/* Weekly Performance Table */}
        <WeeklyPerformanceTable />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TasksByTypeChart />
          </div>
          <div>
            <CostComparison />
          </div>
        </div>

        {/* Agent Performance */}
        <AgentPerformanceTable />
      </div>
    </div>
  )
}

// Hero Cards Component
function HeroCards() {
  const { roi, summary, reach } = dashboardData
  const aiSuccessRate = Math.round((summary.completedTasks / summary.totalTasks) * 100)

  const cards = [
    {
      title: 'Money Saved',
      value: `$${roi.moneySaved.toLocaleString()}`,
      subtitle: 'This week',
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Hours Saved',
      value: roi.hoursSaved.toString(),
      subtitle: 'This week',
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Patients Reached',
      value: reach.patientsContacted.toString(),
      subtitle: `${reach.successfulConnections} connected`,
      icon: Users,
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      title: 'AI Success Rate',
      value: `${aiSuccessRate}%`,
      subtitle: `${summary.aiHandled} of ${summary.totalTasks} tasks`,
      icon: TrendingUp,
      gradient: 'from-gray-700 to-gray-900',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={cn(
            'rounded-xl p-5 text-white bg-gradient-to-br',
            card.gradient
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/80">{card.title}</span>
            <card.icon className="h-5 w-5 text-white/60" />
          </div>
          <div className="text-3xl font-bold mb-1">{card.value}</div>
          <div className="text-sm text-white/70">{card.subtitle}</div>
        </div>
      ))}
    </div>
  )
}

// Weekly Performance Table
function WeeklyPerformanceTable() {
  const { weeklyTrend } = dashboardData
  const totals = getWeeklyTotals()
  const today = new Date().getDay()
  const dayIndex = today === 0 ? 6 : today - 1 // Convert to Mon=0 index

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Weekly Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={3}>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-900" />
                  AI Agents
                </div>
              </th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={3}>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Staff
                </div>
              </th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-400"></th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400">Tasks</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400">Minutes</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400">Cost</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400">Tasks</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400">Minutes</th>
              <th className="text-center px-3 py-2 text-xs font-medium text-gray-400">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {weeklyTrend.map((day, index) => {
              const isFuture = index > dayIndex
              return (
                <tr key={day.day} className={cn(isFuture && 'opacity-40')}>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">{day.day}</span>
                    <span className="text-gray-400 ml-2 text-sm">{day.date}</span>
                  </td>
                  <td className="text-center px-3 py-3 text-sm text-gray-700">{day.ai.tasks || '-'}</td>
                  <td className="text-center px-3 py-3 text-sm text-gray-700">{day.ai.minutes || '-'}</td>
                  <td className="text-center px-3 py-3 text-sm text-gray-700">{day.ai.cost ? `$${day.ai.cost.toFixed(2)}` : '-'}</td>
                  <td className="text-center px-3 py-3 text-sm text-gray-700">{day.staff.tasks || '-'}</td>
                  <td className="text-center px-3 py-3 text-sm text-gray-700">{day.staff.minutes || '-'}</td>
                  <td className="text-center px-3 py-3 text-sm text-gray-700">{day.staff.cost ? `$${day.staff.cost.toFixed(2)}` : '-'}</td>
                </tr>
              )
            })}
            {/* Totals Row */}
            <tr className="bg-gray-50 font-medium">
              <td className="px-5 py-3 text-gray-900">Total</td>
              <td className="text-center px-3 py-3 text-gray-900">{totals.ai.tasks}</td>
              <td className="text-center px-3 py-3 text-gray-900">{totals.ai.minutes}</td>
              <td className="text-center px-3 py-3 text-gray-900">${totals.ai.cost.toFixed(2)}</td>
              <td className="text-center px-3 py-3 text-gray-900">{totals.staff.tasks}</td>
              <td className="text-center px-3 py-3 text-gray-900">{totals.staff.minutes}</td>
              <td className="text-center px-3 py-3 text-gray-900">${totals.staff.cost.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Tasks by Type Chart (horizontal bar chart)
function TasksByTypeChart() {
  const { taskBreakdown } = dashboardData
  const maxCount = Math.max(...taskBreakdown.map(t => t.count))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">Tasks by Type</h2>
      <div className="space-y-4">
        {taskBreakdown.map((item, index) => (
          <div key={index}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-700">{item.type}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-emerald-600 font-medium">{item.aiRate}% AI</span>
              </div>
            </div>
            <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full flex transition-all"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              >
                <div
                  className="h-full bg-emerald-500 rounded-l-full"
                  style={{ width: `${item.aiRate}%` }}
                />
                <div
                  className="h-full bg-gray-300 rounded-r-full flex-1"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">AI Handled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-xs text-gray-500">Staff Handled</span>
        </div>
      </div>
    </div>
  )
}

// Cost Comparison Component
function CostComparison() {
  const { roi } = dashboardData
  const savings = Math.round(((roi.manualCostPerCall - roi.costPerCall) / roi.manualCostPerCall) * 100)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full">
      <h2 className="font-semibold text-gray-900 mb-4">Cost Comparison</h2>

      <div className="space-y-6">
        {/* AI Cost */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">AI Voice Agent</span>
            <span className="text-lg font-bold text-gray-900">${roi.costPerCall.toFixed(2)}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${(roi.costPerCall / roi.manualCostPerCall) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">per call</p>
        </div>

        {/* Manual Cost */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Manual Staff</span>
            <span className="text-lg font-bold text-gray-900">${roi.manualCostPerCall.toFixed(2)}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-full" />
          </div>
          <p className="text-xs text-gray-400 mt-1">per call</p>
        </div>

        {/* Savings */}
        <div className="bg-emerald-50 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-emerald-600">{savings}%</p>
          <p className="text-sm text-emerald-700">Cost Savings with AI</p>
        </div>
      </div>
    </div>
  )
}

// Agent Performance Table
function AgentPerformanceTable() {
  const { agentPerformance } = dashboardData

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Agent Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agentPerformance.map((agent, index) => (
              <tr key={index}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      agent.type === 'ai' ? 'bg-gray-900 text-white' : 'bg-amber-100 text-amber-700'
                    )}>
                      {agent.type === 'ai' ? '🤖' : agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="font-medium text-gray-900">{agent.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    agent.type === 'ai' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'
                  )}>
                    {agent.type === 'ai' ? 'AI Agent' : 'Staff'}
                  </span>
                </td>
                <td className="text-center px-5 py-3 text-sm text-gray-700">{agent.tasks}</td>
                <td className="text-center px-5 py-3">
                  <span className={cn(
                    'text-sm font-medium',
                    agent.successRate >= 90 ? 'text-emerald-600' :
                    agent.successRate >= 70 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {agent.successRate}%
                  </span>
                </td>
                <td className="text-center px-5 py-3 text-sm text-gray-700">{agent.avgDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
