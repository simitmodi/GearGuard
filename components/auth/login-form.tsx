"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getUserProfile } from "@/lib/db/users"
import { UserRole } from "@/lib/types"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedRole, setSelectedRole] = React.useState<UserRole>("USER")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setError(null)
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password)
      const user = userCredential.user

      const profile = await getUserProfile(user.uid)

      if (!profile) {
        // Fallback for users without profile (legacy or direct signup)
        // If we are strict, we should fail or auto-create.
        // For now, let's assume if no profile, they are USER.
        if (selectedRole !== "USER") {
          throw new Error("No profile found. Please login as User.")
        }
        // Ideally create profile here if missing?
      } else {
        if (profile.role !== selectedRole) {
          await auth.signOut()
          throw new Error(`Unauthorized. You are not registered as a ${selectedRole.toLowerCase()}.`)
        }
      }

      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to login")
      // Ensure we are signed out if validation failed after login
      if (auth.currentUser) {
        await auth.signOut()
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Select your role to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="USER" onValueChange={(v: string) => setSelectedRole(v as UserRole)} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="USER">User</TabsTrigger>
            <TabsTrigger value="TECHNICIAN">Technician</TabsTrigger>
            <TabsTrigger value="MANAGER">Manager</TabsTrigger>
          </TabsList>
        </Tabs>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@gearguard.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login as {selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
