"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { createEquipment } from "@/lib/db/equipment"


import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(2, "Department is required"),
  category: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(), // ISO date string
  warrantyExpiration: z.date().optional(),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  teamId: z.string().optional(),
})

interface EquipmentFormProps {
  onSuccess?: () => void
}

export function EquipmentForm({ onSuccess }: EquipmentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      department: "",
      category: "",
      serialNumber: "",
      location: "",
      assignedTo: "",
      teamId: "",
    },
  })

  // Fetch teams
  const [teams, setTeams] = React.useState<{ id: string, name: string }[]>([])
  React.useEffect(() => {
    // Only fetching client side needed here, imported function
    const loadTeams = async () => {
      const { getAllTeams } = await import("@/lib/db/maintenance-teams");
      const t = await getAllTeams();
      setTeams(t);
    }
    loadTeams();
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Call DB function directly (client-side) to use authenticated user session
      await createEquipment({
        name: values.name,
        department: values.department,
        category: values.category || undefined,
        serialNumber: values.serialNumber,
        purchaseDate: values.purchaseDate,
        warrantyExpiration: values.warrantyExpiration?.toISOString(),
        location: values.location,
        assignedTo: values.assignedTo,
        maintenanceTeam: teams.find(t => t.id === values.teamId)?.name || "", // Legacy
        teamId: values.teamId,
      });

      form.reset()
      onSuccess?.()
      toast.success("Equipment added successfully")
    } catch (error) {
      console.error("Error adding equipment:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add equipment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipment Name *</FormLabel>
              <FormControl>
                <Input placeholder="CNC Machine 01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department *</FormLabel>
              <FormControl>
                <Input placeholder="Production, Maintenance, IT, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input placeholder="SN-123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Floor 1, Zone B" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignedTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned To (Employee)</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Team</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Equipment
        </Button>
      </form>
    </Form>
  )
}
