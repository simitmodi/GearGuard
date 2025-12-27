"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createRequest, createPreventiveRequest } from "@/lib/db/requests"
import { Loader2, CalendarIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserProfile } from "@/lib/db/users"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [assignedResult, setAssignedResult] = React.useState<{ tech: string | null; request: string } | null>(null)
  const { user, userRole } = useAuth()

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
      // Call DB function directly (client-side) to use authenticated user session
      if (!user) throw new Error("Must be logged in");
      const profile = await getUserProfile(user.uid);

      if (!profile) throw new Error("User profile not found");

      let result;

      if (values.type === "PREVENTIVE") {
        // Explicitly use the new Preventive function
        // Import it first? It needs to be imported. 
        // Assuming I add the import at the top in a separate edit or I can't access it. 
        // I will use `request-types-logic` here.



        result = await createPreventiveRequest({
          title: values.title,
          equipmentId: values.equipmentId,
          scheduledDate: values.scheduledDate!.toISOString(),
        }, { id: profile.id, role: profile.role });

      } else {
        // Standard Corrective Request
        result = await createRequest({
          title: values.title,
          equipmentId: values.equipmentId,
          type: values.type,
          scheduledDate: values.scheduledDate?.toISOString() ?? undefined,
        }, { id: profile.id, role: profile.role });
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to submit request")
      }

      form.reset()
      setSelectedEquipment(null)
      onSuccess?.()

      // Show confirmation dialog with assigned technician
      setAssignedResult({
        tech: result.request.technicianName || "Pending Assignment",
        request: result.request.title,
      })
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

        {/* Request Type - Restricted for Users */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Type *</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={userRole !== "MANAGER"} // Only Managers can change type
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CORRECTIVE">Corrective (Breakdown)</SelectItem>
                  {userRole === "MANAGER" && (
                    <SelectItem value="PREVENTIVE">Preventive (Scheduled)</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {userRole !== "MANAGER" && <FormMessage>Users can only report corrective issues.</FormMessage>}
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

      <Dialog open={!!assignedResult} onOpenChange={(open) => !open && setAssignedResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Created Successfully! 🎉</DialogTitle>
            <DialogDescription>
              Your maintenance request has been logged.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <div className="flex justify-between items-center bg-muted p-2 rounded">
              <span className="text-sm font-medium">Request:</span>
              <span className="text-sm">{assignedResult?.request}</span>
            </div>
            <div className="flex justify-between items-center bg-primary/10 p-2 rounded border border-primary/20">
              <span className="text-sm font-medium text-primary">Assigned Technician:</span>
              <span className="text-lg font-bold text-primary">
                {assignedResult?.tech}
              </span>
            </div>
            <div className="text-xs text-muted-foreground text-center pt-2">
              The assigned technician has been notified and task count updated.
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setAssignedResult(null)}>Okay, Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form >
  )
}
