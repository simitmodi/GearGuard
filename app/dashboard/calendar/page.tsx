"use client"

import React, { useEffect, useState } from "react"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RequestForm } from "@/components/requests/request-form"
import { isSameDay } from "date-fns"

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [requests, setRequests] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    // Fetch all requests with scheduledDate
    // Ideally filter by month range, but fetching all for MVP
    const q = query(collection(db, "requests"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((r: any) => r.scheduledDate) // Only scheduled ones
      setRequests(items)
    })
    return () => unsubscribe()
  }, [])

  // Modifiers for the calendar
  const modifiers = {
    booked: requests.map(r => new Date(r.scheduledDate)),
  }
  const modifiersStyles = {
    booked: { color: 'var(--primary)', fontWeight: 'bold' }
  }

  const selectedDayRequests = date 
    ? requests.filter(r => isSameDay(new Date(r.scheduledDate), date))
    : []

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-2xl font-bold tracking-tight">Preventive Schedule</h2>
      
      <div className="grid md:grid-cols-[400px_1fr] gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Select a date to view or add maintenance.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                />
            </CardContent>
        </Card>

        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                     <CardTitle>{date ? date.toDateString() : "Select a date"}</CardTitle>
                     <CardDescription>Scheduled Maintenance</CardDescription>
                </div>
                {date && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm">Schedule Maintenance</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Schedule Maintenance</DialogTitle>
                                <DialogDescription>Create a preventive maintenance request for this date.</DialogDescription>
                            </DialogHeader>
                            <RequestForm 
                                onSuccess={() => setIsDialogOpen(false)} 
                                preselectedDate={date}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-4">
                    {selectedDayRequests.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No maintenance scheduled for this day.</p>
                    ) : (
                        selectedDayRequests.map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h4 className="font-semibold text-sm">{req.equipmentName}</h4>
                                    <p className="text-xs text-muted-foreground">{req.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline">{req.status}</Badge>
                                    <span className="text-xs text-muted-foreground capitalize">{req.maintenanceTeam}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
