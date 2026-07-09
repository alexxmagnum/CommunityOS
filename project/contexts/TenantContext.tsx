'use client'

import { createContext, useContext } from 'react'
import { tenantPath } from '@/lib/org/tenant-path'
import { isOrganizationUuid } from '@/lib/org/tenant-org-id'
import type { TenantHomeData } from '@/lib/org/types'

interface TenantContextValue extends TenantHomeData {
  slug: string
  path: (subpath?: string) => string
}

const TenantContext = createContext<TenantContextValue | null>(null)

export function TenantProvider({
  slug,
  data,
  children,
}: {
  slug: string
  data: TenantHomeData
  children: React.ReactNode
}) {
  if (process.env.NODE_ENV === 'development' && data.org.slug !== slug) {
    console.error(`[TenantProvider] slug mismatch: route=${slug} org=${data.org.slug}`)
  }
  if (!isOrganizationUuid(data.org.id) && !data.demoMode) {
    console.error(`[TenantProvider] invalid org id for ${slug}: ${data.org.id}`)
  }

  const value: TenantContextValue = {
    ...data,
    slug,
    path: (subpath = '') => tenantPath(slug, subpath),
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}

export function useTenantOptional() {
  return useContext(TenantContext)
}
