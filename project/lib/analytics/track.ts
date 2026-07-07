import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'

export type AnalyticsEventName =
  | 'page_view'
  | 'reservation_created'
  | 'event_registered'
  | 'tournament_viewed'

export interface AnalyticsPayload {
  organization_id?: string
  user_id?: string
  name: AnalyticsEventName
  properties?: Record<string, string | number | boolean>
}

/** Registra evento — en demo solo consola; con Supabase inserta en analytics_events */
export async function trackEvent(payload: AnalyticsPayload): Promise<void> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[analytics]', payload.name, payload.properties ?? {})
    }
    return
  }

  try {
    const { getSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = getSupabaseClient()
    await supabase.from('analytics_events').insert({
      organization_id: payload.organization_id ?? null,
      user_id: payload.user_id ?? null,
      event_name: payload.name,
      properties: payload.properties ?? {},
    } as never)
  } catch {
    // No bloquear UX por analítica
  }
}
