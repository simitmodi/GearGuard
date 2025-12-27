"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getTechnicianSchedule } from "@/lib/db/requests"
import { MaintenanceRequest } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CalendarIcon, MapPin, Wrench } from "lucide-react"

export default function SchedulePage() {
    const { user, userRole } = useAuth()
    const [schedule, setSchedule] = useState<MaintenanceRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadSchedule() {
            if (user && userRole === 'TECHNICIAN') {
                try {
                    // Fallback to user.uid if technicianId is not on user profile in context (it should be linked)
                    // Ideally userProfile has technicianId, but often for simple app user.uid IS technicianId 
                    // or we look it up. 
                    // Previous code updates suggest linking.
                    // For now using user.uid as technicianId source roughly.
                    const data = await getTechnicianSchedule(user.uid)
                    setSchedule(data)
                } catch (error) {
                    console.error("Failed to load schedule", error)
                } finally {
                    setLoading(false)
                }
            } else {
                setLoading(false)
            }
        }
        loadSchedule()
    }, [user, userRole])

    if (loading) return <div>Loading schedule...</div>
    if (userRole !== 'TECHNICIAN') return <div>Access Restricted: Technicians Only</div>

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">My Schedule</h2>
                <p className="text-muted-foreground">Upcoming preventive maintenance tasks.</p>
            </div>

            <div className="grid gap-4">
                {schedule.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            No upcoming preventive maintenance scheduled.
                        </CardContent>
                    </Card>
                ) : (
                    schedule.map((job) => (
                        <Card key={job.id}>
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Wrench className="h-5 w-5 text-primary" />
                                            {job.equipmentName}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            Department: {job.department}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={job.status === 'NEW' ? 'default' : 'secondary'}>
                                        {job.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 font-medium">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                        {job.scheduledDate ? format(new Date(job.scheduledDate), "PPP") : "No Date"}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {job.title}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
