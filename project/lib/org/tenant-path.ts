/** Build tenant-scoped member app URLs: /o/{slug}/... */
export function tenantPath(slug: string, path = '') {
  const base = `/o/${slug}`
  if (!path || path === '/') return base

  const [pathname, query] = path.split('?')
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
  const url = `${base}${normalized}`
  return query ? `${url}?${query}` : url
}

export const DEFAULT_TENANT_SLUG = 'ikon'
