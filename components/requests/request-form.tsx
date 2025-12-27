"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
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
import type { Equipment, RequestPriority } from "@/lib/types"

const PRIORITIES: { value: RequestPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-green-600" },
  { value: "medium", label: "Medium", color: "text-yellow-600" },
  { value: "high", label: "High", color: "text-orange-600" },
  { value: "critical", label: "Critical", color: "text-red-600" },
]

const formSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  equipmentId: z.string().min(1, "Equipment is required"),
  type: z.enum(["corrective", "preventive"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(5, "Description is required"),
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
      subject: "",
      equipmentId: preselectedEquipmentId || "",
      type: preselectedDate ? "preventive" : "corrective",
      priority: "medium",
      description: "",
      scheduledDate: preselectedDate,
    },
  })

  React.useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const snap = await getDocs(collection(db, "equipment"))
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Equipment[]
        // Filter out scrapped equipment
        const usableEquipment = list.filter(e => e.isUsable !== false && e.status !== "scrapped")
        setEquipmentList(usableEquipment)

        if (preselectedEquipmentId) {
          const pre = usableEquipment.find(e => e.id === preselectedEquipmentId)
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
    setIsLoading(true)
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: values.subject,
          description: values.description,
          equipmentId: values.equipmentId,
          type: values.type,
          priority: values.priority,
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
        {/* Subject - What is wrong? */}
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Leaking Oil, Unusual Noise" {...field} />
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
                      {eq.name} ({eq.serialNumber})
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
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <div>Category: <span className="font-medium text-foreground">{selectedEquipment.category}</span></div>
            <div>Location: <span className="font-medium text-foreground">{selectedEquipment.location}</span></div>
            <div>Team: <span className="font-medium text-foreground">{selectedEquipment.maintenanceTeam}</span></div>
            <div>Department: <span className="font-medium text-foreground">{selectedEquipment.department}</span></div>
          </div>
        )}

        {/* Request Type and Priority */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Request Type *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="corrective">Corrective (Breakdown)</SelectItem>
                    <SelectItem value="preventive">Preventive (Scheduled)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRIORITIES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Scheduled Date (for preventive maintenance) */}
        {watchType === 'preventive' && (
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

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the issue in detail..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Request
        </Button>
      </form>
    </Form>
  )
}
