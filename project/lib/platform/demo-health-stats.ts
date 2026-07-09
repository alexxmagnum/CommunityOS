import type { SubscriptionTier } from '@/lib/billing/plans'

export interface PlatformHealthStats {
  organizationsActive: number
  organizationsTotal: number
  reservationsToday: number
  eventsLive: number
  errorRatePercent: number
  tierBreakdown: Record<SubscriptionTier, number>
  generatedAt: string
}

export const DEMO_PLATFORM_HEALTH: PlatformHealthStats = {
  organizationsActive: 2,
  organizationsTotal: 2,
  reservationsToday: 14,
  eventsLive: 6,
  errorRatePercent: 0.12,
  tierBreakdown: {
    trial: 0,
    starter: 1,
    professional: 1,
    enterprise: 0,
  },
  generatedAt: new Date().toISOString(),
}
