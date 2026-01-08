import { DollarSign, Clock, Users, TrendingUp } from 'lucide-react'
import { dashboardData, formatCurrency } from '@/lib/mock-reports'

export function HeroCards() {
  const { roi, reach, summary } = dashboardData

  const cards = [
    {
      title: 'Money Saved',
      value: formatCurrency(roi.moneySaved),
      subtitle: 'vs. manual calling',
      icon: DollarSign,
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'Hours Saved',
      value: roi.hoursSaved.toString(),
      subtitle: 'staff hours',
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Patients Reached',
      value: reach.patientsContacted.toString(),
      subtitle: `${reach.successfulConnections} successful connections`,
      icon: Users,
      gradient: 'from-violet-500 to-violet-600',
    },
    {
      title: 'AI Success Rate',
      value: `${Math.round((summary.aiHandled / summary.totalTasks) * 100)}%`,
      subtitle: `${summary.aiHandled} of ${summary.totalTasks} tasks`,
      icon: TrendingUp,
      gradient: 'from-gray-700 to-gray-900',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${card.gradient} rounded-xl p-5 text-white`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium opacity-90">{card.title}</span>
            <card.icon className="h-5 w-5 opacity-80" />
          </div>
          <div className="text-3xl font-bold">{card.value}</div>
          <div className="text-sm opacity-80 mt-1">{card.subtitle}</div>
        </div>
      ))}
    </div>
  )
}
