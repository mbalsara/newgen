import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardData } from '@/lib/mock-reports'

export function TasksByTypeChart() {
  const { taskBreakdown } = dashboardData
  const maxCount = Math.max(...taskBreakdown.map(t => t.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tasks by Type</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {taskBreakdown.map(item => (
          <div key={item.type} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.type}</span>
              <span className="text-muted-foreground">{item.count}</span>
            </div>
            <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
              {/* Total bar (light) */}
              <div
                className="absolute inset-y-0 left-0 bg-gray-200 dark:bg-gray-700 rounded"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
              {/* AI portion (green) */}
              <div
                className="absolute inset-y-0 left-0 bg-green-500 rounded"
                style={{
                  width: `${(item.count / maxCount) * (item.aiRate / 100) * 100}%`,
                }}
              />
              {/* AI rate label */}
              <div className="absolute inset-0 flex items-center px-2">
                <span className="text-xs font-medium text-white drop-shadow">
                  {item.aiRate}% AI
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
