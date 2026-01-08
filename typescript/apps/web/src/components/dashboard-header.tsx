import { ModeToggle } from "@/components/mode-toggle"

export function DashboardHeader() {
  return (
    <div className="relative">
      <div className="absolute top-0 right-0">
        <ModeToggle />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-balance text-primary">VagusX</h1>
        <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
          AI Voice Task Management for Physician Offices
        </p>
      </div>
    </div>
  )
}
