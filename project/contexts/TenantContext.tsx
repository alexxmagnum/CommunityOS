'use client'

import { createContext, useContext } from 'react'
import { tenantPath } from '@/lib/org/tenant-path'
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
