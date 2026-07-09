'use client'

import { useTenantOptional } from '@/contexts/TenantContext'
import { usesGolfSplash, usesRevealSplash } from '@/lib/org/tenant-experience'
import { GolfSplash } from '@/components/member/ikon-splash'
import { BrandSplash } from '@/components/member/brand-splash'

/** Splash de entrada según `branding_experience.splash_style` del club. */
export function TenantSplash() {
  const tenant = useTenantOptional()
  const org = tenant?.org

  if (!org) return null
  if (usesGolfSplash(org)) return <GolfSplash key={`splash-${org.id}`} org={org} />
  if (usesRevealSplash(org)) return <BrandSplash key={`splash-${org.id}`} org={org} />

  return null
}
