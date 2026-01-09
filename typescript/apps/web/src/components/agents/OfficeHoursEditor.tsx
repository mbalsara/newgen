import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface DayHours {
  start: string
  end: string
  enabled: boolean
}

interface OfficeHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
  timezone: string
}

interface OfficeHoursEditorProps {
  value?: OfficeHours
  onChange: (hours: OfficeHours) => void
}

const DAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
] as const

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00',
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (AZ)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
]

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

const DEFAULT_HOURS: OfficeHours = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '09:00', end: '13:00', enabled: false },
  sunday: { start: '09:00', end: '13:00', enabled: false },
  timezone: 'America/New_York',
}

export function OfficeHoursEditor({ value, onChange }: OfficeHoursEditorProps) {
  const hours = value || DEFAULT_HOURS

  const updateDay = (day: keyof Omit<OfficeHours, 'timezone'>, updates: Partial<DayHours>) => {
    onChange({
      ...hours,
      [day]: { ...hours[day], ...updates },
    })
  }

  const updateTimezone = (timezone: string) => {
    onChange({ ...hours, timezone })
  }

  const applyToWeekdays = () => {
    const mondayHours = hours.monday
    onChange({
      ...hours,
      monday: { ...mondayHours, enabled: true },
      tuesday: { ...mondayHours, enabled: true },
      wednesday: { ...mondayHours, enabled: true },
      thursday: { ...mondayHours, enabled: true },
      friday: { ...mondayHours, enabled: true },
    })
  }

  return (
    <div className="space-y-4">
      {/* Timezone */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Timezone</span>
        <Select value={hours.timezone} onValueChange={updateTimezone}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick actions */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={applyToWeekdays}
          className="text-xs text-primary hover:underline"
        >
          Apply Monday hours to weekdays
        </button>
      </div>

      {/* Days grid */}
      <div className="space-y-2">
        {DAYS.map(({ key, label, short }) => {
          const day = hours[key as keyof Omit<OfficeHours, 'timezone'>]
          return (
            <div
              key={key}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                day.enabled ? 'bg-card' : 'bg-muted/30'
              )}
            >
              <Switch
                checked={day.enabled}
                onCheckedChange={(enabled) =>
                  updateDay(key as keyof Omit<OfficeHours, 'timezone'>, { enabled })
                }
              />
              <span className="w-24 font-medium text-sm">
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </span>

              {day.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <Select
                    value={day.start}
                    onValueChange={(start) =>
                      updateDay(key as keyof Omit<OfficeHours, 'timezone'>, { start })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue>{formatTime(day.start)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">to</span>
                  <Select
                    value={day.end}
                    onValueChange={(end) =>
                      updateDay(key as keyof Omit<OfficeHours, 'timezone'>, { end })
                    }
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue>{formatTime(day.end)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
