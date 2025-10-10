import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addDays, subDays, isToday } from "date-fns"
import { useState } from "react"

interface DateNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const [showDateInput, setShowDateInput] = useState(false)

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value + 'T00:00:00')
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate)
      setShowDateInput(false)
    }
  }

  const formatDateForInput = (date: Date) => {
    return format(date, "yyyy-MM-dd")
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousDay}
        title="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {showDateInput ? (
        <input
          type="date"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateInputChange}
          onBlur={() => setShowDateInput(false)}
          autoFocus
          className="h-10 min-w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      ) : (
        <Button
          variant="outline"
          className="min-w-[200px] justify-start text-left font-normal"
          onClick={() => setShowDateInput(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(selectedDate, "PPP")}
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextDay}
        title="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday(selectedDate) && (
        <Button
          variant="ghost"
          onClick={() => onDateChange(new Date())}
          className="ml-2"
        >
          Today
        </Button>
      )}
    </div>
  )
}
