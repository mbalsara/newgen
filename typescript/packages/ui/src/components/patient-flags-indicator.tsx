import { type PatientFlag, patientFlagLabels } from "@/lib/types"
import { AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PatientFlagsIndicatorProps {
  flags: PatientFlag[]
}

export function PatientFlagsIndicator({ flags }: PatientFlagsIndicatorProps) {
  if (!flags || flags.length === 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 cursor-help">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">{flags.length}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-1">
            <p className="font-semibold text-sm mb-2">Patient Alerts</p>
            <ul className="space-y-1">
              {flags.map((flag) => (
                <li key={flag} className="text-xs flex items-start gap-1.5">
                  <span className="text-amber-600 mt-0.5">•</span>
                  <span>{patientFlagLabels[flag]}</span>
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
