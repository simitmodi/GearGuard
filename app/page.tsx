import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center font-bold text-xl" href="#">
          <Wrench className="h-6 w-6 mr-2 text-primary" />
          GearGuard
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            Login
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4 pointer-events-none opacity-50" href="#">
            Pricing
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Unbreakable Maintenance Workflow
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Track equipment, manage requests, and optimize your maintenance team with GearGuard. The comprehensive solution for modern facilities.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                    <Button size="lg" className="px-8">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
                <Link href="/signup">
                    <Button variant="outline" size="lg">
                    Sign Up
                    </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Asset Tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Keep a digital inventory of all your machinery and tools with detailed specs and history.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Preventive Maintenance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Schedule recurring checks and prevent breakdowns before they happen.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Team Kanban</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visualize workflow and assign tasks to technicians using an intuitive drag-and-drop board.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2025 GearGuard. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
