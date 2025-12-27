"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react"
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

  if (loading) return <div>Loading...</div>
  if (!equipment) return <div>Equipment not found</div>

  const openRequestsCount = requests.filter(r => r.status !== "repaired" && r.status !== "scrap").length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/equipment">
            <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{equipment.name}</h1>
        <Badge variant={openRequestsCount > 0 ? "destructive" : "secondary"}>
            {openRequestsCount} Open Requests
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium capitalize">{equipment.category}</span>
                    
                    <span className="text-muted-foreground">Serial Number:</span>
                    <span className="font-medium">{equipment.serialNumber}</span>
                    
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{equipment.department}</span>
                    
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{equipment.location}</span>
                    
                    <span className="text-muted-foreground">Maintenance Team:</span>
                    <span className="font-medium capitalize">{equipment.maintenanceTeam}</span>

                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">{equipment.status}</Badge>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                     <CardTitle>Maintenance Requests</CardTitle>
                     <CardDescription>Recent history</CardDescription>
                </div>
                <Link href={`/dashboard/requests?equipmentId=${id}`}> 
                {/* We'll handle pre-filling in Request Module */}
                    <Button size="sm">New Request</Button>
                </Link>
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
                                            req.status === 'new' ? 'default' : 
                                            req.status === 'in-progress' ? 'secondary' :
                                            req.status === 'repaired' ? 'outline' : 'destructive'
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
