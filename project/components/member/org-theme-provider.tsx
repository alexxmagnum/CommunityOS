'use client'

import type { TenantOrg } from '@/lib/org/types'
import { resolveOrgTheme } from '@/lib/org/resolve-theme'

export function OrgThemeProvider({ org, children }: { org: TenantOrg; children: React.ReactNode }) {
  const style = resolveOrgTheme(org)

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
