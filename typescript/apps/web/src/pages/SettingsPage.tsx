import { useState, useEffect, useCallback } from 'react'
import type { Agent } from '@/lib/agent-types'
import { fetchAgents, getSquads, type Squad } from '@/lib/vapi-api'
import { AgentsTable } from '@/components/agents-table'
import { AgentDrawer } from '@/components/agent-drawer'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, RefreshCw, Bot, Users } from 'lucide-react'
import { toast } from 'sonner'
import { aiAgents, staffMembers } from '@/lib/mock-agents'

export default function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [squads, setSquads] = useState<Squad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const loadData = useCallback(async (showToast = false) => {
    try {
      const [agentsData, squadsData] = await Promise.all([fetchAgents(), getSquads()])
      setAgents(agentsData)
      setSquads(squadsData)
      if (showToast) {
        toast.success('Data refreshed')
      }
    } catch (error) {
      console.error('Error loading data:', error)
      // Don't show error toast since API might not be configured
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Configure AI agents and staff members</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddAgent}>
            <Plus className="h-4 w-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ai-agents" className="w-full">
        <TabsList>
          <TabsTrigger value="ai-agents">
            <Bot className="h-4 w-4 mr-2" />
            AI Agents
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Staff Members
          </TabsTrigger>
          <TabsTrigger value="vapi">VAPI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="ai-agents" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {aiAgents.map(agent => (
              <Card key={agent.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
                      <span className="text-lg">{agent.avatar}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <CardDescription>{agent.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-green-600">AI Agent</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {staffMembers.map(staff => (
              <Card key={staff.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                      <span className="text-sm font-medium">{staff.avatar}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{staff.name}</CardTitle>
                      <CardDescription>{staff.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium text-amber-600">Staff</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="vapi" className="mt-4">
          <AgentsTable
            agents={agents}
            squads={squads}
            onEdit={handleEditAgent}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>

      <AgentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agent={selectedAgent}
        onSaved={handleSaved}
      />
    </div>
  )
}
