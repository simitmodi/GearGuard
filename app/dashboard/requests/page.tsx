"use client"

import React, { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, Search, Filter, CheckCircle, PlayCircle, Clock } from "lucide-react"
import { useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { RequestForm } from "@/components/requests/request-form"
import { Badge } from "@/components/ui/badge"

import { useAuth } from "@/lib/auth-context"
import { pickupRequest, updateRequestStatus } from "@/lib/db/requests"
import { toast } from "sonner"
import { getUserProfile } from "@/lib/db/users"

export default function RequestsPage() {
  const searchParams = useSearchParams()
  const equipmentIdParam = searchParams.get('equipmentId')

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Completion Dialog State
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [duration, setDuration] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const { user, userRole } = useAuth()
  const myAssignedParam = searchParams.get('my_assigned') === 'true'

  useEffect(() => {
    if (!user) return

    let q;
    const collectionRef = collection(db, "requests")

    if (userRole === 'USER') {
      q = query(collectionRef, where("createdBy", "==", user.uid))
    } else if (userRole === 'TECHNICIAN' && myAssignedParam) {
      q = query(collectionRef, where("technicianId", "==", user.uid))
    } else if (equipmentIdParam) {
      q = query(collectionRef, where("equipmentId", "==", equipmentIdParam))
    } else {
      q = query(collectionRef, orderBy("createdAt", "desc"))
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      const sorted = items.sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setRequests(sorted)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching requests:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, userRole, equipmentIdParam, myAssignedParam])

  const filteredRequests = requests.filter(r => {
    if (equipmentIdParam && r.equipmentId !== equipmentIdParam) return false
    return true
  })

  // Handlers
  const handleTakeRequest = async (requestId: string) => {
    if (!user) return
    try {
      // Need user profile to verify role/permissions logic inside pickupRequest if generic, 
      // but here we call client side. pickupRequest expects technicianId (userId).
      // We should verify we have a technician profile?
      // For now, using user.uid (Auth ID) which links to Technician ID.
      const result = await pickupRequest(requestId, user.uid)
      if (result.success) {
        toast.success("Request assigned to you and started.")
      } else {
        toast.error(result.error || "Failed to pickup request.")
      }
    } catch (e) {
      toast.error("An error occurred.")
    }
  }

  const openCompleteDialog = (requestId: string) => {
    setSelectedRequestId(requestId)
    setDuration("")
    setIsCompleteDialogOpen(true)
  }

  const handleCompleteRequest = async () => {
    if (!selectedRequestId || !user) return
    if (!duration || isNaN(Number(duration))) {
      toast.error("Please enter a valid duration in minutes.")
      return
    }

    setIsProcessing(true)
    try {
       // We need to pass a profile object for RBAC in updateRequestStatus if we want to be strict,
       // or at least correct ID.
       const result = await updateRequestStatus(
         selectedRequestId, 
         "REPAIRED", 
         undefined, 
         Number(duration), 
         { id: user.uid, role: userRole || "TECHNICIAN", technicianId: user.uid } // Assuming auth uid = tech id
       )

       if (result.success) {
         toast.success("Request marked as completed.")
         setIsCompleteDialogOpen(false)
       } else {
         toast.error(result.error || "Failed to complete request.")
       }
    } catch (e) {
      toast.error("An error occurred.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">Loading...</TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No requests found.</TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>{item.equipmentName}</div>
                    {item.category && <div className="text-xs text-muted-foreground">{item.category}</div>}
                  </TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{item.title}</TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'NEW' ? 'default' :
                        item.status === 'IN_PROGRESS' ? 'secondary' :
                          item.status === 'REPAIRED' ? 'outline' : 'destructive'
                    }>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="capitalize">{item.maintenanceTeam || '-'}</TableCell>
                  <TableCell className="text-right">
                    {/* Action Buttons */}
                    {(userRole === 'TECHNICIAN' || userRole === 'MANAGER') && item.status === 'NEW' && (
                      <Button size="sm" variant="outline" onClick={() => handleTakeRequest(item.id)}>
                        <PlayCircle className="mr-2 h-3.5 w-3.5" />
                        Take
                      </Button>
                    )}
                    {(userRole === 'TECHNICIAN' || userRole === 'MANAGER') && item.status === 'IN_PROGRESS' && (
                       // Only allow complete if assigned to self or manager?
                       // For simplicity, allowed for now.
                      <Button size="sm" variant="default" onClick={() => openCompleteDialog(item.id)}>
                        <CheckCircle className="mr-2 h-3.5 w-3.5" />
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Completion Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Request</DialogTitle>
            <DialogDescription>
              Record the duration of the maintenance task.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div className="space-y-2">
               <Label>Duration (Minutes)</Label>
               <Input 
                 type="number" 
                 placeholder="e.g. 45" 
                 value={duration} 
                 onChange={(e) => setDuration(e.target.value)} 
               />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteRequest} disabled={isProcessing}>
              {isProcessing && <Clock className="mr-2 h-4 w-4 animate-spin" />}
              Mark Repaired
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
