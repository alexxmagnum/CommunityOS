import { tenantDashboardPath } from '@/lib/org/tenant-path'

interface AdminMembership {
  organization?: { slug?: string } | null
  role?: { name?: string } | null
}

interface PostLoginContext {
  platformAdmin: unknown | null
  activeOrganization: AdminMembership | null
  memberships?: AdminMembership[]
  isOrgAdmin: () => boolean
}

function firstAdminSlug(ctx: PostLoginContext): string | null {
  if (ctx.activeOrganization?.organization?.slug && ctx.isOrgAdmin()) {
    return ctx.activeOrganization.organization.slug
  }
  const admin = ctx.memberships?.find((m) =>
    m.role?.name && ['org_owner', 'org_admin'].includes(m.role.name),
  )
  return admin?.organization?.slug ?? null
}

function resolveLegacyDashboardRedirect(path: string, ctx: PostLoginContext): string | null {
  if (!path.startsWith('/dashboard')) return null
  const slug = firstAdminSlug(ctx)
  if (!slug) return null
  const sub = path.replace(/^\/dashboard\/?/, '')
  return tenantDashboardPath(slug, sub)
}

export function getPostLoginPath(
  ctx: PostLoginContext,
  redirectParam?: string | null
): string {
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    const legacy = resolveLegacyDashboardRedirect(redirectParam, ctx)
    if (legacy) return legacy
    return redirectParam
  }

  const slug = firstAdminSlug(ctx)
  if (slug) return tenantDashboardPath(slug)
  if (ctx.platformAdmin) return '/platform-admin'
  if (ctx.activeOrganization) return '/onboarding?reason=member'
  return '/onboarding'
}

export const ADMIN_LOGIN_PATH = '/auth/admin/login'
export const PLATFORM_LOGIN_PATH = '/auth/platform/login'
