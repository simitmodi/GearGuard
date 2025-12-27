export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">GearGuard</h1>
            <p className="text-sm text-muted-foreground">Maintenance Management System</p>
        </div>
        {children}
      </div>
    </div>
  )
}
