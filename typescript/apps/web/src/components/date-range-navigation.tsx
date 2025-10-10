import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

interface DateRangeNavigationProps {
  startDate: Date
  endDate: Date
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
}

export function DateRangeNavigation({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeNavigationProps) {
  const handleDateChange = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartDateChange(range.from)
    }
    if (range?.to) {
      onEndDateChange(range.to)
    }
  }

  return (
    <DateRangePicker
      date={{ from: startDate, to: endDate }}
      onDateChange={handleDateChange}
    />
  )
}
