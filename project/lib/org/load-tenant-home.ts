import { DEFAULT_ORG_SLUG } from '@/lib/constants'
import { getSupabaseClient } from '@/lib/supabase/client'
import { buildDemoTenantHome } from './demo-tenants'
import { isSupabaseConfigured } from './is-supabase-configured'
import { parseOrgModules } from './tenant-modules'
import {
  mergeTenantBranding,
  parseBrandingExperience,
  parseBrandingHero,
  withIkonPreset,
} from './tenant-experience'
import {
  localizeActivity,
  localizeEvent,
  localizeFacility,
} from '@/lib/i18n/content'
import { resolveAppLocale } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/types'
import type { TenantBranding, TenantHomeData, TenantOrg } from './types'

const LOAD_TIMEOUT_MS = 20000

function emptyTenantHome(slug: string, name: string, modules?: TenantOrg['modules'], forceDemo = false): TenantHomeData {
  return {
    org: {
      id: slug,
      name,
      slug,
      logo_url: null,
      primary_color: '#0A0A0A',
      secondary_color: '#141414',
      accent_color: '#32E4B5',
      modules,
    },
    events: [],
    facilities: [],
    activities: [],
    stats: { events: 0, members: 0 },
    demoMode: forceDemo,
  }
}

function offlineFallback(slug: string): TenantHomeData {
  if (isSupabaseConfigured()) {
    return emptyTenantHome(slug, slug, undefined, true)
  }
  return buildDemoTenantHome(slug) ?? emptyTenantHome(slug, slug)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('tenant-load-timeout')), ms)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

async function loadTenantBranding(orgId: string): Promise<TenantBranding | undefined> {
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('organization_settings')
    .select('key, value')
    .eq('organization_id', orgId)
    .in('key', ['branding_hero', 'branding_experience'])

  let hero: Partial<TenantBranding> | undefined
  let experience: Partial<TenantBranding> | undefined

  for (const row of data ?? []) {
    if (row.key === 'branding_hero') hero = parseBrandingHero(row.value)
    if (row.key === 'branding_experience') experience = parseBrandingExperience(row.value)
  }

  return mergeTenantBranding(hero, experience)
}

async function loadOrgBySlug(slug: string): Promise<TenantOrg | null> {
  const supabase = getSupabaseClient()

  const { data: rpcOrg, error: rpcError } = await supabase.rpc('get_tenant_by_slug', { p_slug: slug })
  if (!rpcError && rpcOrg) {
    const raw = typeof rpcOrg === 'string' ? JSON.parse(rpcOrg) : rpcOrg
    const modules = parseOrgModules((raw as Record<string, unknown>).modules)
    const branding = await loadTenantBranding(raw.id as string)
    return withIkonPreset({
      id: raw.id as string,
      name: raw.name as string,
      slug: raw.slug as string,
      logo_url: (raw.logo_url as string | null) ?? null,
      favicon_url: (raw.favicon_url as string | null) ?? null,
      primary_color: (raw.primary_color as string) ?? '#0A0A0A',
      secondary_color: (raw.secondary_color as string) ?? '#141414',
      accent_color: (raw.accent_color as string) ?? '#32E4B5',
      font_family: raw.font_family as string | undefined,
      theme_mode: raw.theme_mode as TenantOrg['theme_mode'],
      modules: modules ?? undefined,
      hero_image_url: branding?.hero_image_url ?? undefined,
      hero_tagline: branding?.hero_tagline ?? undefined,
      branding,
    })
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, domain, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, theme_mode, modules')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const modules = parseOrgModules(data.modules)
  const branding = await loadTenantBranding(data.id)
  return withIkonPreset({
    ...data,
    modules: modules ?? undefined,
    hero_image_url: branding?.hero_image_url ?? undefined,
    hero_tagline: branding?.hero_tagline ?? undefined,
    branding,
  })
}

export async function loadTenantHome(
  slug = DEFAULT_ORG_SLUG,
  options?: { locale?: Locale }
): Promise<TenantHomeData> {
  if (!isSupabaseConfigured()) {
    return offlineFallback(slug)
  }

  try {
    const org = await loadOrgBySlug(slug)
    if (!org) {
      return { ...emptyTenantHome(slug, slug), demoMode: true }
    }

    const supabase = getSupabaseClient()
    const orgId = org.id
    const locale = options?.locale ?? resolveAppLocale({ orgLocale: org.locale })

    const [eventsRes, facilitiesRes, activityRes, eventCount, memberCount, venueRes] = await withTimeout(
      Promise.all([
        supabase.from('events').select('id, title, type, starts_at, available_spots, price, cover_image_url, location_details')
          .eq('organization_id', orgId).eq('status', 'published').eq('is_public', true)
          .gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(8),
        supabase.from('facilities').select('id, name, type, booking_config, sport:sports(display_name, name)')
          .eq('organization_id', orgId).eq('is_active', true).limit(6),
        supabase.from('activity_feed').select('id, title, description, created_at')
          .eq('organization_id', orgId).eq('is_public', true)
          .order('created_at', { ascending: false }).limit(8),
        supabase.from('events').select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId).eq('status', 'published'),
        supabase.from('organization_members').select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId).eq('status', 'active'),
        supabase.from('venues').select('city').eq('organization_id', orgId).eq('is_active', true).limit(1).maybeSingle(),
      ]),
      LOAD_TIMEOUT_MS,
    )

    return {
      org: withIkonPreset({ ...org, city: venueRes.data?.city ?? undefined }),
      events: (eventsRes.data ?? []).map((e) => localizeEvent(locale, e)),
      facilities: (facilitiesRes.data ?? []).map((f) =>
        localizeFacility(locale, {
          ...f,
          sport: Array.isArray(f.sport) ? f.sport[0] : f.sport,
        })
      ),
      activities: (activityRes.data ?? []).map((a) => localizeActivity(locale, a)),
      stats: {
        events: eventCount.count ?? 0,
        members: memberCount.count ?? 0,
      },
      demoMode: false,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[loadTenantHome] partial fallback:', error)
    }

    try {
      const org = await loadOrgBySlug(slug)
      if (org) {
        return {
          ...emptyTenantHome(slug, org.name, org.modules),
          org: withIkonPreset(org),
          demoMode: false,
        }
      }
    } catch {
      // ignore
    }

    return emptyTenantHome(slug, slug, undefined, true)
  }
}
