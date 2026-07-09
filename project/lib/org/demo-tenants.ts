import {
  DEMO_ACTIVITIES,
  DEMO_EVENTS,
  DEMO_FACILITIES,
  DEMO_HERO,
  DEMO_TENANT,
} from './demo-tenant'
import {
  MARINA_ACTIVITIES,
  MARINA_EVENTS,
  MARINA_FACILITIES,
  MARINA_TENANT,
} from './demo-tenant-marina'
import type { TenantHomeData } from './types'
import { withIkonPreset } from './tenant-experience'

export interface DemoTenantPack {
  org: typeof DEMO_TENANT
  events: typeof DEMO_EVENTS
  facilities: typeof DEMO_FACILITIES
  activities: typeof DEMO_ACTIVITIES
  heroImage: string
  memberCount: number
}

const IKON_PACK: DemoTenantPack = {
  org: DEMO_TENANT,
  events: DEMO_EVENTS,
  facilities: DEMO_FACILITIES,
  activities: DEMO_ACTIVITIES,
  heroImage: DEMO_HERO,
  memberCount: 248,
}

const MARINA_PACK: DemoTenantPack = {
  org: MARINA_TENANT,
  events: MARINA_EVENTS,
  facilities: MARINA_FACILITIES,
  activities: MARINA_ACTIVITIES,
  heroImage: MARINA_TENANT.hero_image_url!,
  memberCount: 412,
}

/** Hostname (sin puerto) → slug en modo demo / desarrollo local */
export const DEMO_HOST_TO_SLUG: Record<string, string> = {
  'ikon.localhost': 'ikon',
  'marina.localhost': 'marina',
  'ikon.communityos.demo': 'ikon',
  'marina.communityos.demo': 'marina',
}

export const DEMO_TENANT_SLUGS = ['ikon', 'marina'] as const
export type DemoTenantSlug = (typeof DEMO_TENANT_SLUGS)[number]

const PACKS: Record<DemoTenantSlug, DemoTenantPack> = {
  ikon: IKON_PACK,
  marina: MARINA_PACK,
}

export function isDemoTenantSlug(slug: string): slug is DemoTenantSlug {
  return slug === 'ikon' || slug === 'marina'
}

export function getDemoTenantPack(slug: string): DemoTenantPack | null {
  if (!isDemoTenantSlug(slug)) return null
  return PACKS[slug]
}

export function buildDemoTenantHome(slug: string): TenantHomeData | null {
  const pack = getDemoTenantPack(slug)
  if (!pack) return null

  return {
    org: withIkonPreset({
      ...pack.org,
      slug,
      hero_image_url: pack.heroImage,
    }),
    events: pack.events,
    facilities: pack.facilities,
    activities: pack.activities,
    stats: { events: pack.events.length, members: pack.memberCount },
    demoMode: true,
  }
}

export function listDemoTenants() {
  return DEMO_TENANT_SLUGS.map((slug) => {
    const pack = PACKS[slug]
    return {
      slug,
      name: pack.org.name,
      primary_color: pack.org.primary_color,
      custom_domain: pack.org.custom_domain,
    }
  })
}
