import { cn } from '@/lib/utils'

interface CallingHoursGridProps {
  value: { hour: number; enabled: boolean }[]
  onChange: (hours: { hour: number; enabled: boolean }[]) => void
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const formatHour = (hour: number) => {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  if (hour < 12) return `${hour}am`
  return `${hour - 12}pm`
}

export function CallingHoursGrid({ value, onChange }: CallingHoursGridProps) {
  // Initialize with all business hours enabled if empty
  const hours = value.length > 0
    ? value
    : HOURS.map((hour) => ({
        hour,
        enabled: hour >= 9 && hour < 18, // 9am-6pm default
      }))

  const toggleHour = (hour: number) => {
    const updated = hours.map((h) =>
      h.hour === hour ? { ...h, enabled: !h.enabled } : h
    )
    onChange(updated)
  }

  const enableBusinessHours = () => {
    const updated = HOURS.map((hour) => ({
      hour,
      enabled: hour >= 9 && hour < 18,
    }))
    onChange(updated)
  }

  const enableAllHours = () => {
    const updated = HOURS.map((hour) => ({
      hour,
      enabled: hour >= 8 && hour < 21, // 8am-9pm
    }))
    onChange(updated)
  }

  const clearAll = () => {
    const updated = HOURS.map((hour) => ({
      hour,
      enabled: false,
    }))
    onChange(updated)
  }

  const enabledCount = hours.filter((h) => h.enabled).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {enabledCount} hours enabled
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={enableBusinessHours}
            className="text-xs text-primary hover:underline"
          >
            Business (9-6)
          </button>
          <button
            type="button"
            onClick={enableAllHours}
            className="text-xs text-primary hover:underline"
          >
            Extended (8-9)
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-1">
        {HOURS.map((hour) => {
          const hourData = hours.find((h) => h.hour === hour)
          const isEnabled = hourData?.enabled ?? false

          return (
            <button
              key={hour}
              type="button"
              onClick={() => toggleHour(hour)}
              className={cn(
                'flex flex-col items-center justify-center py-2 rounded text-xs font-medium transition-colors',
                isEnabled
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
              title={`${formatHour(hour)} - ${formatHour(hour + 1)}`}
            >
              <span>{formatHour(hour)}</span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Click hours to toggle. Calls will only be made during enabled hours.
      </p>
    </div>
  )
}
