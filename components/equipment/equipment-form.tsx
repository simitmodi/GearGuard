"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { MaintenanceTeam, Technician, EquipmentCategory } from "@/lib/types"

const EQUIPMENT_CATEGORIES: { value: EquipmentCategory; label: string }[] = [
  { value: "heavy-machinery", label: "Heavy Machinery" },
  { value: "electronics", label: "Electronics" },
  { value: "vehicles", label: "Vehicles" },
  { value: "tools", label: "Tools" },
  { value: "it-equipment", label: "IT Equipment" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "other", label: "Other" },
]

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  serialNumber: z.string().min(1, "Serial number is required"),
  category: z.string().min(1, "Category is required"),
  department: z.string().min(1, "Department is required"),
  location: z.string().min(1, "Location is required"),
  assignedTo: z.string().optional(),
  purchaseDate: z.date({ required_error: "Purchase date is required" }),
  warrantyExpiryDate: z.date().optional(),
  purchaseCost: z.string().optional(),
  vendor: z.string().optional(),
  maintenanceTeamId: z.string().min(1, "Maintenance team is required"),
  defaultTechnicianId: z.string().optional(),
  notes: z.string().optional(),
})

interface EquipmentFormProps {
  onSuccess?: () => void
  teams?: MaintenanceTeam[]
  technicians?: Technician[]
}

export function EquipmentForm({ onSuccess, teams = [], technicians = [] }: EquipmentFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedTeamId, setSelectedTeamId] = React.useState<string>("")
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      serialNumber: "",
      category: "",
      department: "",
      location: "",
      assignedTo: "",
      purchaseCost: "",
      vendor: "",
      maintenanceTeamId: "",
      defaultTechnicianId: "",
      notes: "",
    },
  })

  // Filter technicians by selected team
  const filteredTechnicians = React.useMemo(() => {
    if (!selectedTeamId) return []
    return technicians.filter(t => t.teamId === selectedTeamId && t.isActive)
  }, [selectedTeamId, technicians])

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId)
    form.setValue("maintenanceTeamId", teamId)
    form.setValue("defaultTechnicianId", "") // Reset technician when team changes
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          purchaseDate: values.purchaseDate.toISOString(),
          warrantyExpiryDate: values.warrantyExpiryDate?.toISOString() ?? null,
          purchaseCost: values.purchaseCost ? parseFloat(values.purchaseCost) : null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to add equipment")
      }

      form.reset()
      setSelectedTeamId("")
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
        {/* Basic Info */}
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number *</FormLabel>
                <FormControl>
                  <Input placeholder="SN-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department *</FormLabel>
                <FormControl>
                  <Input placeholder="Production" {...field} />
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
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input placeholder="Floor 1, Zone A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ownership */}
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

        {/* Purchase & Warranty */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Purchase Date *</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="warrantyExpiryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Warranty Expiry</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vendor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor</FormLabel>
                <FormControl>
                  <Input placeholder="ABC Machinery Co." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Maintenance Responsibility */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="maintenanceTeamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Team *</FormLabel>
                <Select onValueChange={handleTeamChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name} ({team.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultTechnicianId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Technician</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!selectedTeamId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedTeamId ? "Select technician" : "Select team first"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredTechnicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name} ({tech.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about the equipment..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Equipment
        </Button>
      </form>
    </Form>
  )
}
