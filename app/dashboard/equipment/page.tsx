"use client"

import React, { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Plus, Search, Wrench } from "lucide-react"
import Link from "next/link"

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
import { EquipmentForm } from "@/components/equipment/equipment-form"
import { Badge } from "@/components/ui/badge"

interface Equipment {
  id: string
  name: string
  category: string
  serialNumber: string
  department: string
  location: string
  status: string
  maintenanceTeam: string
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const q = query(collection(db, "equipment"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Equipment[]
      setEquipment(items)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Equipment</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
              <DialogDescription>
                Enter the details of the new machine or tool.
              </DialogDescription>
            </DialogHeader>
            <EquipmentForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or serial number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Team</TableHead>
             <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
                </TableRow>
             ) : filteredEquipment.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No equipment found.</TableCell>
                </TableRow>
             ) : (
                filteredEquipment.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/equipment/${item.id}`} className="hover:underline">
                                {item.name}
                            </Link>
                        </TableCell>
                        <TableCell className="capitalize">{item.category}</TableCell>
                        <TableCell>{item.serialNumber}</TableCell>
                        <TableCell>{item.location}</TableCell>
                         <TableCell className="capitalize">{item.maintenanceTeam}</TableCell>
                        <TableCell className="text-right">
                             <Link href={`/dashboard/equipment/${item.id}`}>
                                <Button variant="ghost" size="sm">
                                    <Wrench className="h-4 w-4 mr-1"/> Details
                                </Button>
                             </Link>
                        </TableCell>
                    </TableRow>
                ))
             )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
