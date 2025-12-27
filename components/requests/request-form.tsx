"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { collection, addDoc, getDocs } from "firebase/firestore"
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

const formSchema = z.object({
  equipmentId: z.string().min(1, "Equipment is required"),
  type: z.enum(["corrective", "preventive"]),
  description: z.string().min(5, "Description is required"),
  scheduledDate: z.date().optional(),
})

export function RequestForm({ onSuccess, preselectedEquipmentId, preselectedDate }: { onSuccess?: () => void, preselectedEquipmentId?: string, preselectedDate?: Date }) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [equipmentList, setEquipmentList] = React.useState<any[]>([])
  const [selectedEquipment, setSelectedEquipment] = React.useState<any>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      equipmentId: preselectedEquipmentId || "",
      type: preselectedDate ? "preventive" : "corrective",
      description: "",
      scheduledDate: preselectedDate,
    },
  })

  React.useEffect(() => {
    const fetchEquipment = async () => {
      const snap = await getDocs(collection(db, "equipment"))
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setEquipmentList(list)

      if (preselectedEquipmentId) {
          const pre = list.find(e => e.id === preselectedEquipmentId)
          if(pre) setSelectedEquipment(pre)
      }
    }
    fetchEquipment()
  }, [preselectedEquipmentId])

  const handleEquipmentChange = (id: string) => {
    form.setValue("equipmentId", id)
    const eq = equipmentList.find(e => e.id === id)
    setSelectedEquipment(eq)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await addDoc(collection(db, "requests"), {
        ...values,
        equipmentName: selectedEquipment?.name, // Denormalize for easier list display
        category: selectedEquipment?.category,
        maintenanceTeam: selectedEquipment?.maintenanceTeam,
        status: "new",
        createdAt: new Date().toISOString(),
        scheduledDate: values.scheduledDate ? values.scheduledDate.toISOString() : null
      })
      form.reset()
      onSuccess?.()
      toast.success("Request submitted successfully")
    } catch (error) {
      console.error("Error creating request:", error)
      toast.error("Failed to submit request")
    } finally {
      setIsLoading(false)
    }
  }

  const watchType = form.watch("type")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="equipmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipment</FormLabel>
               <Select onValueChange={handleEquipmentChange} defaultValue={field.value} disabled={!!preselectedEquipmentId}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Equipment" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {equipmentList.map(eq => (
                             <SelectItem key={eq.id} value={eq.id}>{eq.name} ({eq.serialNumber})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {selectedEquipment && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                 <div>Category: <span className="font-medium text-foreground">{selectedEquipment.category}</span></div>
                 <div>Team: <span className="font-medium text-foreground">{selectedEquipment.maintenanceTeam}</span></div>
            </div>
        )}

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Type</FormLabel>
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

        {watchType === 'preventive' && (
             <FormField
             control={form.control}
             name="scheduledDate"
             render={({ field }) => (
               <FormItem className="flex flex-col">
                 <FormLabel>Scheduled Date</FormLabel>
                 <Popover>
                   <PopoverTrigger asChild>
                     <FormControl>
                       <Button
                         variant={"outline"}
                         className={cn(
                           "w-full pl-3 text-left font-normal",
                           !field.value && "text-muted-foreground"
                         )}
                       >
                         {field.value ? (
                           format(field.value, "PPP")
                         ) : (
                           <span>Pick a date</span>
                         )}
                         <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                       </Button>
                     </FormControl>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0" align="start">
                     <Calendar
                       mode="single"
                       selected={field.value}
                       onSelect={field.onChange}
                       disabled={(date) =>
                         date < new Date()
                       }
                       initialFocus
                     />
                   </PopoverContent>
                 </Popover>
                 <FormMessage />
               </FormItem>
             )}
           />
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the issue..." {...field} />
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
