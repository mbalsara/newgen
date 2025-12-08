import { useState, useEffect, useCallback } from "react"
import type { Agent } from "@/lib/agent-types"
import { fetchAgents, getSquads, type Squad } from "@/lib/vapi-api"
import { PageHeader } from "@/components/page-header"
import { AgentsTable } from "@/components/agents-table"
import { AgentDrawer } from "@/components/agent-drawer"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const loadData = useCallback(async (showToast = false) => {
    try {
      const [agentsData, squadsData] = await Promise.all([
        fetchAgents(),
        getSquads()
      ])
      setAgents(agentsData)
      setSquads(squadsData)
      if (showToast) {
        toast.success("Data refreshed")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Failed to load agents")
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    loadData().finally(() => setIsLoading(false))
  }, [loadData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData(true)
    setIsRefreshing(false)
  }

  const handleAddAgent = () => {
    setSelectedAgent(null)
    setDrawerOpen(true)
  }

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setDrawerOpen(true)
  }

  const handleSaved = () => {
    loadData()
  }

  // Calculate summary stats
  const totalCalls = agents.reduce((sum, a) => sum + a.callCount, 0)
  const totalMinutes = agents.reduce((sum, a) => sum + a.totalMinutes, 0)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="AI Agents"
        subtitle={`${agents.length} agents${squads.length > 0 ? ` • ${squads.length} squads` : ''} • ${totalCalls} calls • ${Math.round(totalMinutes)} minutes`}
        backHref="/"
        rightContent={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleAddAgent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <AgentsTable
          agents={agents}
          squads={squads}
          onEdit={handleEditAgent}
          isLoading={isLoading}
        />
      </div>

      <AgentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agent={selectedAgent}
        onSaved={handleSaved}
      />
    </div>
  )
}
