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
import { toast } from "sonner"
import type { TeamSpecialization } from "@/lib/types"

const SPECIALIZATIONS: { value: TeamSpecialization; label: string }[] = [
  { value: "mechanics", label: "Mechanics" },
  { value: "electricians", label: "Electricians" },
  { value: "it-support", label: "IT Support" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "general", label: "General Maintenance" },
  { value: "external-vendor", label: "External Vendor" },
]

const formSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
  specialization: z.string().min(1, "Specialization is required"),
  description: z.string().optional(),
})

interface TeamFormProps {
  onSuccess?: () => void
}

export function TeamForm({ onSuccess }: TeamFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      specialization: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create team")
      }

      form.reset()
      onSuccess?.()
      toast.success("Team created successfully")
    } catch (error) {
      console.error("Error creating team:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create team")
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
              <FormLabel>Team Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mechanical Team A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialization *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SPECIALIZATIONS.map(spec => (
                    <SelectItem key={spec.value} value={spec.value}>
                      {spec.label}
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Brief description of the team's responsibilities..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Team
        </Button>
      </form>
    </Form>
  )
}
