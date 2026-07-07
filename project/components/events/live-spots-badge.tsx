'use client'

import { cn } from '@/lib/utils'

interface LiveSpotsBadgeProps {
  spots: number | null
  className?: string
}

export function LiveSpotsBadge({ spots, className }: LiveSpotsBadgeProps) {
  if (spots === null) return null

  if (spots === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-rose-500', className)}>
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Completo
      </span>
    )
  }

  const urgent = spots <= 3

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        urgent ? 'text-amber-600' : 'text-emerald-600',
        className
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 animate-pulse rounded-full',
          urgent ? 'bg-amber-500' : 'bg-emerald-500'
        )}
      />
      Solo quedan {spots}
    </span>
  )
}
