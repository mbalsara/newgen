import { useState, useEffect, useCallback } from 'react'
import { api, type Agent } from '@/lib/api-client'
import { AgentConfigDrawer } from '@/components/agents/agent-config-drawer'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, RefreshCw, Bot, Users, Settings } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  // Local agents (from our database)
  const [localAgents, setLocalAgents] = useState<{ ai: Agent[]; staff: Agent[] }>({ ai: [], staff: [] })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Config drawer for local agents
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  const loadData = useCallback(async (showToast = false) => {
    try {
      const localData = await api.agents.grouped().catch(() => ({ ai: [], staff: [] }))
      setLocalAgents(localData)
      if (showToast) {
        toast.success('Data refreshed')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData(true)
    setIsRefreshing(false)
  }

  const handleAddAgent = () => {
    setSelectedAgent(null)
    setConfigDrawerOpen(true)
  }

  const handleConfigureAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setConfigDrawerOpen(true)
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
        </TabsList>

        <TabsContent value="ai-agents" className="space-y-4 mt-4">
          {localAgents.ai.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No AI agents configured yet.</p>
              <Button className="mt-4" onClick={handleAddAgent}>
                <Plus className="h-4 w-4 mr-2" />
                Add AI Agent
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {localAgents.ai.map(agent => (
                <Card
                  key={agent.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleConfigureAgent(agent)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
                        <span className="text-lg">{agent.avatar || '🤖'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription className="truncate">{agent.role}</CardDescription>
                      </div>
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium text-green-600">AI Agent</span>
                    </div>
                    {agent.specialty && agent.specialty !== 'general' && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Specialty</span>
                        <span className="font-medium capitalize">{agent.specialty}</span>
                      </div>
                    )}
                    {agent.voiceId && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">Voice</span>
                        <span className="font-medium text-blue-600">Configured</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4 mt-4">
          {localAgents.staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff members configured yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {localAgents.staff.map(staff => (
                <Card key={staff.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                        <span className="text-sm font-medium">{staff.avatar || staff.name.slice(0, 2).toUpperCase()}</span>
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
          )}
        </TabsContent>
      </Tabs>

      {/* Agent Config Drawer */}
      <AgentConfigDrawer
        open={configDrawerOpen}
        onOpenChange={setConfigDrawerOpen}
        agent={selectedAgent}
        onSaved={handleSaved}
      />
    </div>
  )
}
