"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// ============================================================================
// Type Definitions
// ============================================================================

export type TimeFormat = "12h" | "24h"

export interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

export interface DatePickerProps {
  /** Current selected date */
  value?: Date
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Additional class names */
  className?: string
  /** Whether the picker is disabled */
  disabled?: boolean
}

export interface DateTimePickerProps extends DatePickerProps {
  /** Time format - 12h or 24h */
  timeFormat?: TimeFormat
}

export interface DateRangePickerProps {
  /** Current selected date range */
  value?: DateRange
  /** Callback when date range changes */
  onChange?: (range: DateRange | undefined) => void
  /** Placeholder text */
  placeholder?: string
  /** Additional class names */
  className?: string
  /** Whether the picker is disabled */
  disabled?: boolean
}

export interface DateTimeRangePickerProps extends DateRangePickerProps {
  /** Time format - 12h or 24h */
  timeFormat?: TimeFormat
}

// ============================================================================
// DatePicker Component
// ============================================================================

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value)

  const date = value ?? internalDate

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setInternalDate(selectedDate)
    onChange?.(selectedDate)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// DateTimePicker Component (12h and 24h)
// ============================================================================

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  timeFormat = "12h",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(value)

  const date = value ?? internalDate

  const is24Hour = timeFormat === "24h"
  const hours = is24Hour
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1)

  const defaultPlaceholder = is24Hour ? "MM/DD/YYYY HH:mm" : "MM/DD/YYYY hh:mm aa"
  const formatString = is24Hour ? "MM/dd/yyyy HH:mm" : "MM/dd/yyyy hh:mm aa"

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve time when selecting new date
      if (date) {
        selectedDate.setHours(date.getHours())
        selectedDate.setMinutes(date.getMinutes())
      }
      setInternalDate(selectedDate)
      onChange?.(selectedDate)
    }
  }

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    timeValue: string
  ) => {
    const newDate = date ? new Date(date) : new Date()

    if (type === "hour") {
      if (is24Hour) {
        newDate.setHours(parseInt(timeValue))
      } else {
        const isPM = newDate.getHours() >= 12
        newDate.setHours((parseInt(timeValue) % 12) + (isPM ? 12 : 0))
      }
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(timeValue))
    } else if (type === "ampm") {
      const currentHours = newDate.getHours()
      if (timeValue === "PM" && currentHours < 12) {
        newDate.setHours(currentHours + 12)
      } else if (timeValue === "AM" && currentHours >= 12) {
        newDate.setHours(currentHours - 12)
      }
    }

    setInternalDate(newDate)
    onChange?.(newDate)
  }

  const getHourValue = () => {
    if (!date) return null
    if (is24Hour) return date.getHours()
    const hour = date.getHours() % 12
    return hour === 0 ? 12 : hour
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, formatString)
          ) : (
            <span>{placeholder ?? defaultPlaceholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            {/* Hours */}
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {[...hours].reverse().map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={getHourValue() === hour ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("hour", hour.toString())}
                  >
                    {is24Hour ? hour.toString().padStart(2, "0") : hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>

            {/* Minutes */}
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={date && date.getMinutes() === minute ? "default" : "ghost"}
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange("minute", minute.toString())}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>

            {/* AM/PM for 12h format */}
            {!is24Hour && (
              <ScrollArea>
                <div className="flex sm:flex-col p-2">
                  {["AM", "PM"].map((ampm) => (
                    <Button
                      key={ampm}
                      size="icon"
                      variant={
                        date &&
                          ((ampm === "AM" && date.getHours() < 12) ||
                            (ampm === "PM" && date.getHours() >= 12))
                          ? "default"
                          : "ghost"
                      }
                      className="sm:w-full shrink-0 aspect-square"
                      onClick={() => handleTimeChange("ampm", ampm)}
                    >
                      {ampm}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// DateRangePicker Component
// ============================================================================

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(value)

  const range = value ?? internalRange

  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    setInternalRange(selectedRange)
    onChange?.(selectedRange)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, "LLL dd, y")} - {format(range.to, "LLL dd, y")}
              </>
            ) : (
              format(range.from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={handleRangeSelect}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  )
}

// ============================================================================
// DateTimeRangePicker Component
// ============================================================================

export function DateTimeRangePicker({
  value,
  onChange,
  placeholder = "Pick a date & time range",
  className,
  disabled = false,
  timeFormat = "12h",
}: DateTimeRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(value)
  const [activeDate, setActiveDate] = React.useState<"from" | "to">("from")

  const range = value ?? internalRange

  const is24Hour = timeFormat === "24h"
  const hours = is24Hour
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 12 }, (_, i) => i + 1)

  const formatString = is24Hour ? "LLL dd, y HH:mm" : "LLL dd, y hh:mm aa"

  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    if (selectedRange) {
      // Preserve times when selecting new dates
      if (range?.from && selectedRange.from) {
        selectedRange.from.setHours(range.from.getHours())
        selectedRange.from.setMinutes(range.from.getMinutes())
      }
      if (range?.to && selectedRange.to) {
        selectedRange.to.setHours(range.to.getHours())
        selectedRange.to.setMinutes(range.to.getMinutes())
      }
    }
    setInternalRange(selectedRange)
    onChange?.(selectedRange)
  }

  const handleTimeChange = (
    type: "hour" | "minute" | "ampm",
    timeValue: string
  ) => {
    if (!range) return

    const targetDate = activeDate === "from" ? range.from : range.to
    if (!targetDate) return

    const newDate = new Date(targetDate)

    if (type === "hour") {
      if (is24Hour) {
        newDate.setHours(parseInt(timeValue))
      } else {
        const isPM = newDate.getHours() >= 12
        newDate.setHours((parseInt(timeValue) % 12) + (isPM ? 12 : 0))
      }
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(timeValue))
    } else if (type === "ampm") {
      const currentHours = newDate.getHours()
      if (timeValue === "PM" && currentHours < 12) {
        newDate.setHours(currentHours + 12)
      } else if (timeValue === "AM" && currentHours >= 12) {
        newDate.setHours(currentHours - 12)
      }
    }

    let newRange: DateRange

    if (activeDate === "from") {
      // When changing start time, if it would be after end time, also update end time
      if (range.to && newDate.getTime() > range.to.getTime()) {
        newRange = { from: newDate, to: new Date(newDate) }
      } else {
        newRange = { from: newDate, to: range.to }
      }
    } else {
      // When changing end time, if it would be before start time, set it to start time
      if (range.from && newDate.getTime() < range.from.getTime()) {
        newRange = { from: range.from, to: new Date(range.from) }
      } else {
        newRange = { from: range.from, to: newDate }
      }
    }

    setInternalRange(newRange)
    onChange?.(newRange)
  }

  const getCurrentDate = () => {
    return activeDate === "from" ? range?.from : range?.to
  }

  const getHourValue = () => {
    const date = getCurrentDate()
    if (!date) return null
    if (is24Hour) return date.getHours()
    const hour = date.getHours() % 12
    return hour === 0 ? 12 : hour
  }



  // Check if hour is in range (for muted background)
  const isHourInRange = (hour: number) => {
    if (!range?.from || !range?.to) return false

    // Convert display hour to 24h for comparison
    let hour24 = hour
    if (!is24Hour) {
      // For 12h format, we need to consider the current date's AM/PM
      const currentDate = getCurrentDate()
      if (currentDate) {
        const isPM = currentDate.getHours() >= 12
        hour24 = (hour % 12) + (isPM ? 12 : 0)
      }
    }

    const currentDate = getCurrentDate()
    if (!currentDate) return false

    // Check if same date
    const sameDate = range.from.toDateString() === range.to.toDateString()
    if (sameDate) {
      const fromHour = range.from.getHours()
      const toHour = range.to.getHours()
      const minHour = Math.min(fromHour, toHour)
      const maxHour = Math.max(fromHour, toHour)
      return hour24 > minHour && hour24 < maxHour
    }

    // Different dates
    const isStartDay = range.from.toDateString() === currentDate.toDateString()
    const isEndDay = range.to.toDateString() === currentDate.toDateString()

    if (isStartDay) {
      // On start day, everything after start hour is in range
      return hour24 > range.from.getHours()
    }

    if (isEndDay) {
      // On end day, everything before end hour is in range
      return hour24 < range.to.getHours()
    }

    // If somehow we are viewing a date strictly between start and end date (unlikely with current UI),
    // then all hours are in range.
    return true
  }

  // Check if minute is in range
  const isMinuteInRange = (minute: number) => {
    if (!range?.from || !range?.to) return false

    const fromHour = range.from.getHours()
    const toHour = range.to.getHours()
    const fromMinute = range.from.getMinutes()
    const toMinute = range.to.getMinutes()
    const currentDate = getCurrentDate()

    if (!currentDate) return false
    const currentHour = currentDate.getHours()

    // Check if same date
    const sameDate = range.from.toDateString() === range.to.toDateString()

    if (sameDate) {
      if (fromHour === toHour) {
        // Same hour - show range between minutes
        const minMinute = Math.min(fromMinute, toMinute)
        const maxMinute = Math.max(fromMinute, toMinute)
        return minute > minMinute && minute < maxMinute
      }

      // Different hours on same date
      if (currentHour === fromHour) return minute > fromMinute
      if (currentHour === toHour) return minute < toMinute
      if (currentHour > fromHour && currentHour < toHour) return true
      return false
    }

    // Different dates
    const isStartDay = range.from.toDateString() === currentDate.toDateString()
    const isEndDay = range.to.toDateString() === currentDate.toDateString()

    // If we are on neither start nor end day (shouldn't happen with current UI but safety check)
    if (!isStartDay && !isEndDay) return false

    if (isStartDay) {
      // On start day, everything after start time is in range
      if (currentHour === fromHour) return minute > fromMinute
      if (currentHour > fromHour) return true
      return false
    }

    if (isEndDay) {
      // On end day, everything before end time is in range
      if (currentHour === toHour) return minute < toMinute
      if (currentHour < toHour) return true
      return false
    }

    return false
  }

  // Check if this is the start/end hour
  const isStartHour = (hour: number) => {
    if (!range?.from) return false
    const currentDate = getCurrentDate()
    if (!currentDate) return false

    // Must be on the same date as start date
    if (range.from.toDateString() !== currentDate.toDateString()) return false

    let hour24 = hour
    if (!is24Hour) {
      const isPM = currentDate.getHours() >= 12
      hour24 = (hour % 12) + (isPM ? 12 : 0)
    }
    return range.from.getHours() === hour24
  }

  const isEndHour = (hour: number) => {
    if (!range?.to) return false
    const currentDate = getCurrentDate()
    if (!currentDate) return false

    // Must be on the same date as end date
    if (range.to.toDateString() !== currentDate.toDateString()) return false

    let hour24 = hour
    if (!is24Hour) {
      const isPM = currentDate.getHours() >= 12
      hour24 = (hour % 12) + (isPM ? 12 : 0)
    }
    return range.to.getHours() === hour24
  }

  const isStartMinute = (minute: number) => {
    if (!range?.from) return false
    const currentDate = getCurrentDate()
    if (!currentDate) return false

    // Must be on the same date as start date
    if (range.from.toDateString() !== currentDate.toDateString()) return false

    // Only show start minute marker when on the start hour
    if (currentDate.getHours() !== range.from.getHours()) return false
    return range.from.getMinutes() === minute
  }

  const isEndMinute = (minute: number) => {
    if (!range?.to) return false
    const currentDate = getCurrentDate()
    if (!currentDate) return false

    // Must be on the same date as end date
    if (range.to.toDateString() !== currentDate.toDateString()) return false

    // Only show end minute marker when on the end hour
    if (currentDate.getHours() !== range.to.getHours()) return false
    return range.to.getMinutes() === minute
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, formatString)} - {format(range.to, formatString)}
              </>
            ) : (
              format(range.from, formatString)
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          {/* Date/Time Toggle */}
          <div className="flex border-b">
            <Button
              variant={activeDate === "from" ? "default" : "ghost"}
              className="flex-1 rounded-r-none rounded-bl-none"
              size="sm"
              onClick={() => setActiveDate("from")}
            >
              Start {range?.from && `(${format(range.from, "MMM d")})`}
            </Button>
            <Button
              variant={activeDate === "to" ? "default" : "ghost"}
              className="flex-1 rounded-l-none rounded-br-none"
              size="sm"
              onClick={() => setActiveDate("to")}
              disabled={!range?.from}
            >
              End {range?.to && `(${format(range.to, "MMM d")})`}
            </Button>
          </div>

          <div className="sm:flex">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={range?.from}
              selected={range}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
            />

            <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
              {/* Hours */}
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {hours.map((hour) => {
                    const isSelected = getHourValue() === hour
                    const inRange = isHourInRange(hour)
                    const isStart = isStartHour(hour)
                    const isEnd = isEndHour(hour)
                    return (
                      <Button
                        key={hour}
                        size="icon"
                        variant={isSelected ? "default" : inRange || isStart || isEnd ? "secondary" : "ghost"}
                        className={cn(
                          "sm:w-full shrink-0 aspect-square",
                          inRange && "rounded-none",
                          isStart && !isEnd && "rounded-b-none",
                          isEnd && !isStart && "rounded-t-none"
                        )}
                        onClick={() => handleTimeChange("hour", hour.toString())}
                        disabled={!getCurrentDate()}
                      >
                        {is24Hour ? hour.toString().padStart(2, "0") : hour}
                      </Button>
                    )
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>

              {/* Minutes */}
              <ScrollArea className="w-64 sm:w-auto">
                <div className="flex sm:flex-col p-2">
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => {
                    const currentDate = getCurrentDate()
                    const isSelected = currentDate && currentDate.getMinutes() === minute
                    const inRange = isMinuteInRange(minute)
                    const isStart = isStartMinute(minute)
                    const isEnd = isEndMinute(minute)
                    return (
                      <Button
                        key={minute}
                        size="icon"
                        variant={isSelected ? "default" : inRange || isStart || isEnd ? "secondary" : "ghost"}
                        className={cn(
                          "sm:w-full shrink-0 aspect-square",
                          inRange && "rounded-none",
                          isStart && !isEnd && "rounded-b-none",
                          isEnd && !isStart && "rounded-t-none"
                        )}
                        onClick={() => handleTimeChange("minute", minute.toString())}
                        disabled={!currentDate}
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    )
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="sm:hidden" />
              </ScrollArea>

              {/* AM/PM for 12h format */}
              {!is24Hour && (
                <ScrollArea>
                  <div className="flex sm:flex-col p-2">
                    {["AM", "PM"].map((ampm) => {
                      const currentDate = getCurrentDate()
                      return (
                        <Button
                          key={ampm}
                          size="icon"
                          variant={
                            currentDate &&
                              ((ampm === "AM" && currentDate.getHours() < 12) ||
                                (ampm === "PM" && currentDate.getHours() >= 12))
                              ? "default"
                              : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square"
                          onClick={() => handleTimeChange("ampm", ampm)}
                          disabled={!currentDate}
                        >
                          {ampm}
                        </Button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
