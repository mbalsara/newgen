import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PatientBehaviorFlag } from '@/lib/task-types'

interface PatientFlagBannerProps {
  flag: PatientBehaviorFlag
  onRemoveFlag?: () => void
}

const reasonLabels: Record<string, string> = {
  'abusive-language': 'Abusive Language',
  'verbal-threats': 'Verbal Threats',
  harassment: 'Harassment',
  discriminatory: 'Discriminatory Remarks',
  other: 'Other Concern',
}

export function PatientFlagBanner({ flag, onRemoveFlag }: PatientFlagBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-950 dark:border-red-900">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-red-800 dark:text-red-200">
              Patient Behavior Warning
            </h4>
            {onRemoveFlag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveFlag}
                className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
              >
                Remove Flag
              </Button>
            )}
          </div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">
            {reasonLabels[flag.reason] || flag.reason}
          </p>
          {flag.notes && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{flag.notes}</p>
          )}
          <p className="text-xs text-red-500 dark:text-red-500 mt-2">
            Flagged by {flag.flaggedBy} on {flag.flaggedAt}
          </p>
        </div>
      </div>
    </div>
  )
}
