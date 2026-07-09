import type { TenantEvent } from '@/lib/org/types'
import type { UserDiscoveryContext } from './types'

interface ScoredItem {
  event: TenantEvent
  score: number
  reason: string
}

/** Motor ligero de recomendaciones (sin ML externo) — puntúa eventos por historial y preferencias */
export function scoreEventRecommendations(
  events: TenantEvent[],
  context?: UserDiscoveryContext | null
): ScoredItem[] {
  if (!context) return []

  const now = Date.now()

  return events
    .map((event) => {
      let score = 0
      const reasons: string[] = []

      const starts = new Date(event.starts_at).getTime()
      const daysOut = (starts - now) / (1000 * 60 * 60 * 24)
      if (daysOut >= 0 && daysOut <= 7) {
        score += 2
        reasons.push('próximo')
      }

      if (context.recentEventTypes?.includes(event.type)) {
        score += 3
        reasons.push('similar a tu historial')
      }

      if (event.type === 'tournament' && context.favoriteSports?.length) {
        score += 2
        reasons.push('deporte favorito')
      }

      if (event.available_spots != null && event.available_spots > 0 && event.available_spots <= 5) {
        score += 1.5
        reasons.push('plazas limitadas')
      }

      if (context.favoriteDishes?.length && event.type === 'experience') {
        score += 1
        reasons.push('experiencia gastronómica')
      }

      return { event, score, reason: reasons.join(' · ') || 'recomendado' }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}
