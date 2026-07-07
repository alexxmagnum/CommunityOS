import { DEMO_HOST_TO_SLUG } from './demo-tenants'

const PLATFORM_PATH_PREFIXES = [
  '/auth',
  '/dashboard',
  '/platform-admin',
  '/setup',
  '/onboarding',
  '/invite',
  '/api',
  '/_next',
  '/unauthorized',
]

const STATIC_ROOT_PATHS = new Set(['/privacy', '/terms', '/cookies'])

/** Rutas que no se reescriben bajo dominio custom del tenant */
export function isPlatformPath(pathname: string): boolean {
  if (STATIC_ROOT_PATHS.has(pathname)) return true
  return PLATFORM_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Resuelve slug desde hostname (demo / dev). Producción: organizations.domain vía DB en edge. */
export function resolveSlugFromHost(host: string | null): string | null {
  if (!host) return null
  const hostname = host.split(':')[0].toLowerCase()
  if (hostname === 'localhost' || hostname === '127.0.0.1') return null
  return DEMO_HOST_TO_SLUG[hostname] ?? null
}

/**
 * Si el host es un dominio de tenant y la ruta no es de plataforma,
 * reescribe a /o/{slug}/...
 */
export function rewritePathForCustomDomain(pathname: string, slug: string): string | null {
  if (isPlatformPath(pathname)) return null
  if (pathname.startsWith(`/o/${slug}`)) return null

  if (pathname.startsWith('/o/')) {
    // Otro tenant en dominio incorrecto → forzar al slug del host
    const rest = pathname.replace(/^\/o\/[^/]+/, '') || '/'
    return `/o/${slug}${rest === '/' ? '' : rest}`
  }

  if (pathname === '/') return `/o/${slug}`
  return `/o/${slug}${pathname}`
}
