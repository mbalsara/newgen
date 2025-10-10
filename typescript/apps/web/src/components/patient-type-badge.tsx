import { Star, RefreshCw } from "lucide-react"
import type { PatientType } from "@/lib/types"

interface PatientTypeBadgeProps {
  type: PatientType
}

export function PatientTypeBadge({ type }: PatientTypeBadgeProps) {
  if (type === "new") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded">
        <Star className="h-2.5 w-2.5" />
        New
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
      <RefreshCw className="h-2.5 w-2.5" />
      Follow-up
    </span>
  )
}
