"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"

interface MiniCalendarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function MiniCalendar({ currentDate, onDateChange }: MiniCalendarProps) {
  return (
    <div className="w-full">
      <div className="rounded-md border bg-card p-3 shadow-sm">
        <Calendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && onDateChange(date)}
            weekStartsOn={1}
            className="w-full flex justify-center"
            classNames={{
                month: "w-full space-y-4",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                row: "flex w-full mt-2",
                cell: "text-center text-xs p-0 flex-1 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-8 w-full p-0 font-normal aria-selected:opacity-100 items-center justify-center flex hover:bg-accent hover:text-accent-foreground rounded-md",
                head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] flex justify-center mb-2",
            }}
        />
      </div>
      <div className="mt-4 p-4 rounded-md bg-muted/30 border text-xs text-muted-foreground">
        <h4 className="font-semibold mb-2 text-foreground">Legend</h4>
        <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span>Urgent</span>
        </div>
      </div>
    </div>
  )
}
