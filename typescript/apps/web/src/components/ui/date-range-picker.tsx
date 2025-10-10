"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

interface DateRangePickerProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(date)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setSelectedRange(date)
  }, [date])

  const handleSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    if (range?.from && range?.to) {
      onDateChange?.(range)
      setIsOpen(false)
    }
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const formatDateRange = () => {
    if (!selectedRange?.from) {
      return <span>Pick a date range</span>
    }

    if (!selectedRange.to) {
      return format(selectedRange.from, "LLL dd, y")
    }

    const from = selectedRange.from
    const to = selectedRange.to

    const sameMonth = from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()

    if (sameMonth) {
      return `${format(from, "MMM d")} - ${format(to, "d, yyyy")}`
    }

    const sameYear = from.getFullYear() === to.getFullYear()
    if (sameYear) {
      return `${format(from, "MMM d")} - ${format(to, "MMM d, yyyy")}`
    }

    return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        className={cn(
          "justify-start text-left font-normal",
          !selectedRange && "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 rounded-md border bg-popover p-0 shadow-md">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedRange?.from}
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  )
}
