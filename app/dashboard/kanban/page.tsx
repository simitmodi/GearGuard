"use client"

import { KanbanBoard } from "@/components/kanban/kanban-board"

export default function KanbanPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
             <h2 className="text-2xl font-bold tracking-tight">Maintenance Board</h2>
        </div>
      <KanbanBoard />
    </div>
  )
}
