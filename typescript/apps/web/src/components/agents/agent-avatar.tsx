import { cn } from '@/lib/utils'

// Agent type that works with both API Agent and local types
interface AgentLike {
  type: 'ai' | 'staff'
  avatar?: string | null
  name?: string
}

interface AgentAvatarProps {
  agent: AgentLike | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
}

export function AgentAvatar({ agent, size = 'md', className }: AgentAvatarProps) {
  if (!agent) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-200 text-gray-500',
          sizeClasses[size],
          className
        )}
      >
        ?
      </div>
    )
  }

  // For AI agents, show robot emoji or avatar
  if (agent.type === 'ai') {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
          sizeClasses[size],
          className
        )}
      >
        {agent.avatar || '🤖'}
      </div>
    )
  }

  // For staff, show initials or avatar
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-amber-100 text-amber-700 font-medium dark:bg-amber-900 dark:text-amber-100',
        sizeClasses[size],
        className
      )}
    >
      {agent.avatar || (agent.name ? agent.name.charAt(0) : '?')}
    </div>
  )
}
