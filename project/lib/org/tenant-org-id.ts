const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isOrganizationUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/** Route slug must match loaded org — prevents cross-tenant data bleed. */
export function assertTenantOrgMatch(org: { id: string; slug: string }, routeSlug: string): void {
  if (org.slug !== routeSlug) {
    throw new Error(`Tenant mismatch: route=${routeSlug} org=${org.slug}`)
  }
  if (!isOrganizationUuid(org.id)) {
    throw new Error(`Invalid organization id for tenant ${routeSlug}`)
  }
}
