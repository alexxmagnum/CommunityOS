'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { tenantAdminLoginUrl, tenantDashboardPath } from '@/lib/org/tenant-path'

/** Fija la org activa según el slug de la URL del panel (sin selector global). */
export function TenantDashboardSync({ slug }: { slug: string }) {
  const router = useRouter()
  const { user, authReady, loading, memberships, setActiveOrganization, isOrgAdminOf } = useAuth()

  useEffect(() => {
    if (!authReady || loading) return

    if (!user) {
      router.replace(tenantAdminLoginUrl(slug, tenantDashboardPath(slug)))
      return
    }

    const membership = memberships.find((m) => m.organization?.slug === slug)
    if (!membership) {
      const ownAdmin = memberships.find((m) =>
        m.role?.name && ['org_owner', 'org_admin'].includes(m.role.name),
      )
      if (ownAdmin?.organization?.slug) {
        router.replace(tenantDashboardPath(ownAdmin.organization.slug))
      } else {
        router.replace('/onboarding')
      }
      return
    }

    if (!isOrgAdminOf(membership.organization_id)) {
      router.replace('/onboarding?reason=member')
      return
    }

    setActiveOrganization(membership.organization_id)
  }, [
    authReady,
    loading,
    user,
    slug,
    memberships,
    setActiveOrganization,
    isOrgAdminOf,
    router,
  ])

  return null
}
