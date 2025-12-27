"use client"

import React, { useEffect, useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock } from "lucide-react"

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

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Request[]
      setRequests(items)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId
    
    // Optimistic update
    const updatedRequests = requests.map(req => {
        if (req.id === draggableId) {
            return { ...req, status: newStatus }
        }
        return req
    })
    setRequests(updatedRequests)

    // Firestore Update
    try {
        const docRef = doc(db, "requests", draggableId)
        await updateDoc(docRef, { status: newStatus })
    } catch (error) {
        console.error("Failed to update status", error)
        // Revert (could fetch again or revert state)
    }
  }

  // Group requests by column
  const getColumnRequests = (columnId: string) => {
      return requests.filter(req => req.status === columnId)
  }

  if (loading) return <div>Loading board...</div>

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
                            <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`cursor-grab active:cursor-grabbing ${isOverdue ? 'border-red-500 border-2' : ''}`}
                            >
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
                                <div className="mt-2 text-[10px] uppercase font-bold text-primary/70">
                                    {req.maintenanceTeam}
                                </div>
                            </CardContent>
                            </Card>
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
  )
}
