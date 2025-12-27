"use client"

import React, { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, Search, Filter } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RequestForm } from "@/components/requests/request-form"
import { Badge } from "@/components/ui/badge"

export default function RequestsPage() {
  const searchParams = useSearchParams()
  const equipmentIdParam = searchParams.get('equipmentId')

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    let q = query(collection(db, "requests"), orderBy("createdAt", "desc"))
    
    // If filtering by equipment, we might need composite index or client side filter.
    // simpler to just filter client side for MVP or use simple queries.
    // Firestore plain query with equality matches requires index for orderBy.
    
    const unsubscribe = onSnapshot(collection(db, "requests"), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Client sort/filter
      const sorted = items.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setRequests(sorted)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter based on param or search
  const filteredRequests = requests.filter(r => {
      if (equipmentIdParam && r.equipmentId !== equipmentIdParam) return false
      return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Maintenance Requests</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Maintenance Request</DialogTitle>
              <DialogDescription>
                Report a failure or schedule maintenance.
              </DialogDescription>
            </DialogHeader>
            <RequestForm 
                onSuccess={() => setIsDialogOpen(false)} 
                preselectedEquipmentId={equipmentIdParam || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead className="text-right">Team</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                </TableRow>
             ) : filteredRequests.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No requests found.</TableCell>
                </TableRow>
             ) : (
                filteredRequests.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.equipmentName}</TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{item.description}</TableCell>
                        <TableCell>
                             <Badge variant={
                                item.status === 'new' ? 'default' : 
                                item.status === 'in-progress' ? 'secondary' :
                                item.status === 'repaired' ? 'outline' : 'destructive'
                            }>
                                {item.status}
                            </Badge>
                        </TableCell>
                         <TableCell>
                            {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '-'}
                         </TableCell>
                        <TableCell className="text-right capitalize">{item.maintenanceTeam}</TableCell>
                    </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
