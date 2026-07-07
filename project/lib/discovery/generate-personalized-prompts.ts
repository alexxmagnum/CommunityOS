import type { UserDiscoveryContext } from './types'
import { DEMO_TOURNAMENT_ID } from '@/lib/tournaments/demo-tournament'
import type { DiscoveryPrompt, TenantEvent, TenantFacility } from '@/lib/org/types'
import { generateDiscoveryPrompts } from './generate-prompts'

function hourBucket() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  if (h < 21) return 'evening'
  return 'night'
}

/** Personalized discovery — extends rule engine with user context. */
export function generatePersonalizedPrompts(
  events: TenantEvent[],
  facilities: TenantFacility[],
  demoMode: boolean,
  context?: UserDiscoveryContext | null
): DiscoveryPrompt[] {
  const base = generateDiscoveryPrompts(events, facilities, demoMode)
  const extra: DiscoveryPrompt[] = []

  if (!context) return base

  const bucket = hourBucket()

  if (bucket === 'morning' && context.favoriteSports?.includes('golf')) {
    const golf = facilities.find((f) => f.sport?.name === 'golf')
    if (golf) {
      extra.push({
        id: 'for-you-golf-morning',
        message: 'Tu mañana de golf te espera',
        subtext: golf.name,
        href: `reservations?facility=${golf.id}`,
        urgency: 'high',
      })
    }
  }

  if (bucket === 'evening' && context.favoriteSports?.includes('padel')) {
    const padel = facilities.find((f) => f.sport?.name === 'padel')
    if (padel) {
      extra.push({
        id: 'for-you-padel-evening',
        message: 'Partido de pádel al atardecer',
        subtext: padel.name,
        href: `reservations?facility=${padel.id}`,
        urgency: 'medium',
      })
    }
  }

  if (context.favoriteDishes?.length) {
    extra.push({
      id: 'for-you-dish',
      message: `¿Te apetece ${context.favoriteDishes[0]}?`,
      subtext: 'Tu favorito del club',
      href: 'carta',
      urgency: 'low',
    })
  }

  if (context.upcomingReservation) {
    extra.push({
      id: 'for-you-reservation',
      message: 'Tu reserva es pronto',
      subtext: context.upcomingReservation,
      href: 'reservations',
      urgency: 'high',
    })
  }

  if (context.recentEventTypes?.includes('tournament')) {
    const tournament = events.find((e) => e.type === 'tournament')
    if (tournament) {
      extra.push({
        id: 'for-you-tournament',
        message: 'Siguiente torneo para ti',
        subtext: tournament.title,
        href: demoMode ? `tournaments/${DEMO_TOURNAMENT_ID}` : `tournaments/${DEMO_TOURNAMENT_ID}`,
        urgency: 'medium',
        image_url: tournament.cover_image_url,
      })
    }
  }

  const merged = [...extra, ...base]
  const seen = new Set<string>()
  const order = { high: 0, medium: 1, low: 2 }

  return merged
    .filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
    .sort((a, b) => order[a.urgency] - order[b.urgency])
    .slice(0, 6)
}
