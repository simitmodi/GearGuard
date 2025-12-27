"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, XCircle, Clock, Loader2, AlertOctagon, Ban } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function EquipmentDetailPage() {
    const { id } = useParams()
    const [equipment, setEquipment] = useState<any>(null)
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        const fetchEquipment = async () => {
            const docRef = doc(db, "equipment", id as string)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setEquipment({ id: docSnap.id, ...docSnap.data() })
            }
        }
        fetchEquipment()

        // Real-time requests
        const q = query(
            collection(db, "requests"),
            where("equipmentId", "==", id),
            orderBy("createdAt", "desc") // Requires index maybe? Firestore handles single field auto.
        )
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setRequests(items)
            setLoading(false)
        }, (error) => {
            console.log("Error fetching requests:", error)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [id])

    if (loading) return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
    if (!equipment) return <div>Equipment not found</div>

    const openRequestsCount = requests.filter(r => r.status === "NEW" || r.status === "IN_PROGRESS").length
    const isScrapped = equipment.isUsable === false

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/equipment">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            {equipment.name}
                            {isScrapped && <Badge variant="destructive">SCRAPPED</Badge>}
                        </h1>
                        <p className="text-muted-foreground">{equipment.department}</p>
                    </div>
                </div>

                <Link href={`/dashboard/requests?equipmentId=${id}`}>
                    <Button variant="outline" className="gap-2 relative">
                        <Wrench className="h-4 w-4" />
                        Maintenance
                        {openRequestsCount > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px]">
                                {openRequestsCount}
                            </Badge>
                        )}
                    </Button>
                </Link>
            </div>

            {isScrapped && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-4 text-destructive-foreground">
                    <AlertOctagon className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-destructive">Equipment Scrapped</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            This equipment has been marked as unusable. No new maintenance requests can be created.
                        </p>
                        {equipment.scrapNote && (
                            <div className="mt-2 text-sm bg-background/50 p-2 rounded border border-destructive/10">
                                <span className="font-medium text-destructive">Reason: </span>
                                <span className="text-muted-foreground">{equipment.scrapNote}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium capitalize">{equipment.category || "N/A"}</span>

                            <span className="text-muted-foreground">Serial Number:</span>
                            <span className="font-medium">{equipment.serialNumber || "N/A"}</span>

                            <span className="text-muted-foreground">Department:</span>
                            <span className="font-medium">{equipment.department}</span>

                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-medium">{equipment.location || "N/A"}</span>

                            <span className="text-muted-foreground">Maintenance Team:</span>
                            <span className="font-medium capitalize">{equipment.maintenanceTeam || "N/A"}</span>

                            <span className="text-muted-foreground">Status:</span>
                            {isScrapped ? (
                                <Badge variant="destructive">Scrapped</Badge>
                            ) : (
                                <Badge variant="outline">Active</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Recent Requests</CardTitle>
                            <CardDescription>Latest 5 requests</CardDescription>
                        </div>
                        {!isScrapped && (
                            <Link href={`/dashboard/requests?equipmentId=${id}&action=new`}>
                                <Button size="sm">New Request</Button>
                            </Link>
                        )}
                        {isScrapped && (
                            <Button size="sm" disabled variant="outline">
                                <Ban className="mr-2 h-4 w-4" /> New Request
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No requests found.</TableCell>
                                    </TableRow>
                                ) : (
                                    requests.slice(0, 5).map((req: any) => (
                                        <TableRow key={req.id}>
                                            <TableCell className="capitalize">{req.type}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    req.status === 'NEW' ? 'default' :
                                                        req.status === 'IN_PROGRESS' ? 'secondary' :
                                                            req.status === 'REPAIRED' ? 'outline' : 'destructive'
                                                }>
                                                    {req.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
