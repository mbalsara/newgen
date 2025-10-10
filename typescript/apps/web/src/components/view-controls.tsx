import { Input } from "@/components/ui/input"
import { ProviderFilter } from "./provider-filter"

interface ViewControlsProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  providers: string[]
  selectedProviders: string[]
  onProviderSelectionChange: (providers: string[]) => void
  filteredCount: number
  totalCount: number
  viewToggle?: React.ReactNode
}

export function ViewControls({
  searchQuery,
  onSearchChange,
  providers,
  selectedProviders,
  onProviderSelectionChange,
  filteredCount,
  totalCount,
  viewToggle,
}: ViewControlsProps) {
  return (
    <div className="flex items-center gap-4 justify-between">
      <div className="flex items-center gap-4 flex-1">
        <ProviderFilter
          providers={providers}
          selectedProviders={selectedProviders}
          onSelectionChange={onProviderSelectionChange}
        />
        <Input
          placeholder="Search patients, providers, insurance, reason..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {filteredCount} of {totalCount} appointments
        </span>
      </div>
      {viewToggle && <div>{viewToggle}</div>}
    </div>
  )
}
