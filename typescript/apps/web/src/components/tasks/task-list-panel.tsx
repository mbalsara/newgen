import { useState } from 'react'
import { Search, Filter, RefreshCw, X, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { TaskCard } from './task-card'
import { useTasks } from '@/contexts/tasks-context'
import { statusOptions, aiAgents, staffMembers, getAgent } from '@/lib/mock-agents'
import { formatCurrency } from '@/lib/mock-reports'
import type { TaskStatus } from '@/lib/task-types'
import { cn } from '@/lib/utils'
import { StatusDot } from '@/components/shared/status-dot'
import { AgentAvatar } from '@/components/agents/agent-avatar'

export function TaskListPanel() {
  const {
    filters,
    setFilters,
    clearFilters,
    getFilteredTasks,
    getActiveFilterCount,
    selectedTaskId,
    selectTask,
    refresh,
    refreshing,
    getStats,
  } = useTasks()

  const [agentSearch, setAgentSearch] = useState('')

  const filteredTasks = getFilteredTasks()
  const activeFilterCount = getActiveFilterCount()
  const stats = getStats()

  const filteredAiAgents = aiAgents.filter(
    a =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase())
  )
  const filteredStaffMembers = staffMembers.filter(
    a =>
      a.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.role.toLowerCase().includes(agentSearch.toLowerCase())
  )

  const getActiveFilterPills = () => {
    const pills: { key: string; label: string }[] = []
    if (filters.status !== 'all') {
      const status = statusOptions.find(s => s.id === filters.status)
      pills.push({ key: 'status', label: status?.label || filters.status })
    }
    if (filters.agent !== 'all') {
      const agent = getAgent(filters.agent)
      pills.push({ key: 'agent', label: agent?.name || filters.agent })
    }
    return pills
  }

  const pills = getActiveFilterPills()

  return (
    <div className="w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-950">
      {/* Header with search and actions */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={filters.search}
              onChange={e => setFilters({ search: e.target.value })}
              className="pl-9 h-9 bg-gray-100 dark:bg-gray-900 border-0"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 relative">
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Status</span>
                  <ChevronRight className="ml-auto h-4 w-4" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-40">
                  {statusOptions.map(option => (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() =>
                        setFilters({ status: option.id as TaskStatus | 'all' })
                      }
                      className={cn(
                        filters.status === option.id && 'bg-accent'
                      )}
                    >
                      {option.id !== 'all' && (
                        <StatusDot status={option.id as TaskStatus} className="mr-2" />
                      )}
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span>Agent</span>
                  <ChevronRight className="ml-auto h-4 w-4" />
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56">
                  <div className="p-2">
                    <Input
                      placeholder="Search agents..."
                      value={agentSearch}
                      onChange={e => setAgentSearch(e.target.value)}
                      className="h-7 text-sm"
                    />
                  </div>
                  <DropdownMenuItem
                    onClick={() => setFilters({ agent: 'all' })}
                    className={cn(filters.agent === 'all' && 'bg-accent')}
                  >
                    All Agents
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {filteredAiAgents.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        AI Agents
                      </div>
                      {filteredAiAgents.map(agent => (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => setFilters({ agent: agent.id })}
                          className={cn(filters.agent === agent.id && 'bg-accent')}
                        >
                          <AgentAvatar agent={agent} size="sm" className="mr-2" />
                          {agent.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                  {filteredStaffMembers.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1 text-xs text-muted-foreground">
                        Staff
                      </div>
                      {filteredStaffMembers.map(agent => (
                        <DropdownMenuItem
                          key={agent.id}
                          onClick={() => setFilters({ agent: agent.id })}
                          className={cn(filters.agent === agent.id && 'bg-accent')}
                        >
                          <AgentAvatar agent={agent} size="sm" className="mr-2" />
                          {agent.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters} className="text-red-600">
                    Clear all filters
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter pills */}
        {pills.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-2">
            {pills.map(pill => (
              <Badge
                key={pill.key}
                variant="secondary"
                className="text-xs gap-1 pr-1"
              >
                {pill.label}
                <button
                  onClick={() =>
                    setFilters({
                      [pill.key]: 'all',
                    })
                  }
                  className="hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1">
        {filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            isSelected={task.id === selectedTaskId}
            onClick={() => selectTask(task.id)}
          />
        ))}
        {filteredTasks.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No tasks found
          </div>
        )}
      </ScrollArea>

      {/* Stats bar */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{stats.aiRate}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">AI Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.moneySaved)}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Saved</div>
          </div>
        </div>
      </div>
    </div>
  )
}
