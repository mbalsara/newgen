import type { UpcomingIssue } from "@/lib/types"
import { AlertCircle, AlertTriangle, XCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"

interface UpcomingIssueBadgeProps {
  issue: UpcomingIssue
}

export function UpcomingIssueBadge({ issue }: UpcomingIssueBadgeProps) {
  const getIssueConfig = () => {
    switch (issue.type) {
      case "missing-insurance":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "Missing Insurance",
        }
      case "expired-insurance":
        return {
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          label: "Expired Insurance",
        }
      case "auth-denied":
        return {
          icon: AlertTriangle,
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          label: "Authorization Denied",
        }
      case "reschedule-requested":
        return {
          icon: Calendar,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          label: "Reschedule Requested",
        }
    }
  }

  const config = getIssueConfig()
  const Icon = config.icon

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <Icon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 space-y-2">
        <div>
          <div className={`font-semibold text-sm ${config.color}`}>{config.label}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{issue.message}</div>
        </div>
        {issue.actionLink && (
          <Button size="sm" variant="outline" asChild className="h-8 bg-transparent">
            <Link to={issue.actionLink}>Take Action</Link>
          </Button>
        )}
      </div>
    </div>
  )
}
