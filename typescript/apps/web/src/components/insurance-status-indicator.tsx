import type { Insurance } from "@/lib/types"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface InsuranceStatusIndicatorProps {
  insurance: Insurance
}

export function InsuranceStatusIndicator({ insurance }: InsuranceStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (insurance.status) {
      case "valid":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-100",
          label: "Valid",
        }
      case "invalid":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
          label: "Invalid",
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-amber-600",
          bgColor: "bg-amber-100",
          label: "Pending",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}>
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  )
}
