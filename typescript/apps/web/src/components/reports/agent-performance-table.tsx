import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgentBadge } from '@/components/agents/agent-badge'
import { dashboardData } from '@/lib/mock-reports'
import { cn } from '@/lib/utils'

export function AgentPerformanceTable() {
  const { agentPerformance } = dashboardData

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 dark:text-green-400'
    if (rate >= 90) return 'text-blue-600 dark:text-blue-400'
    if (rate >= 85) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agent Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
              <TableHead className="text-right">Avg Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agentPerformance.map(agent => (
              <TableRow key={agent.name}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm',
                        agent.type === 'ai'
                          ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100'
                      )}
                    >
                      {agent.type === 'ai' ? '🤖' : agent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{agent.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <AgentBadge type={agent.type} />
                </TableCell>
                <TableCell className="text-right">{agent.tasks}</TableCell>
                <TableCell className={cn('text-right font-medium', getSuccessRateColor(agent.successRate))}>
                  {agent.successRate}%
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {agent.avgDuration}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
