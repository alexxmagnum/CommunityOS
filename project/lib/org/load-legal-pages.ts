import { getSupabaseClient } from '@/lib/supabase/client'
import { getDefaultLegalPages, type LegalPageKey, type LegalPagesMap } from './legal-content'
import { isSupabaseConfigured } from './is-supabase-configured'

const SETTINGS_KEY = 'legal_pages'

export async function loadLegalPages(orgId: string, slug: string): Promise<LegalPagesMap> {
  const defaults = getDefaultLegalPages(slug)

  if (!isSupabaseConfigured() || orgId.startsWith('demo-')) {
    return defaults
  }

  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('organization_settings')
    .select('value')
    .eq('organization_id', orgId)
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (!data?.value || typeof data.value !== 'object') {
    return defaults
  }

  const stored = data.value as Partial<LegalPagesMap>
  return {
    privacy: stored.privacy ?? defaults.privacy,
    terms: stored.terms ?? defaults.terms,
    cookies: stored.cookies ?? defaults.cookies,
  }
}

export async function saveLegalPages(orgId: string, pages: LegalPagesMap): Promise<void> {
  const supabase = getSupabaseClient()
  const { data: existing } = await supabase
    .from('organization_settings')
    .select('id')
    .eq('organization_id', orgId)
    .eq('key', SETTINGS_KEY)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('organization_settings')
      .update({ value: pages as never, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    return
  }

  await supabase.from('organization_settings').insert({
    organization_id: orgId,
    key: SETTINGS_KEY,
    value: pages as never,
  })
}

export function isLegalPageKey(page: string): page is LegalPageKey {
  return page === 'privacy' || page === 'terms' || page === 'cookies'
}
