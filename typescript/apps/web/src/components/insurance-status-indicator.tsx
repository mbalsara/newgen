import type { Insurance } from "@/lib/types"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor} cursor-help`}>
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
            <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{insurance.provider}</p>
            {insurance.verifiedDate && (
              <p className="text-xs text-muted-foreground">
                Verified: {new Date(insurance.verifiedDate).toLocaleDateString()}
              </p>
            )}
            {insurance.failureReason && <p className="text-xs text-destructive">{insurance.failureReason}</p>}
            {insurance.authCodes && insurance.authCodes.length > 0 && (
              <div className="text-xs">
                <p className="font-medium">Auth Codes:</p>
                <p className="text-muted-foreground">{insurance.authCodes.join(", ")}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
