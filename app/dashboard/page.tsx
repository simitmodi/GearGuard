"use client"
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Wrench, ClipboardList, AlertTriangle } from "lucide-react"
import Link from 'next/link';

export default function DashboardPage() {
  // Real data fetching would go here. For now, using the same structure but styled.
  // We'll hydrate with some real data hooks later or keep mock for stats that don't exist yet (Utilization).
  
  const stats = [
    {
      title: "Critical Equipment",
      value: "5 Units",
      subtext: "Health < 30%",
      className: "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900",
      textClass: "text-red-600 dark:text-red-400",
      href: "/dashboard/equipment"
    },
    {
      title: "Technician Load",
      value: "85% Utilized",
      subtext: "Assign Carefully",
      className: "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900",
      textClass: "text-blue-600 dark:text-blue-400",
      href: "/dashboard/kanban"
    },
    {
      title: "Open Requests",
      value: "12 Pending",
      subtext: "3 Overdue",
      className: "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900",
      textClass: "text-green-600 dark:text-green-400",
      href: "/dashboard/requests"
    }
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="flex items-center justify-between">
           <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        </div>

      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className={`transition-all hover:scale-105 cursor-pointer border-2 ${stat.className}`}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium ${stat.textClass}`}>
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.textClass}`}>{stat.value}</div>
                <p className={`text-xs ${stat.textClass} opacity-80 font-semibold`}>
                  {stat.subtext}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-0">
             <h3 className="text-lg font-semibold">Recent Maintenance Activity</h3>
             <p className="text-sm text-muted-foreground mb-4">Latest requests and updates across the system.</p>
        </div>
        <div className="p-0">
             {/* We can re-use the Request Table logic here later, for now a static list to match style */}
             <div className="w-full overflow-auto">
                <table className="w-full caption-bottom text-sm border-t">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Subject</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Employee</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Technician</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Stage</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle font-medium">Preventive Check - CNC 01</td>
                            <td className="p-4 align-middle">Mitchell Admin</td>
                            <td className="p-4 align-middle">Marc Demo</td>
                            <td className="p-4 align-middle">Robotics</td>
                            <td className="p-4 align-middle"><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">In Progress</span></td>
                        </tr>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">Conveyor Belt Noise</td>
                            <td className="p-4 align-middle">Joel Willis</td>
                            <td className="p-4 align-middle">Unassigned</td>
                            <td className="p-4 align-middle">Electronics</td>
                             <td className="p-4 align-middle"><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">New Request</span></td>
                        </tr>
                         <tr className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">Hydraulic Leak</td>
                            <td className="p-4 align-middle">Admin</td>
                            <td className="p-4 align-middle">Marc Demo</td>
                            <td className="p-4 align-middle">Hydraulics</td>
                             <td className="p-4 align-middle"><span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">Repaired</span></td>
                        </tr>
                    </tbody>
                </table>
             </div>
        </div>
      </div>
    </div>
  )
}
