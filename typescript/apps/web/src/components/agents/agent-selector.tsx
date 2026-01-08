import { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { AgentAvatar } from './agent-avatar'
import { getFilteredAgents, getAgent } from '@/lib/mock-agents'
import type { VoiceAgent } from '@/lib/task-types'

interface AgentSelectorProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function AgentSelector({ value, onValueChange, className }: AgentSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedAgent = getAgent(value)
  const filtered = getFilteredAgents(search)

  const handleSelect = (agent: VoiceAgent) => {
    onValueChange(agent.id)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          {selectedAgent ? (
            <div className="flex items-center gap-2">
              <AgentAvatar agent={selectedAgent} size="sm" />
              <span>{selectedAgent.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select agent...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {filtered.ai.length > 0 && (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                AI Agents
              </div>
              {filtered.ai.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect(agent)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                    value === agent.id && 'bg-accent'
                  )}
                >
                  <AgentAvatar agent={agent} size="sm" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.role}</div>
                  </div>
                  {value === agent.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
          {filtered.staff.length > 0 && (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Staff Members
              </div>
              {filtered.staff.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => handleSelect(agent)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
                    value === agent.id && 'bg-accent'
                  )}
                >
                  <AgentAvatar agent={agent} size="sm" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.role}</div>
                  </div>
                  {value === agent.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
          {filtered.ai.length === 0 && filtered.staff.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No agents found
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
