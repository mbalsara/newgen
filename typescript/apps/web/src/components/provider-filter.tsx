"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, Users } from "lucide-react"

interface ProviderFilterProps {
  providers: string[]
  selectedProviders: string[]
  onSelectionChange: (selected: string[]) => void
}

export function ProviderFilter({ providers, selectedProviders, onSelectionChange }: ProviderFilterProps) {
  const [open, setOpen] = useState(false)

  const handleToggle = (provider: string) => {
    if (selectedProviders.includes(provider)) {
      onSelectionChange(selectedProviders.filter((p) => p !== provider))
    } else {
      onSelectionChange([...selectedProviders, provider])
    }
  }

  const handleSelectAll = () => {
    if (selectedProviders.length === providers.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(providers)
    }
  }

  const allSelected = selectedProviders.length === providers.length
  const someSelected = selectedProviders.length > 0 && selectedProviders.length < providers.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Users className="h-4 w-4" />
          Providers
          {selectedProviders.length > 0 && selectedProviders.length < providers.length && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {selectedProviders.length}
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              {allSelected ? "Deselect All" : "Select All"}
            </label>
          </div>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox
                  id={provider}
                  checked={selectedProviders.includes(provider)}
                  onCheckedChange={() => handleToggle(provider)}
                />
                <label htmlFor={provider} className="text-sm cursor-pointer flex-1">
                  {provider}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
