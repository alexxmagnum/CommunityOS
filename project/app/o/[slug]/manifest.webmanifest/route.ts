import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildDemoTenantHome } from '@/lib/org/demo-tenants'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { getTenantLogoUrl } from '@/lib/org/resolve-theme'
import type { TenantOrg } from '@/lib/org/types'

async function loadOrg(slug: string): Promise<TenantOrg | null> {
  if (!isSupabaseConfigured()) {
    return buildDemoTenantHome(slug)?.org ?? null
  }

  const supabase = await createClient()
  const { data } = await supabase.rpc('get_tenant_by_slug', { p_slug: slug })
  if (!data) return null

  const raw = typeof data === 'string' ? JSON.parse(data) : data
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: raw.slug as string,
    logo_url: (raw.logo_url as string | null) ?? null,
    favicon_url: (raw.favicon_url as string | null) ?? null,
    primary_color: (raw.primary_color as string) ?? '#0c0f14',
    secondary_color: (raw.secondary_color as string) ?? '#141414',
    accent_color: (raw.accent_color as string) ?? '#32E4B5',
    theme_mode: raw.theme_mode as TenantOrg['theme_mode'],
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params
  const org = await loadOrg(slug)

  if (!org) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const icon = org.favicon_url ?? getTenantLogoUrl(org) ?? '/brand/ikon-logo.png'

  return NextResponse.json({
    name: org.name,
    short_name: org.name.slice(0, 12),
    description: `${org.name} — comunidad, eventos y experiencias`,
    start_url: `/o/${slug}`,
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: org.primary_color ?? '#0c0f14',
    theme_color: org.primary_color ?? '#0c0f14',
    icons: [{ src: icon, sizes: '192x192', type: 'image/png' }],
  })
}
