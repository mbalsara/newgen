import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { dashboardData, formatCurrency } from '@/lib/mock-reports'

export function CostComparison() {
  const { roi } = dashboardData
  const savingsPercent = Math.round(
    ((roi.manualCostPerCall - roi.costPerCall) / roi.manualCostPerCall) * 100
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cost per Call</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>AI Agent</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(roi.costPerCall)}
            </span>
          </div>
          <Progress
            value={(roi.costPerCall / roi.manualCostPerCall) * 100}
            className="h-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Manual Call</span>
            <span className="font-semibold">{formatCurrency(roi.manualCostPerCall)}</span>
          </div>
          <Progress value={100} className="h-2 bg-gray-200" />
        </div>

        <div className="pt-4 border-t">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{savingsPercent}%</div>
            <div className="text-sm text-muted-foreground">Cost Savings</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
