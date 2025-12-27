"use client"

import React, { useEffect, useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Team } from "@/lib/types"
import { createTeam, getTeams } from "@/lib/db/teams"
import { toast } from "sonner"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [name, setName] = useState("")
    const [company, setCompany] = useState("My Company (San Francisco)")
    const [members, setMembers] = useState("")

    useEffect(() => {
        // Real-time listener
        const q = query(collection(db, "teams"), orderBy("createdAt", "desc"))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team))
            setTeams(items)
            setIsLoading(false)
        }, (error) => {
            console.error("Error fetching teams:", error)
            toast.error("Failed to load teams")
            setIsLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsSubmitting(true)
        const memberList = members.split(',').map(m => m.trim()).filter(Boolean)

        const result = await createTeam({
            name,
            company,
            members: memberList
        })

        if (result.success) {
            toast.success("Team created successfully")
            setIsDialogOpen(false)
            // Reset form
            setName("")
            setMembers("")
            setCompany("My Company (San Francisco)")
        } else {
            toast.error("Failed to create team")
        }
        setIsSubmitting(false)
    }

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Team</DialogTitle>
                            <DialogDescription>
                                Add a new maintenance team to your organization.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateTeam} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input 
                                    id="name" 
                                    placeholder="e.g. Internal Maintenance" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="members">Team Members</Label>
                                <Input 
                                    id="members" 
                                    placeholder="Comma separated names (e.g. John Doe, Jane Smith)" 
                                    value={members}
                                    onChange={(e) => setMembers(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input 
                                    id="company" 
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Team
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="overflow-hidden">
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Team Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Team Members</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Company</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-muted-foreground">Loading teams...</td>
                                </tr>
                            ) : teams.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                        No teams found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                teams.map((team) => (
                                    <tr key={team.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{team.name}</td>
                                        <td className="p-4 align-middle">
                                            {team.members && team.members.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {team.members.map((member, idx) => (
                                                        <span key={idx} className="text-sm">{member}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">No members</span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle text-muted-foreground">{team.company}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}

