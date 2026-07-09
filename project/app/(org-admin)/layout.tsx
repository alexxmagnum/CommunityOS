'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { tenantDashboardPath } from '@/lib/org/tenant-path'

/** Redirige /dashboard/* → /o/{slug}/dashboard/* (panel por tenant). */
export default function LegacyDashboardRedirectLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { loading, authReady, user, activeOrganization, memberships, isOrgAdmin } = useAuth()

  useEffect(() => {
    if (!authReady || loading) return

    const subPath = pathname.replace(/^\/dashboard\/?/, '')

    if (!user) {
      router.replace(`/auth/admin/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }

    const adminMembership =
      activeOrganization && isOrgAdmin()
        ? activeOrganization
        : memberships.find((m) =>
            m.role?.name && ['org_owner', 'org_admin'].includes(m.role.name),
          )

    const slug = adminMembership?.organization?.slug
    if (!slug) {
      router.replace('/onboarding')
      return
    }

    router.replace(tenantDashboardPath(slug, subPath))
  }, [authReady, loading, user, activeOrganization, memberships, isOrgAdmin, pathname, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
    </div>
  )
}
