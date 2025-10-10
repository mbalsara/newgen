import { ModeToggle } from "@/components/mode-toggle"

export function DashboardHeader() {
  return (
    <div className="relative">
      <div className="absolute top-0 right-0">
        <ModeToggle />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-balance text-primary">MedOffice Pro</h1>
        <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
          Streamline your patient authorization, eligibility management and more with AI Agents
        </p>
      </div>
    </div>
  )
}
