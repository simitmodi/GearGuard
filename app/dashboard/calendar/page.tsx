"use client"

import React, { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { CalendarHeader } from "@/components/calendar/calendar-header"
import { WeekView } from "@/components/calendar/week-view"
import { MiniCalendar } from "@/components/calendar/mini-calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { isSameDay } from "date-fns"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [requests, setRequests] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  useEffect(() => {
    // Fetch all requests
    const q = query(collection(db, "requests"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((r: any) => r.scheduledDate)
      setRequests(items)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] gap-4">
      <CalendarHeader currentDate={currentDate} onDateChange={setCurrentDate} />
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 h-full overflow-hidden pb-4">
        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-6">
            <MiniCalendar currentDate={currentDate} onDateChange={setCurrentDate} />
            <div className="flex-1 rounded-md border bg-muted/10 p-4 border-dashed flex items-center justify-center text-center text-sm text-muted-foreground">
                <p>Drag & Drop Requests<br/>(Coming Soon)</p>
            </div>
        </div>

        {/* Main Week View */}
        <div className="h-full flex flex-col min-h-0 overflow-hidden">
             <WeekView 
                currentDate={currentDate} 
                events={requests} 
                onEventClick={(evt) => console.log(evt)}
            />
        </div>
      </div>

       {/* Mobile/Tablet Fallback or Addition could go here if needed, but WeekView scales via scroll */}
    </div>
  )
}
