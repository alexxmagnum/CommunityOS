import { describe, expect, it } from 'vitest'
import { scoreEventRecommendations } from '@/lib/discovery/score-recommendations'
import type { TenantEvent } from '@/lib/org/types'

const events: TenantEvent[] = [
  {
    id: 'e1',
    title: 'Torneo pádel',
    type: 'tournament',
    starts_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    available_spots: 2,
    price: 0,
    cover_image_url: null,
    location_details: null,
  },
]

describe('scoreEventRecommendations', () => {
  it('prioriza eventos alineados con historial', () => {
    const scored = scoreEventRecommendations(events, {
      favoriteSports: ['padel'],
      favoriteDishes: [],
      recentEventTypes: ['tournament'],
    })
    expect(scored.length).toBeGreaterThan(0)
    expect(scored[0].event.id).toBe('e1')
  })
})
