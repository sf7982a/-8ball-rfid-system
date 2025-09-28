import * as React from "react"
import { CalendarDays } from "lucide-react"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "../../lib/utils"

interface DatePickerWithRangeProps {
  date?: { from: Date; to: Date }
  onDateChange?: (date: { from: Date; to: Date } | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  date,
  onDateChange,
  className
}: DatePickerWithRangeProps) {
  const [range, setRange] = React.useState<{ from: Date; to: Date } | undefined>(date)

  React.useEffect(() => {
    setRange(date)
  }, [date])

  const handleDateChange = (newRange: { from: Date; to: Date } | undefined) => {
    setRange(newRange)
    onDateChange?.(newRange)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !range && "text-muted-foreground"
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {range.from.toLocaleDateString()} -{" "}
                  {range.to.toLocaleDateString()}
                </>
              ) : (
                range.from.toLocaleDateString()
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}