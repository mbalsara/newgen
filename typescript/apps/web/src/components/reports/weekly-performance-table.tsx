import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { dashboardData, getWeeklyTotals, formatCurrency } from '@/lib/mock-reports'
import { cn } from '@/lib/utils'

export function WeeklyPerformanceTable() {
  const { weeklyTrend } = dashboardData
  const totals = getWeeklyTotals()

  // Determine which days are in the future (have 0 tasks)
  const isFutureDay = (day: typeof weeklyTrend[0]) =>
    day.ai.tasks === 0 && day.staff.tasks === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Performance by Day</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Day</TableHead>
              <TableHead
                colSpan={3}
                className="text-center bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
              >
                AI Agent
              </TableHead>
              <TableHead
                colSpan={3}
                className="text-center bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
              >
                Staff
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                Tasks
              </TableHead>
              <TableHead className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                Minutes
              </TableHead>
              <TableHead className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
                Cost
              </TableHead>
              <TableHead className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Tasks
              </TableHead>
              <TableHead className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Minutes
              </TableHead>
              <TableHead className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Cost
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeklyTrend.map(day => (
              <TableRow
                key={day.day}
                className={cn(isFutureDay(day) && 'opacity-40')}
              >
                <TableCell className="font-medium">
                  <div>{day.day}</div>
                  <div className="text-xs text-muted-foreground">{day.date}</div>
                </TableCell>
                <TableCell>{day.ai.tasks}</TableCell>
                <TableCell>{day.ai.minutes}</TableCell>
                <TableCell>{formatCurrency(day.ai.cost)}</TableCell>
                <TableCell>{day.staff.tasks}</TableCell>
                <TableCell>{day.staff.minutes}</TableCell>
                <TableCell>{formatCurrency(day.staff.cost)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-medium bg-gray-50 dark:bg-gray-900">
              <TableCell>Total</TableCell>
              <TableCell>{totals.ai.tasks}</TableCell>
              <TableCell>{totals.ai.minutes}</TableCell>
              <TableCell>{formatCurrency(totals.ai.cost)}</TableCell>
              <TableCell>{totals.staff.tasks}</TableCell>
              <TableCell>{totals.staff.minutes}</TableCell>
              <TableCell>{formatCurrency(totals.staff.cost)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
