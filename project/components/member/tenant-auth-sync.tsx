'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function TenantAuthSync({ organizationId }: { organizationId: string }) {
  const { user, authReady, memberships, setActiveOrganization } = useAuth()

  useEffect(() => {
    if (!authReady || !user) return
    const membership = memberships.find((m) => m.organization_id === organizationId)
    if (membership) {
      setActiveOrganization(organizationId)
    }
  }, [authReady, user, organizationId, memberships, setActiveOrganization])

  return null
}
