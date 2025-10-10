import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format, addDays, subDays, isToday } from "date-fns"
import { useRef } from "react"

interface DateNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)

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
    }
  }

  const handleButtonClick = () => {
    dateInputRef.current?.showPicker()
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

      <div className="relative">
        <Button
          variant="outline"
          className="min-w-[200px] justify-start text-left font-normal"
          onClick={handleButtonClick}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(selectedDate, "PPP")}
        </Button>
        <input
          ref={dateInputRef}
          type="date"
          value={formatDateForInput(selectedDate)}
          onChange={handleDateInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

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
