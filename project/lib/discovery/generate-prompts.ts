import type { DiscoveryPrompt, TenantEvent, TenantFacility } from '@/lib/org/types'

function minutesUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000)
}

/** Discovery engine — turns live data into participation prompts. */
export function generateDiscoveryPrompts(
  events: TenantEvent[],
  facilities: TenantFacility[],
  demoMode: boolean
): DiscoveryPrompt[] {
  const prompts: DiscoveryPrompt[] = []

  const golf = facilities.find((f) => f.sport?.name === 'golf')
  if (golf) {
    prompts.push({
      id: 'golf-tee',
      message: 'Tee times disponibles mañana',
      subtext: golf.name,
      href: `reservations?facility=${golf.id}`,
      urgency: 'high',
    })
  }

  for (const event of events) {
    const mins = minutesUntil(event.starts_at)
    const href = demoMode ? 'events' : `events/${event.id}`

    if (event.type === 'tournament' && /golf|socio|campo/i.test(event.title)) {
      prompts.push({
        id: `golf-tournament-${event.id}`,
        message: 'Torneo de socios esta semana',
        subtext: event.title,
        href,
        urgency: 'high',
        image_url: event.cover_image_url,
      })
    }

    if (event.available_spots != null && event.available_spots > 0 && event.available_spots <= 3) {
      prompts.push({
        id: `spots-${event.id}`,
        message: `Solo quedan ${event.available_spots} plazas`,
        subtext: event.title,
        href,
        urgency: 'high',
        image_url: event.cover_image_url,
      })
    }

    if (mins > 0 && mins <= 120) {
      prompts.push({
        id: `soon-${event.id}`,
        message: mins <= 60 ? `Empieza en ${mins} min` : `Empieza en ${Math.round(mins / 60)} h`,
        subtext: event.title,
        href,
        urgency: mins <= 45 ? 'high' : 'medium',
        image_url: event.cover_image_url,
      })
    }

    if (event.type === 'experience' && /vino|cata|wine/i.test(event.title)) {
      prompts.push({
        id: `wine-${event.id}`,
        message: 'Cata de vinos en la terraza',
        subtext: event.location_details || undefined,
        href,
        urgency: 'medium',
        image_url: event.cover_image_url,
      })
    }

    if (event.title.toLowerCase().includes('brunch')) {
      prompts.push({
        id: `brunch-${event.id}`,
        message: 'Brunch dominical en el club',
        subtext: 'Reserva mesa con vistas al campo',
        href: 'reservations?type=restaurant',
        urgency: 'low',
        image_url: event.cover_image_url,
      })
    }
  }

  const padel = facilities.find((f) => f.sport?.name === 'padel')
  if (padel) {
    prompts.push({
      id: 'padel-open',
      message: 'Pista de pádel libre',
      subtext: padel.name,
      href: `reservations?facility=${padel.id}`,
      urgency: 'low',
    })
  }

  if (facilities.some((f) => f.type === 'terrace' || /terraza|terrace/i.test(f.name))) {
    prompts.push({
      id: 'tables-open',
      message: 'Mesas disponibles en terraza',
      subtext: 'Restaurante del club',
      href: 'reservations?type=restaurant',
      urgency: 'medium',
    })
  }

  const tournament = events.find((e) => e.type === 'tournament' && !/golf|socio|campo/i.test(e.title))
  if (tournament) {
    prompts.push({
      id: `tournament-${tournament.id}`,
      message: tournament.title,
      subtext: 'Inscripciones abiertas',
      href: demoMode ? 'events' : `events/${tournament.id}`,
      urgency: 'medium',
      image_url: tournament.cover_image_url,
    })
  }

  const order = { high: 0, medium: 1, low: 2 }
  const seen = new Set<string>()
  return prompts
    .filter((p) => {
      if (seen.has(p.message)) return false
      seen.add(p.message)
      return true
    })
    .sort((a, b) => order[a.urgency] - order[b.urgency])
    .slice(0, 6)
}
