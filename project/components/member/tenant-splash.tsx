'use client'

import { useTenantOptional } from '@/contexts/TenantContext'
import { usesGolfSplash, usesRevealSplash } from '@/lib/org/tenant-experience'
import { IkonSplash } from '@/components/member/ikon-splash'
import { BrandSplash } from '@/components/member/brand-splash'

/** Splash de entrada según configuración del club (no por slug, salvo IKON golf). */
export function TenantSplash() {
  const tenant = useTenantOptional()
  const org = tenant?.org

  if (!org) return null
  if (usesGolfSplash(org)) return <IkonSplash key={`splash-${org.id}`} />
  if (usesRevealSplash(org)) return <BrandSplash key={`splash-${org.id}`} org={org} />

  return null
}
