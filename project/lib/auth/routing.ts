interface PostLoginContext {
  platformAdmin: unknown | null
  activeOrganization: unknown | null
  isOrgAdmin: () => boolean
}

export function getPostLoginPath(
  ctx: PostLoginContext,
  redirectParam?: string | null
): string {
  if (redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam
  }

  if (ctx.platformAdmin) return '/platform-admin'
  if (ctx.activeOrganization && ctx.isOrgAdmin()) return '/dashboard'
  if (ctx.activeOrganization) return '/onboarding?reason=member'
  return '/onboarding'
}
