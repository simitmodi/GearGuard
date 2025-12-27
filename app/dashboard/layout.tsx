"use client"

import { AppSidebar } from "@/components/app-sidebar"
import ProtectedRoute from "@/components/auth/protected-route"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
    const pathname = usePathname()
    // Simple breadcrumb logic
    const pathSegments = pathname.split('/').filter(Boolean)
    const currentPage = pathSegments[pathSegments.length - 1] || "Dashboard"
    const capitalizedPage = currentPage.charAt(0).toUpperCase() + currentPage.slice(1)

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.length > 1 && (
                     <>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                        <BreadcrumbPage>{capitalizedPage}</BreadcrumbPage>
                        </BreadcrumbItem>
                     </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
             {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
