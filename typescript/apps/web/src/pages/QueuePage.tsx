import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, User, Bot, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTasks } from '@/contexts/tasks-context'
import { useCurrentUser } from '@/contexts/user-context'
import { getAgent } from '@/lib/mock-agents'
import type { Task } from '@/lib/task-types'
import { cn } from '@/lib/utils'

export default function QueuePage() {
  const navigate = useNavigate()
  const { currentUser } = useCurrentUser()
  const { tasks, isPatientFlagged, setFilters } = useTasks()

  // Calculate stats
  const myTasks = tasks.filter(t => t.assignedAgent === currentUser.id)
  const needsAttention = tasks.filter(t => t.status === 'escalated' || t.status === 'pending')
  const aiActiveTasks = tasks.filter(t => {
    const agent = getAgent(t.assignedAgent)
    return agent?.type === 'ai' && t.status !== 'completed'
  })
  const completedToday = tasks.filter(t => t.status === 'completed')

  // My escalated tasks
  const myEscalatedTasks = tasks.filter(t => t.assignedAgent === currentUser.id && t.status === 'escalated')

  // Flagged patients in my tasks
  const myFlaggedTasks = myTasks.filter(t => isPatientFlagged(t.patient.id))

  // Group tasks for kanban (excluding completed)
  const scheduled = tasks.filter(t => t.status === 'scheduled').slice(0, 4)
  const inProgress = tasks.filter(t => t.status === 'in-progress').slice(0, 4)
  const needsAttentionTasks = needsAttention.slice(0, 4)

  const scheduledTotal = tasks.filter(t => t.status === 'scheduled').length
  const inProgressTotal = tasks.filter(t => t.status === 'in-progress').length
  const needsAttentionTotal = needsAttention.length

  const handleTaskClick = (taskId: number) => {
    navigate('/tasks', { state: { taskId } })
  }

  const handleViewAll = (status: string) => {
    if (status === 'needs-attention') {
      setFilters({ statuses: ['escalated', 'pending'], agent: 'all' })
    } else if (status === 'scheduled') {
      setFilters({ statuses: ['scheduled'], agent: 'all' })
    } else if (status === 'in-progress') {
      setFilters({ statuses: ['in-progress'], agent: 'all' })
    }
    navigate('/tasks')
  }

  const handleMyTasksClick = () => {
    setFilters({ statuses: [], agent: 'me' })
    navigate('/tasks')
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Welcome back, {currentUser.name}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="My Tasks"
            value={myTasks.length}
            icon={User}
            color="violet"
            onClick={handleMyTasksClick}
          />
          <StatsCard
            title="Needs Attention"
            value={needsAttention.length}
            icon={AlertTriangle}
            color="red"
            onClick={() => handleViewAll('needs-attention')}
          />
          <StatsCard
            title="AI Active"
            value={aiActiveTasks.length}
            icon={Bot}
            color="gray"
          />
          <StatsCard
            title="Completed Today"
            value={completedToday.length}
            icon={CheckCircle}
            color="green"
          />
        </div>

        {/* Alerts Section */}
        {(myEscalatedTasks.length > 0 || myFlaggedTasks.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {myEscalatedTasks.length > 0 && (
              <button
                onClick={handleMyTasksClick}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm text-amber-800">
                  <span className="font-medium">{myEscalatedTasks.length} task{myEscalatedTasks.length > 1 ? 's' : ''}</span> escalated to you
                </span>
              </button>
            )}
            {myFlaggedTasks.length > 0 && (
              <button
                onClick={handleMyTasksClick}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-800">
                  <span className="font-medium">{myFlaggedTasks.length} flagged patient{myFlaggedTasks.length > 1 ? 's' : ''}</span> in your queue
                </span>
              </button>
            )}
          </div>
        )}

        {/* Compact Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CompactColumn
            title="Scheduled"
            tasks={scheduled}
            totalCount={scheduledTotal}
            color="blue"
            isPatientFlagged={isPatientFlagged}
            onTaskClick={handleTaskClick}
            onViewAll={() => handleViewAll('scheduled')}
          />
          <CompactColumn
            title="In Progress"
            tasks={inProgress}
            totalCount={inProgressTotal}
            color="amber"
            isPatientFlagged={isPatientFlagged}
            onTaskClick={handleTaskClick}
            onViewAll={() => handleViewAll('in-progress')}
          />
          <CompactColumn
            title="Needs Attention"
            tasks={needsAttentionTasks}
            totalCount={needsAttentionTotal}
            color="red"
            isPatientFlagged={isPatientFlagged}
            onTaskClick={handleTaskClick}
            onViewAll={() => handleViewAll('needs-attention')}
          />
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: 'violet' | 'red' | 'gray' | 'green'
  onClick?: () => void
}) {
  const colorClasses = {
    violet: {
      bg: 'bg-violet-50',
      icon: 'text-violet-600',
      value: 'text-violet-700',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      value: 'text-red-700',
    },
    gray: {
      bg: 'bg-gray-100',
      icon: 'text-gray-600',
      value: 'text-gray-700',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      value: 'text-green-700',
    },
  }

  const colors = colorClasses[color]
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-5 text-left',
        onClick && 'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-4 h-4', colors.icon)} />
        </div>
      </div>
      <div className={cn('text-3xl font-bold', colors.value)}>{value}</div>
      {onClick && (
        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </Component>
  )
}

// Compact Column Component
function CompactColumn({
  title,
  tasks,
  totalCount,
  color,
  isPatientFlagged,
  onTaskClick,
  onViewAll,
}: {
  title: string
  tasks: Task[]
  totalCount: number
  color: 'blue' | 'amber' | 'red'
  isPatientFlagged: (id: string) => boolean
  onTaskClick: (taskId: number) => void
  onViewAll: () => void
}) {
  const colorClasses = {
    blue: {
      dot: 'bg-blue-500',
      headerBg: 'bg-blue-50',
      badge: 'bg-blue-100 text-blue-700',
    },
    amber: {
      dot: 'bg-amber-500',
      headerBg: 'bg-amber-50',
      badge: 'bg-amber-100 text-amber-700',
    },
    red: {
      dot: 'bg-red-500',
      headerBg: 'bg-red-50',
      badge: 'bg-red-100 text-red-700',
    },
  }

  const colors = colorClasses[color]
  const remainingCount = totalCount - tasks.length

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Column Header */}
      <button
        onClick={onViewAll}
        className={cn('w-full flex items-center gap-2 px-4 py-3 hover:opacity-80 transition-opacity', colors.headerBg)}
      >
        <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
        <span className="font-medium text-sm text-gray-900">{title}</span>
        <Badge className={cn('ml-auto text-xs font-medium', colors.badge)}>
          {totalCount}
        </Badge>
      </button>

      {/* Cards */}
      <div className="p-3 space-y-2">
        {tasks.map(task => (
          <CompactCard
            key={task.id}
            task={task}
            flagged={isPatientFlagged(task.patient.id)}
            onClick={() => onTaskClick(task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-6">No tasks</div>
        )}
        {remainingCount > 0 && (
          <button
            onClick={onViewAll}
            className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    </div>
  )
}

// Compact Card Component
function CompactCard({
  task,
  flagged,
  onClick,
}: {
  task: Task
  flagged: boolean
  onClick: () => void
}) {
  const agent = getAgent(task.assignedAgent)

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-gray-50 border border-gray-100 rounded-lg p-3 hover:bg-gray-100 hover:border-gray-200 transition-all',
        flagged && 'border-l-2 border-l-red-500'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm text-gray-900 truncate flex-1">{task.patient.name}</span>
        {flagged && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
        {task.unread && (
          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white hover:bg-blue-500 shrink-0">
            NEW
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        {agent && (
          <div className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-medium',
            agent.type === 'ai' ? 'bg-gray-900 text-white' : 'bg-amber-100 text-amber-700'
          )}>
            {agent.type === 'ai' ? '🤖' : agent.avatar?.charAt(0)}
          </div>
        )}
        <span className="text-xs text-gray-500 truncate flex-1">{task.description}</span>
        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
        <span className="text-xs text-gray-400">{task.time}</span>
      </div>
    </button>
  )
}
