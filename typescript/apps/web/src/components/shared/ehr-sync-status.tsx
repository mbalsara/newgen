import { cn } from '@/lib/utils'
import { Check, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { EhrSync } from '@/lib/task-types'

interface EhrSyncStatusProps {
  sync: EhrSync
  isSyncing?: boolean
  onClick?: () => void
  variant?: 'icon' | 'badge'
  className?: string
}

export function EhrSyncStatus({
  sync,
  isSyncing,
  onClick,
  variant = 'icon',
  className,
}: EhrSyncStatusProps) {
  const status = isSyncing ? 'syncing' : sync.status

  if (variant === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClick}
              disabled={status === 'synced' || status === 'syncing'}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
                status === 'synced' &&
                  'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100',
                status === 'pending' &&
                  'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer dark:bg-orange-900 dark:text-orange-100',
                status === 'failed' &&
                  'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer dark:bg-red-900 dark:text-red-100',
                status === 'syncing' &&
                  'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100',
                className
              )}
            >
              {status === 'synced' && <Check className="h-3 w-3" />}
              {status === 'pending' && <RefreshCw className="h-3 w-3" />}
              {status === 'failed' && <AlertCircle className="h-3 w-3" />}
              {status === 'syncing' && <Loader2 className="h-3 w-3 animate-spin" />}
              <span className="capitalize">{status === 'syncing' ? 'Syncing...' : status}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {status === 'synced' && sync.lastSync && <p>Last synced: {sync.lastSync}</p>}
            {status === 'pending' && <p>Click to sync to EHR</p>}
            {status === 'failed' && <p>{sync.error || 'Sync failed. Click to retry.'}</p>}
            {status === 'syncing' && <p>Syncing to EHR...</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Icon variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={status === 'synced' || status === 'syncing'}
            className={cn(
              'inline-flex items-center justify-center h-5 w-5 rounded transition-colors',
              status === 'synced' && 'text-green-600',
              status === 'pending' && 'text-orange-500 hover:text-orange-600 cursor-pointer',
              status === 'failed' && 'text-red-500 hover:text-red-600 cursor-pointer',
              status === 'syncing' && 'text-blue-500',
              className
            )}
          >
            {status === 'synced' && <Check className="h-4 w-4" />}
            {status === 'pending' && <RefreshCw className="h-4 w-4" />}
            {status === 'failed' && <AlertCircle className="h-4 w-4" />}
            {status === 'syncing' && <Loader2 className="h-4 w-4 animate-spin" />}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {status === 'synced' && sync.lastSync && <p>Synced: {sync.lastSync}</p>}
          {status === 'pending' && <p>Pending EHR sync</p>}
          {status === 'failed' && <p>{sync.error || 'Sync failed'}</p>}
          {status === 'syncing' && <p>Syncing...</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
