import { DEFAULT_ORG_SLUG } from '@/lib/constants'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DEMO_ACTIVITIES, DEMO_EVENTS, DEMO_FACILITIES, DEMO_TENANT } from './demo-tenant'
import { isSupabaseConfigured } from './is-supabase-configured'
import type { TenantHomeData } from './types'

export async function loadTenantHome(slug = DEFAULT_ORG_SLUG): Promise<TenantHomeData> {
  if (!isSupabaseConfigured()) {
    return {
      org: { ...DEMO_TENANT, slug },
      events: DEMO_EVENTS,
      facilities: DEMO_FACILITIES,
      activities: DEMO_ACTIVITIES,
      stats: { events: DEMO_EVENTS.length, members: 248 },
      demoMode: true,
    }
  }

  const supabase = getSupabaseClient()

  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, name, slug, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, theme_mode')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!orgData) {
    return {
      org: { ...DEMO_TENANT, slug },
      events: DEMO_EVENTS,
      facilities: DEMO_FACILITIES,
      activities: DEMO_ACTIVITIES,
      stats: { events: DEMO_EVENTS.length, members: 248 },
      demoMode: true,
    }
  }

  const [eventsRes, facilitiesRes, activityRes, eventCount, memberCount, venueRes] = await Promise.all([
    supabase.from('events').select('id, title, type, starts_at, available_spots, price, cover_image_url, location_details')
      .eq('organization_id', orgData.id).eq('status', 'published').eq('is_public', true)
      .gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(8),
    supabase.from('facilities').select('id, name, type, booking_config, sport:sports(display_name, name)')
      .eq('organization_id', orgData.id).eq('is_active', true).limit(6),
    supabase.from('activity_feed').select('id, title, description, created_at')
      .eq('organization_id', orgData.id).eq('is_public', true)
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('events').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgData.id).eq('status', 'published'),
    supabase.from('organization_members').select('*', { count: 'exact', head: true })
      .eq('organization_id', orgData.id).eq('status', 'active'),
    supabase.from('venues').select('city').eq('organization_id', orgData.id).eq('is_active', true).limit(1).maybeSingle(),
  ])

  return {
    org: {
      ...orgData,
      city: venueRes.data?.city ?? undefined,
    },
    events: eventsRes.data ?? [],
    facilities: (facilitiesRes.data ?? []).map((f) => ({
      ...f,
      sport: Array.isArray(f.sport) ? f.sport[0] : f.sport,
    })),
    activities: activityRes.data ?? [],
    stats: {
      events: eventCount.count ?? 0,
      members: memberCount.count ?? 0,
    },
    demoMode: false,
  }
}
