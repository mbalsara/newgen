import { useTasks } from '@/contexts/tasks-context'
import { QueueColumn } from './queue-column'

export function QueueBoard() {
  const { getQueueData } = useTasks()
  const queue = getQueueData()

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
      <QueueColumn title="Scheduled" tasks={queue.scheduled} color="blue" />
      <QueueColumn title="In Progress" tasks={queue.inProgress} color="amber" />
      <QueueColumn title="Needs Attention" tasks={queue.needsAttention} color="red" />
      <QueueColumn title="Completed" tasks={queue.completed} color="green" />
    </div>
  )
}
