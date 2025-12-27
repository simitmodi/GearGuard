"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, CalendarIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Equipment, RequestType } from "@/lib/types"

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  equipmentId: z.string().min(1, "Equipment is required"),
  type: z.enum(["CORRECTIVE", "PREVENTIVE"]),
  scheduledDate: z.date().optional(),
})

interface RequestFormProps {
  onSuccess?: () => void
  preselectedEquipmentId?: string
  preselectedDate?: Date
}

export function RequestForm({ onSuccess, preselectedEquipmentId, preselectedDate }: RequestFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [equipmentList, setEquipmentList] = React.useState<Equipment[]>([])
  const [selectedEquipment, setSelectedEquipment] = React.useState<Equipment | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      equipmentId: preselectedEquipmentId || "",
      type: preselectedDate ? "PREVENTIVE" : "CORRECTIVE",
      scheduledDate: preselectedDate,
    },
  })

  React.useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const q = query(collection(db, "equipment"), where("isUsable", "==", true))
        const snap = await getDocs(q)
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Equipment[]
        setEquipmentList(list)

        if (preselectedEquipmentId) {
          const pre = list.find(e => e.id === preselectedEquipmentId)
          if (pre) setSelectedEquipment(pre)
        }
      } catch (error) {
        console.error("Error fetching equipment:", error)
        toast.error("Failed to load equipment list")
      }
    }
    fetchEquipment()
  }, [preselectedEquipmentId])

  const handleEquipmentChange = (id: string) => {
    form.setValue("equipmentId", id)
    const eq = equipmentList.find(e => e.id === id)
    setSelectedEquipment(eq || null)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate preventive requires scheduledDate
    if (values.type === "PREVENTIVE" && !values.scheduledDate) {
      toast.error("Scheduled date is required for preventive maintenance")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          equipmentId: values.equipmentId,
          type: values.type,
          scheduledDate: values.scheduledDate?.toISOString() ?? null,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to submit request")
      }

      form.reset()
      setSelectedEquipment(null)
      onSuccess?.()
      toast.success("Request submitted successfully")
    } catch (error) {
      console.error("Error creating request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit request")
    } finally {
      setIsLoading(false)
    }
  }

  const watchType = form.watch("type")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Title - What is the issue? */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Leaking Oil, Routine Checkup" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Equipment Selection */}
        <FormField
          control={form.control}
          name="equipmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipment *</FormLabel>
              <Select 
                onValueChange={handleEquipmentChange} 
                defaultValue={field.value} 
                disabled={!!preselectedEquipmentId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Equipment" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {equipmentList.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Auto-filled Equipment Details */}
        {selectedEquipment && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <div>Department: <span className="font-medium text-foreground">{selectedEquipment.department}</span></div>
          </div>
        )}

        {/* Request Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CORRECTIVE">Corrective (Breakdown)</SelectItem>
                  <SelectItem value="PREVENTIVE">Preventive (Scheduled)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scheduled Date - Only for Preventive */}
        {watchType === "PREVENTIVE" && (
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Date *</FormLabel>
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
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </form>
    </Form>
  )
}
