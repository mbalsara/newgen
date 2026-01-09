import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router'
import { api, type Agent } from '@/lib/api-client'
import { AgentCard } from '@/components/agents/AgentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, RefreshCw, LayoutGrid, List, Bot, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'
type StatusFilter = 'all' | 'active' | 'paused' | 'draft'

export default function AgentsSummaryPage() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  const loadAgents = useCallback(async (showToast = false) => {
    try {
      const data = await api.agents.aiAgents()
      setAgents(data)
      if (showToast) {
        toast.success('Agents refreshed')
      }
    } catch (error) {
      console.error('Error loading agents:', error)
      toast.error('Failed to load agents')
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    loadAgents().finally(() => setIsLoading(false))
  }, [loadAgents])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAgents(true)
    setIsRefreshing(false)
  }

  const handleCreateAgent = () => {
    navigate('/agents/new')
  }

  const handleEditAgent = (agent: Agent) => {
    navigate(`/agents/${agent.id}`)
  }

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.role.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (statusFilter === 'all') return true

    // Determine status
    const isActive = agent.vapiAssistantId !== null
    const isDraft = !agent.greeting && !agent.systemPrompt
    const status = isDraft ? 'draft' : isActive ? 'active' : 'paused'

    return status === statusFilter
  })

  // Stats
  const activeCount = agents.filter((a) => a.vapiAssistantId !== null).length
  // Note: callCount would come from agent data in production
  const totalCalls = 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">AI Agents</h1>
              <p className="text-sm text-muted-foreground">
                {agents.length} agents{' '}
                {activeCount > 0 && (
                  <>
                    <span className="mx-1">·</span>
                    <span className="text-green-600">{activeCount} active</span>
                  </>
                )}
                {totalCalls > 0 && (
                  <>
                    <span className="mx-1">·</span>
                    {totalCalls.toLocaleString()} calls
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
                />
                Refresh
              </Button>
              <Button onClick={handleCreateAgent}>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            {agents.length === 0 ? (
              <>
                <h3 className="text-lg font-medium mb-2">No agents yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  Create your first AI agent to start automating patient calls.
                </p>
                <Button onClick={handleCreateAgent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No matching agents</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters.
                </p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={() => handleEditAgent(agent)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-4 p-4 bg-card border rounded-lg cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => handleEditAgent(agent)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {agent.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium capitalize">
                    {agent.specialty || 'General'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {agent.type === 'ai' ? 'AI Agent' : 'Staff'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
