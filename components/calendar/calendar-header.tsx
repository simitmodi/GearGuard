"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addWeeks, subWeeks } from "date-fns"
import { Button } from "@/components/ui/button"

interface CalendarHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function CalendarHeader({ currentDate, onDateChange }: CalendarHeaderProps) {
  const handlePrevWeek = () => onDateChange(subWeeks(currentDate, 1))
  const handleNextWeek = () => onDateChange(addWeeks(currentDate, 1))
  const handleToday = () => onDateChange(new Date())

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Maintenance Calendar</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleToday}>
          Today
        </Button>
        <div className="flex items-center rounded-md border bg-background ml-2">
          <Button variant="ghost" size="icon" onClick={handlePrevWeek} className="h-8 w-8 rounded-r-none">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-4 w-[1px] bg-border" />
          <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 rounded-l-none">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-sm font-medium ml-2 min-w-[120px] text-center">
            {format(currentDate, "MMMM yyyy")}
        </span>
      </div>
    </div>
  )
}
