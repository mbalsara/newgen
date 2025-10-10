import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, addDays, subDays, isToday } from "date-fns"

interface DateNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date)
    }
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

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[200px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, "PPP")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

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
