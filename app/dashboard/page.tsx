"use client"
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Wrench, ClipboardList, AlertTriangle } from "lucide-react"
import Link from 'next/link';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const [stats, setStats] = React.useState([
    {
      title: "Total Equipment",
      value: "...",
      description: "Active machines",
      icon: Wrench,
      href: "/dashboard/equipment"
    },
    {
      title: "Open Requests",
      value: "...",
      description: "Requiring attention",
      icon: AlertTriangle,
      color: "text-red-500",
      href: "/dashboard/requests"
    },
    {
      title: "In Progress",
      value: "...",
      description: "Being repaired",
      icon: ClipboardList,
      href: "/dashboard/kanban"
    }
  ]);

  React.useEffect(() => {
    // Real-time listener for equipment count
    const unsubEquipment = onSnapshot(query(collection(db, "equipment"), where("isUsable", "==", true)), (snap) => {
      setStats(prev => {
        const newStats = [...prev];
        newStats[0].value = snap.size.toString();
        return newStats;
      });
    });

    // Real-time listener for requests
    const unsubRequests = onSnapshot(collection(db, "requests"), (snap) => {
      const newRequests = snap.docs.filter(d => d.data().status === 'NEW').length;
      const inProgressRequests = snap.docs.filter(d => d.data().status === 'IN_PROGRESS').length;

      setStats(prev => {
        const newStats = [...prev];
        newStats[1].value = newRequests.toString();
        newStats[2].value = inProgressRequests.toString();
        return newStats;
      });
    });

    return () => {
      unsubEquipment();
      unsubRequests();
    }
  }, []);

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
