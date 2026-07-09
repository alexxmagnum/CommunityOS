import type { TenantActivity, TenantEvent, TenantFacility, TenantOrg } from './types'
import { getBrandTemplate } from './brand-templates'

const coastal = getBrandTemplate('coastal')!

/** Segundo tenant demo — Marina Beach Club (plantilla Coastal Premium, sin código manual). */
export const MARINA_TENANT: TenantOrg = {
  id: 'demo-marina',
  name: 'Marina Beach Club',
  slug: 'marina',
  logo_url: null,
  primary_color: coastal.org.primary_color,
  secondary_color: coastal.org.secondary_color,
  accent_color: coastal.org.accent_color,
  font_family: coastal.org.font_family,
  theme_mode: coastal.org.theme_mode,
  city: 'Valencia',
  hero_image_url: coastal.hero.hero_image_url,
  hero_tagline: coastal.hero.hero_tagline,
  locale: 'es-ES',
  currency: 'EUR',
  custom_domain: 'marina.localhost',
  branding: {
    ...coastal.experience,
    hero_image_url: coastal.hero.hero_image_url,
    hero_tagline: coastal.hero.hero_tagline,
  },
}

export const MARINA_EVENTS: TenantEvent[] = [
  {
    id: 'demo-m-e1',
    title: 'Sunset session en la playa',
    type: 'experience',
    starts_at: '2026-07-11T18:30:00.000Z',
    available_spots: 6,
    price: 25,
    cover_image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
    location_details: 'Hamacas frente al mar · zona playa',
  },
  {
    id: 'demo-m-e2',
    title: 'Regata social de vela',
    type: 'tournament',
    starts_at: '2026-07-13T10:00:00.000Z',
    available_spots: 2,
    price: 0,
    cover_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=900&q=80',
    location_details: 'Muelle principal',
  },
  {
    id: 'demo-m-e3',
    title: 'Brunch mediterráneo',
    type: 'event',
    starts_at: '2026-07-14T11:00:00.000Z',
    available_spots: 18,
    price: 32,
    cover_image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
    location_details: 'Terraza marina',
  },
]

export const MARINA_FACILITIES: TenantFacility[] = [
  {
    id: 'demo-m-f1',
    name: 'Hamaca premium',
    type: 'beach',
    sport: null,
    booking_config: { price_per_hour: 20 },
  },
  {
    id: 'demo-m-f2',
    name: 'Paddle surf',
    type: 'water',
    sport: { display_name: 'Paddle', name: 'paddle' },
    booking_config: { price_per_hour: 18 },
  },
  {
    id: 'demo-m-f3',
    name: 'Mesa terraza marina',
    type: 'terrace',
    sport: null,
    booking_config: {},
  },
]

export const MARINA_ACTIVITIES: TenantActivity[] = [
  {
    id: 'demo-m-a1',
    title: 'Laura reservó hamaca premium',
    description: 'Zona playa · sábado 11:00',
    created_at: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: 'demo-m-a2',
    title: 'Grupo inscrito a la regata social',
    description: 'Embarcación J/70 · tripulación completa',
    created_at: new Date(Date.now() - 5400000).toISOString(),
  },
]
