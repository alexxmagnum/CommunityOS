'use client'

import { useEffect, useState } from 'react'
import type { TenantOrg } from '@/lib/org/types'
import { resolveOrgTheme } from '@/lib/org/resolve-theme'
import { cn } from '@/lib/utils'

const GOOGLE_FONTS = new Set([
  'Inter',
  'Roboto',
  'Lato',
  'Open Sans',
  'Poppins',
  'Playfair Display',
  'Instrument Serif',
])

function useSystemDark() {
  const [systemDark, setSystemDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return systemDark
}

function useTenantFont(fontFamily?: string) {
  useEffect(() => {
    if (!fontFamily || !GOOGLE_FONTS.has(fontFamily)) return
    const id = `tenant-font-${fontFamily.replace(/\s+/g, '-')}`
    if (document.getElementById(id)) return

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`
    document.head.appendChild(link)
  }, [fontFamily])
}

export function OrgThemeProvider({ org, children }: { org: TenantOrg; children: React.ReactNode }) {
  const systemDark = useSystemDark()
  useTenantFont(org.font_family)

  const style = resolveOrgTheme(org)
  const isDark =
    org.theme_mode === 'dark' || (org.theme_mode === 'system' && systemDark)

  return (
    <div
      style={style}
      className={cn(
        'tenant-theme min-h-screen font-sans bg-[var(--org-surface,hsl(var(--background)))] text-[hsl(var(--foreground))]',
        isDark && 'dark'
      )}
      data-tenant={org.slug}
      data-theme={org.theme_mode ?? 'light'}
    >
      {children}
    </div>
  )
}
