'use client'

import { useEffect, useState } from 'react'
import type { TenantOrg } from '@/lib/org/types'
import { getTenantLogoUrl } from '@/lib/org/resolve-theme'

type BrandSplashProps = {
  org: TenantOrg
}

/** Splash premium genérico — logo/nombre del club, sin hardcodear IKON. */
export function BrandSplash({ org }: BrandSplashProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'done'>('in')
  const logoUrl = getTenantLogoUrl(org)
  const tagline = org.branding?.tagline ?? org.hero_tagline ?? ''

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('hold'), 400)
    const t2 = window.setTimeout(() => setPhase('out'), 2200)
    const t3 = window.setTimeout(() => setPhase('done'), 2900)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      className={`brand-splash fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-700 ${
        phase === 'out' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: org.secondary_color || org.primary_color }}
      aria-hidden={phase === 'out'}
    >
      <div
        className={`text-center transition-all duration-700 ${
          phase === 'in' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="mx-auto h-20 w-20 rounded-2xl object-contain"
          />
        ) : (
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-semibold"
            style={{
              backgroundColor: org.accent_color,
              color: org.primary_color,
            }}
          >
            {org.name?.[0] ?? 'C'}
          </div>
        )}
        <p className="font-display mt-6 text-3xl tracking-wide text-[var(--org-primary,#FAFAFA)]">
          {org.name}
        </p>
        {tagline ? (
          <p className="mt-2 text-[11px] uppercase tracking-[0.32em] text-[var(--org-primary,#FAFAFA)]/55">
            {tagline}
          </p>
        ) : null}
        <div
          className="mx-auto mt-8 h-px w-16"
          style={{ backgroundColor: org.accent_color }}
          aria-hidden
        />
      </div>
    </div>
  )
}
