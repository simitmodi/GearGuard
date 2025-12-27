"use client"

import React, { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateRequestStatus } from "@/lib/db/requests"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Request {
  id: string
  equipmentName: string
  type: string
  description: string
  status: string
  maintenanceTeam: string
  scheduledDate?: string
  createdAt: string
  [key: string]: any
}

const columns = [
  { id: "new", title: "New Requests" },
  { id: "in-progress", title: "In Progress" },
  { id: "repaired", title: "Repaired" },
  { id: "scrap", title: "Scrap" },
]

export function KanbanBoard() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [completingRequest, setCompletingRequest] = useState<string | null>(null)
  const [duration, setDuration] = useState("")
  const [pendingDrag, setPendingDrag] = useState<DropResult | null>(null)

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Request[]
      setRequests(items)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId as any

    // If moving to REPAIRED, ask for duration
    if (newStatus === "REPAIRED") {
      setPendingDrag(result)
      setCompletingRequest(draggableId)
      setDuration("")
      return
    }

    // Otherwise, standard update
    await processUpdate(draggableId, newStatus)
  }

  const processUpdate = async (id: string, status: any, durationVal?: number) => {
    // Optimistic update
    const updatedRequests = requests.map(req => {
      if (req.id === id) {
        return { ...req, status: status }
      }
      return req
    })
    setRequests(updatedRequests)

    // Backend Update
    const result = await updateRequestStatus(id, status, undefined, durationVal)
    if (!result.success) {
      toast.error("Failed to update status")
      // Revert would go here (fetch again)
    }
  }

  const confirmCompletion = async () => {
    if (!pendingDrag || !completingRequest) return

    const minutes = parseInt(duration)
    if (isNaN(minutes) || minutes < 0) {
      toast.error("Please enter a valid duration")
      return
    }

    await processUpdate(completingRequest, "REPAIRED", minutes)
    setCompletingRequest(null)
    setPendingDrag(null)
  }

  // Cancel move
  const cancelCompletion = () => {
    setCompletingRequest(null)
    setPendingDrag(null)
    // The UI automatically reverts since we didn't update state
  }

  // Group requests by column
  const getColumnRequests = (columnId: string) => {
    return requests.filter(req => req.status === columnId)
  }

  if (loading) return <div>Loading board...</div>

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.id} className="flex h-full min-w-[300px] flex-col rounded-lg bg-muted/50 p-4">
              <h3 className="mb-4 font-semibold text-lg flex items-center justify-between">
                {column.title}
                <Badge variant="secondary">{getColumnRequests(column.id).length}</Badge>
              </h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-1 flex-col gap-3"
                  >
                    {getColumnRequests(column.id).map((req, index) => {
                      const isOverdue = req.scheduledDate && new Date(req.scheduledDate) < new Date() && req.status !== 'repaired' && req.status !== 'scrap'
                      return (
                        <Draggable key={req.id} draggableId={req.id} index={index}>
                          {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`cursor-grab active:cursor-grabbing ${isOverdue ? 'border-red-500 border-2 rounded-xl' : ''}`}
                                style={{
                                    ...provided.draggableProps.style,
                                    marginBottom: '0.75rem' // Gap replacement
                                }}
                            >
                                <Card className={isOverdue ? 'border-0 shadow-none' : ''}>
                                  <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                      <Badge variant={req.type === 'preventive' ? 'outline' : 'default'} className="mb-2">
                                        {req.type}
                                      </Badge>
                                      {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                                    </div>
                                    <CardTitle className="text-sm font-medium leading-tight">
                                      {req.equipmentName}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                                    <p className="line-clamp-2 mb-2">{req.description}</p>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {new Date(req.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                      <div className="text-[10px] uppercase font-bold text-primary/70">
                                        {req.maintenanceTeam}
                                      </div>
                                      {req.technicianName && (
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                            {req.technicianName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Dialog open={!!completingRequest} onOpenChange={(open) => !open && cancelCompletion()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Request</DialogTitle>
            <DialogDescription>
              Please enter the time taken to repair this equipment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Duration (mins)
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelCompletion}>Cancel</Button>
            <Button onClick={confirmCompletion}>Complete Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
