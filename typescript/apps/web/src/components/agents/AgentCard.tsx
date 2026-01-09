import { Bot, Phone, Clock, MoreVertical, Play, Pause, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Agent } from '@/lib/api-client'

interface AgentCardProps {
  agent: Agent
  onClick: () => void
  onTestCall?: () => void
  onToggleStatus?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}

export function AgentCard({
  agent,
  onClick,
  onTestCall,
  onToggleStatus,
  onDuplicate,
  onDelete,
}: AgentCardProps) {
  // Determine status - we'll use a simple heuristic based on agent data
  const isActive = agent.vapiAssistantId !== null
  const isDraft = !agent.greeting && !agent.systemPrompt

  const status = isDraft ? 'draft' : isActive ? 'active' : 'paused'
  const statusConfig = {
    active: {
      label: 'Active',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-500/10',
    },
    paused: {
      label: 'Paused',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
    },
    draft: {
      label: 'Draft',
      color: 'bg-gray-400',
      textColor: 'text-gray-500',
      bgColor: 'bg-gray-50 dark:bg-gray-500/10',
    },
  }

  const config = statusConfig[status]

  // Mock stats for now - these would come from agent data in production
  const callsThisWeek = Math.floor(Math.random() * 300)
  const avgDuration = '4:32'

  return (
    <div
      className={cn(
        'group relative bg-card border rounded-xl p-5 cursor-pointer transition-all duration-200',
        'hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      {/* Header with avatar and menu */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{agent.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{agent.role}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onClick}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Settings
            </DropdownMenuItem>
            {onTestCall && (
              <DropdownMenuItem onClick={onTestCall}>
                <Phone className="h-4 w-4 mr-2" />
                Test Call
              </DropdownMenuItem>
            )}
            {onToggleStatus && (
              <DropdownMenuItem onClick={onToggleStatus}>
                {isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Agent
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate Agent
                  </>
                )}
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDuplicate}>
                  Duplicate
                </DropdownMenuItem>
              </>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status badge */}
      <div className="mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            config.bgColor,
            config.textColor
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', config.color)} />
          {config.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{callsThisWeek}</p>
            <p className="text-xs text-muted-foreground">calls/week</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{avgDuration}</p>
            <p className="text-xs text-muted-foreground">avg duration</p>
          </div>
        </div>
      </div>

      {/* Specialty badge */}
      {agent.specialty && agent.specialty !== 'general' && (
        <div className="mt-3 pt-3 border-t">
          <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
            {agent.specialty}
          </span>
        </div>
      )}
    </div>
  )
}
