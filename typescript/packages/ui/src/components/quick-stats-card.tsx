import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface QuickStatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
}

export function QuickStatsCard({ title, value, description, icon: Icon, trend }: QuickStatsCardProps) {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3 px-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        {trend && (
          <p className={`text-xs mt-0.5 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
