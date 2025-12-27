"use client"

import * as React from "react"
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  addDays, 
  isToday 
} from "date-fns"
import { cn } from "@/lib/utils"

interface WeekViewProps {
  currentDate: Date
  events: any[]
  onEventClick?: (event: any) => void
  onDateClick?: (date: Date) => void
}

export function WeekView({ currentDate, events, onEventClick, onDateClick }: WeekViewProps) {
  // ... dependencies ...
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  // Generate hours 06:00 to 23:00 as per mockup/request
  const hours = Array.from({ length: 18 }, (_, i) => i + 6) 

  // State for current time indicator
  const [now, setNow] = React.useState(new Date())

  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-full border rounded-md bg-background overflow-hidden relative">
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar grid grid-cols-8 divide-x w-full">
        
        {/* Sticky Header Row */}
        {/* Time Header */}
        <div className="sticky top-0 z-30 bg-background border-b p-2 text-center text-xs text-muted-foreground font-medium bg-muted/30 h-[60px] flex items-center justify-center border-r">
          Time
        </div>
        {/* Days Headers */}
        {days.map((day) => (
            <div 
                key={`header-${day.toString()}`} 
                className={cn(
                    "sticky top-0 z-30 bg-background border-b p-2 text-center flex flex-col items-center justify-center h-[60px] border-r last:border-r-0 cursor-pointer hover:bg-muted/50 transition-colors", 
                    isToday(day) && "bg-accent/50"
                )}
                onClick={() => onDateClick?.(day)}
            >
                <span className="text-xs text-muted-foreground uppercase">{format(day, "EEE")}</span>
                <span className={cn(
                    "text-xl font-bold h-8 w-8 flex items-center justify-center rounded-full mt-1",
                    isToday(day) && "bg-primary text-primary-foreground"
                )}>
                    {format(day, "d")}
                </span>
            </div>
        ))}

        {/* Grid Body: Time Column */}
        <div className="divide-y bg-muted/10 border-r">
            {hours.map(hour => (
                <div key={`time-${hour}`} className="h-20 text-xs text-muted-foreground p-2 text-right relative">
                    <span className="absolute -top-2 right-2 bg-background px-1">
                        {hour.toString().padStart(2, '0')}:00
                    </span>
                </div>
            ))}
        </div>

        {/* Grid Body: Days Columns */}
        {days.map(day => {
            const dayEvents = events.filter(e => 
                e.scheduledDate && isSameDay(new Date(e.scheduledDate), day)
            )
            const isCurrentDay = isToday(day)
            
            // Calculate position for current time indicator
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()
            const startHour = 6
            let topPosition = -1
            
            if (currentHour >= startHour && currentHour < 24) {
                 topPosition = ((currentHour - startHour) * 80) + ((currentMinute / 60) * 80)
            }

            return (
                <div 
                    key={`body-${day.toString()}`} 
                    className="divide-y relative border-r last:border-r-0 cursor-pointer hover:bg-muted/5 transition-colors"
                    onClick={() => onDateClick?.(day)}
                >
                     {/* Background Grid Lines matching logic to Time Column */}
                    {hours.map(hour => (
                         <div key={`grid-${day}-${hour}`} className="h-20 border-b border-dashed border-border/50"></div>
                    ))}

                    {/* Current Time Indicator */}
                    {isCurrentDay && topPosition >= 0 && (
                        <div 
                            className="absolute z-20 w-full flex items-center pointer-events-none"
                            style={{ top: `${topPosition}px` }}
                        >
                            <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 ring-2 ring-background shadow-sm" />
                            <div className="h-[2px] bg-red-500 w-full shadow-[0_0_4px_rgba(239,68,68,0.4)]" />
                        </div>
                    )}

                    {/* Events Overlay */}
                    {dayEvents.map(event => (
                        <div 
                            key={event.id}
                            className="absolute left-1 right-1 bg-primary/15 border-l-4 border-primary p-2 text-xs rounded-r cursor-pointer hover:bg-primary/25 transition-colors overflow-hidden"
                            style={{
                                top: `${(9 - 6) * 80}px`, 
                                height: "70px",
                                zIndex: 10
                            }}
                             onClick={(e) => {
                               e.stopPropagation();
                               onEventClick?.(event);
                             }}
                        >
                            <div className="font-semibold truncate">{event.equipmentName}</div>
                            <div className="truncate opacity-75">{event.title}</div>
                        </div>
                    ))}
                </div>
            )
        })}
      </div>
    </div>
  )
}
