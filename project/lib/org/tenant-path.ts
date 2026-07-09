/** Build tenant-scoped member app URLs: /o/{slug}/... */
export function tenantPath(slug: string, path = '') {
  const base = `/o/${slug}`
  if (!path || path === '/') return base

  const [pathname, query] = path.split('?')
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  const url = `${base}${normalized}`
  return query ? `${url}?${query}` : url
}

export function tenantAuthUrl(
  slug: string,
  kind: 'login' | 'signup',
  redirect?: string,
) {
  const url = tenantPath(slug, `/${kind}`)
  if (!redirect) return url
  return `${url}?redirect=${encodeURIComponent(redirect)}`
}

/** Panel de administración del club: /o/{slug}/dashboard/... */
export function tenantDashboardPath(slug: string, path = '') {
  const base = `/o/${slug}/dashboard`
  if (!path || path === '/') return base
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${normalized}`
}

/** Login de administradores del club (owner/admin). */
export function tenantAdminLoginUrl(slug: string, redirect?: string) {
  const url = `/o/${slug}/admin/login`
  const target = redirect ?? tenantDashboardPath(slug)
  return `${url}?redirect=${encodeURIComponent(target)}`
}

export const DEFAULT_TENANT_SLUG = 'ikon'
