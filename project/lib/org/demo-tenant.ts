import type { TenantActivity, TenantEvent, TenantFacility, TenantOrg } from './types'
import { IKON_BRAND } from './ikon-brand'

export const DEMO_HERO = 'https://images.unsplash.com/photo-1535131749006-ba7a34837537?auto=format&fit=crop&w=2400&q=90'

/** Primer tenant demo — IKON Golf Club premium */
export const DEMO_TENANT: TenantOrg = {
  id: 'demo-ikon',
  name: 'IKON',
  slug: 'ikon',
  logo_url: '/brand/ikon-logo.png',
  primary_color: IKON_BRAND.primary,
  secondary_color: IKON_BRAND.secondary,
  accent_color: IKON_BRAND.accent,
  font_family: 'Instrument Serif',
  theme_mode: 'light',
  city: 'Marbella',
  hero_image_url: DEMO_HERO,
  locale: 'es-ES',
  currency: 'EUR',
  custom_domain: 'ikon.localhost',
}

export const DEMO_EVENTS: TenantEvent[] = [
  {
    id: 'demo-e-golf',
    title: 'Torneo mensual de socios',
    type: 'tournament',
    starts_at: '2026-07-10T08:00:00.000Z',
    available_spots: 4,
    price: 0,
    cover_image_url: 'https://images.unsplash.com/photo-1587174480603-9459e0479c82?w=900&q=85',
    location_details: 'Campo championship · salida 1',
  },
  {
    id: 'demo-e1',
    title: 'Cata de vinos en la terraza',
    type: 'experience',
    starts_at: '2026-07-12T19:00:00.000Z',
    available_spots: 2,
    price: 45,
    cover_image_url: 'https://images.unsplash.com/photo-1510812431400-5740424a8a0a?w=900&q=80',
    location_details: 'Terraza del club',
  },
  {
    id: 'demo-e3',
    title: 'Brunch dominical',
    type: 'event',
    starts_at: '2026-07-13T11:00:00.000Z',
    available_spots: 24,
    price: 35,
    cover_image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80',
    location_details: 'Restaurante IKON',
  },
  {
    id: 'demo-e2',
    title: 'Final del torneo de pádel',
    type: 'tournament',
    starts_at: '2026-07-14T10:00:00.000Z',
    available_spots: 0,
    price: 0,
    cover_image_url: 'https://images.unsplash.com/photo-1554068865-24cecd4e9b8?w=900&q=80',
    location_details: 'Pistas de pádel',
  },
]

export const DEMO_FACILITIES: TenantFacility[] = [
  { id: 'demo-f2', name: 'Campo de golf', type: 'outdoor', sport: { display_name: 'Golf', name: 'golf' }, booking_config: { price_per_hour: 80 } },
  { id: 'demo-f1', name: 'Pista de pádel 1', type: 'outdoor', sport: { display_name: 'Pádel', name: 'padel' }, booking_config: { price_per_hour: 35 } },
  { id: 'demo-f3', name: 'Mesa en terraza', type: 'terrace', sport: null, booking_config: {} },
]

export const DEMO_ACTIVITIES: TenantActivity[] = [
  { id: 'demo-a0', title: 'Carlos reservó tee time', description: 'Campo · sábado 09:00 · flight de 4', created_at: new Date(Date.now() - 900000).toISOString() },
  { id: 'demo-a1', title: 'María se inscribió al torneo de socios', description: 'Formato medal play · 18 hoyos', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'demo-a2', title: 'Mesa reservada en terraza', description: 'Cata de vinos · 2 comensales', created_at: new Date(Date.now() - 7200000).toISOString() },
]
