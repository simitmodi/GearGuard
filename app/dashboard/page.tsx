"use client"
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Wrench, ClipboardList, AlertTriangle } from "lucide-react"
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data for now, eventually fetch from Firestore
  const stats = [
    {
      title: "Total Equipment",
      value: "12",
      description: "Active machines",
      icon: Wrench,
      href: "/dashboard/equipment"
    },
    {
      title: "Open Requests",
      value: "5",
      description: "Requiring attention",
      icon: AlertTriangle,
      color: "text-red-500",
      href: "/dashboard/requests"
    },
    {
      title: "In Progress",
      value: "3",
      description: "Being repaired",
      icon: ClipboardList,
      href: "/dashboard/kanban"
    }
  ]

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
            <Link key={index} href={stat.href}>
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color || ''}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
          </Link>
        ))}
      </div>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
    </div>
  )
}
