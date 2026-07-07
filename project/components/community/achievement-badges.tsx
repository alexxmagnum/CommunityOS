import { Star, Calendar, Trophy, Users } from 'lucide-react'
import type { Achievement } from '@/lib/community/types'
import { cn } from '@/lib/utils'

const ICONS: Record<string, typeof Star> = {
  star: Star,
  calendar: Calendar,
  trophy: Trophy,
  users: Users,
}

export function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  if (!achievements.length) return null

  return (
    <div className="flex flex-wrap gap-3">
      {achievements.map((a) => {
        const Icon = ICONS[a.icon || 'star'] || Star
        return (
          <div
            key={a.id}
            title={a.description || a.display_name}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
              a.earned
                ? 'border-[color:var(--org-accent)]/40 bg-[color:var(--org-accent)]/10 text-foreground'
                : 'border-border bg-muted/30 text-muted-foreground opacity-50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {a.display_name}
          </div>
        )
      })}
    </div>
  )
}
