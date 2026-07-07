'use client'

import type { TenantOrg } from '@/lib/org/types'
import { IKON_BRAND } from '@/lib/org/ikon-brand'

export function OrgThemeProvider({ org, children }: { org: TenantOrg; children: React.ReactNode }) {
  const isIkon = org.slug === 'ikon'

  const style = {
    '--org-ink': isIkon ? IKON_BRAND.ink : org.primary_color,
    '--org-primary': isIkon ? IKON_BRAND.primary : org.primary_color,
    '--org-secondary': isIkon ? IKON_BRAND.secondary : (org.secondary_color || org.primary_color),
    '--org-accent': isIkon ? IKON_BRAND.accent : org.accent_color,
    '--org-accent-cyan': isIkon ? IKON_BRAND.accentCyan : org.accent_color,
    '--org-accent-lime': isIkon ? IKON_BRAND.accentLime : org.accent_color,
    '--motanos-gradient': isIkon ? IKON_BRAND.gradient : `linear-gradient(90deg, ${org.accent_color}, ${org.accent_color})`,
    '--org-surface': isIkon ? IKON_BRAND.surface : undefined,
    '--btn-fill': isIkon ? IKON_BRAND.ink : 'hsl(var(--background))',
  } as React.CSSProperties

  return (
    <div
      style={style}
      className="tenant-theme min-h-screen bg-[var(--org-surface,hsl(var(--background))] text-[hsl(var(--foreground))]"
      data-tenant={org.slug}
    >
      {children}
    </div>
  )
}
