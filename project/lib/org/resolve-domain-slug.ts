import { DEMO_HOST_TO_SLUG } from './demo-tenants'
import { isPlatformHostname, parseHostname } from './normalize-domain'

type CacheEntry = { slug: string | null; expires: number }

const DOMAIN_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000

async function fetchSlugFromSupabase(hostname: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null

  try {
    const res = await fetch(`${url}/rest/v1/rpc/get_slug_by_domain`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_domain: hostname }),
    })

    if (!res.ok) return null

    const slug = (await res.json()) as unknown
    return typeof slug === 'string' && slug.length > 0 ? slug : null
  } catch {
    return null
  }
}

/**
 * Resuelve slug de tenant desde hostname: demo map → caché → Supabase `organizations.domain`.
 */
export async function resolveSlugFromHostWithDb(host: string | null): Promise<string | null> {
  const hostname = parseHostname(host)
  if (!hostname) return null

  if (DEMO_HOST_TO_SLUG[hostname]) {
    return DEMO_HOST_TO_SLUG[hostname]
  }

  if (isPlatformHostname(hostname)) {
    return null
  }

  const cached = DOMAIN_CACHE.get(hostname)
  if (cached && cached.expires > Date.now()) {
    return cached.slug
  }

  const slug = await fetchSlugFromSupabase(hostname)
  DOMAIN_CACHE.set(hostname, { slug, expires: Date.now() + CACHE_TTL_MS })
  return slug
}

/** Invalida caché tras cambiar dominio en admin (opcional). */
export function invalidateDomainCache(hostname?: string) {
  if (hostname) {
    DOMAIN_CACHE.delete(hostname.toLowerCase())
    return
  }
  DOMAIN_CACHE.clear()
}
