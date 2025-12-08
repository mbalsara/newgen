"use client"

import { useState, useMemo } from "react"
import type { Agent } from "@/lib/agent-types"
import type { Squad } from "@/lib/vapi-api"
import { AGENT_TYPE_LABELS, CALL_DIRECTION_LABELS } from "@/lib/agent-types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Pencil, Phone, PhoneIncoming, PhoneOutgoing, User, Clock, Play, Users, History } from "lucide-react"
import { Input } from "@/components/ui/input"
import { VapiCallModal } from "./vapi-call-modal"
import { CallLogsDrawer } from "./call-logs-drawer"

interface AgentsTableProps {
  agents: Agent[]
  squads?: Squad[]
  onEdit: (agent: Agent) => void
  isLoading?: boolean
}

type SortField = "name" | "agentType" | "voiceName" | "callDirection" | "callCount" | "squadName"
type SortDirection = "asc" | "desc"

export function AgentsTable({ agents, squads = [], onEdit, isLoading }: AgentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null)
  const [testingSquad, setTestingSquad] = useState<Squad | null>(null)
  const [callLogsAgent, setCallLogsAgent] = useState<Agent | null>(null)
  const [callLogsSquad, setCallLogsSquad] = useState<Squad | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleTest = (agent: Agent) => {
    setTestingAgent(agent)
  }

  const handleTestSquad = (squad: Squad) => {
    setTestingSquad(squad)
  }

  const handleViewCallLogs = (agent: Agent) => {
    setCallLogsAgent(agent)
  }

  const handleViewSquadCallLogs = (squad: Squad) => {
    setCallLogsSquad(squad)
  }

  const filteredSquads = useMemo(() => {
    if (!searchQuery) return squads
    const searchLower = searchQuery.toLowerCase()
    return squads.filter(squad => squad.name.toLowerCase().includes(searchLower))
  }, [squads, searchQuery])

  const filteredAndSortedAgents = useMemo(() => {
    const filtered = agents.filter((agent) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        agent.name.toLowerCase().includes(searchLower) ||
        agent.agentType.toLowerCase().includes(searchLower) ||
        agent.voiceName.toLowerCase().includes(searchLower) ||
        (agent.squadName?.toLowerCase().includes(searchLower) ?? false)
      )
    })

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "agentType":
          comparison = a.agentType.localeCompare(b.agentType)
          break
        case "voiceName":
          comparison = a.voiceName.localeCompare(b.voiceName)
          break
        case "callDirection":
          comparison = a.callDirection.localeCompare(b.callDirection)
          break
        case "callCount":
          comparison = a.callCount - b.callCount
          break
        case "squadName":
          comparison = (a.squadName || '').localeCompare(b.squadName || '')
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [agents, searchQuery, sortField, sortDirection])

  const formatMinutes = (minutes: number) => {
    if (minutes < 1) return "< 1 min"
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading agents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredAndSortedAgents.length} agent{filteredAndSortedAgents.length !== 1 ? 's' : ''}
          {squads.length > 0 && `, ${filteredSquads.length} squad${filteredSquads.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {/* Squads Section */}
      {filteredSquads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Squads
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredSquads.map((squad) => (
              <div
                key={squad.id}
                className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{squad.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {squad.id.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{squad.members?.length || 0} members</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSquadCallLogs(squad)}
                      title="View call logs"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestSquad(squad)}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-4 w-4" />
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents Section */}
      {filteredSquads.length > 0 && (
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mt-4">
          <User className="h-4 w-4" />
          Agents
        </h3>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("name")} className="h-8 px-2">
                  Name
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("agentType")} className="h-8 px-2">
                  Type
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("voiceName")} className="h-8 px-2">
                  Voice
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("callDirection")} className="h-8 px-2">
                  Direction
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("squadName")} className="h-8 px-2">
                  Squad
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" onClick={() => handleSort("callCount")} className="h-8 px-2">
                  Calls
                  <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedAgents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{agent.id.slice(0, 8)}...</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {AGENT_TYPE_LABELS[agent.agentType]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className={`h-4 w-4 ${agent.voiceGender === 'female' ? 'text-pink-500' : 'text-blue-500'}`} />
                      <div>
                        <div className="font-medium">{agent.voiceName}</div>
                        <div className="text-xs text-muted-foreground capitalize">{agent.voiceGender}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {agent.callDirection === 'inbound' ? (
                        <PhoneIncoming className="h-4 w-4 text-green-500" />
                      ) : (
                        <PhoneOutgoing className="h-4 w-4 text-orange-500" />
                      )}
                      <span>{CALL_DIRECTION_LABELS[agent.callDirection]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {agent.squadName ? (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-violet-500" />
                        <span className="text-sm">{agent.squadName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{agent.callCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-sm">{formatMinutes(agent.totalMinutes)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCallLogs(agent)}
                        title="View call logs"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(agent)}
                        title="Test agent"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(agent)}
                        title="Edit agent"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Test Call Modal for Agents */}
      <VapiCallModal
        open={!!testingAgent}
        onOpenChange={(open) => !open && setTestingAgent(null)}
        assistantId={testingAgent?.id}
        name={testingAgent?.name || ''}
      />

      {/* Test Call Modal for Squads */}
      <VapiCallModal
        open={!!testingSquad}
        onOpenChange={(open) => !open && setTestingSquad(null)}
        squadId={testingSquad?.id}
        name={testingSquad?.name || ''}
      />

      {/* Call Logs Drawer for Agents */}
      <CallLogsDrawer
        open={!!callLogsAgent}
        onOpenChange={(open) => !open && setCallLogsAgent(null)}
        assistantId={callLogsAgent?.id}
        name={callLogsAgent?.name || ''}
      />

      {/* Call Logs Drawer for Squads */}
      <CallLogsDrawer
        open={!!callLogsSquad}
        onOpenChange={(open) => !open && setCallLogsSquad(null)}
        squadId={callLogsSquad?.id}
        name={callLogsSquad?.name || ''}
      />
    </div>
  )
}
