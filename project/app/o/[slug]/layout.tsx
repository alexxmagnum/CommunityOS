'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { buildDemoTenantHome } from '@/lib/org/demo-tenants'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { forceUnlockBodyScroll } from '@/lib/dom/body-scroll-lock'
import { loadTenantHome } from '@/lib/org/load-tenant-home'
import { useLocale } from '@/contexts/LocaleContext'
import { TenantProvider } from '@/contexts/TenantContext'
import { OrgThemeProvider } from '@/components/member/org-theme-provider'
import { TenantAuthSync } from '@/components/member/tenant-auth-sync'
import { TenantSplash } from '@/components/member/tenant-splash'
import { TenantHead } from '@/components/member/tenant-head'
import { prewarmSplashAudio } from '@/lib/splash/golf-hit-sound'
import type { TenantHomeData } from '@/lib/org/types'

function demoTenantData(slug: string): TenantHomeData | null {
  return buildDemoTenantHome(slug)
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>()
  const pathname = usePathname()
  const slug = params.slug
  const isDashboardRoute = pathname?.startsWith(`/o/${slug}/dashboard`)
  const isAdminAuthRoute = pathname?.startsWith(`/o/${slug}/admin`)
  const { locale } = useLocale()
  const [data, setData] = useState<TenantHomeData | null>(() =>
    isSupabaseConfigured() ? null : demoTenantData(slug),
  )

  useEffect(() => {
    prewarmSplashAudio()
    forceUnlockBodyScroll()
    let cancelled = false

    if (!isSupabaseConfigured()) {
      setData(demoTenantData(slug))
      return
    }

    setData(null)
    void loadTenantHome(slug, { locale }).then((next) => {
      if (!cancelled) setData(next)
    })

    const onFocus = () => {
      void loadTenantHome(slug, { locale }).then((next) => {
        if (!cancelled) setData(next)
      })
    }
    window.addEventListener('focus', onFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
    }
  }, [slug, locale])

  if (isDashboardRoute || isAdminAuthRoute) {
    return <>{children}</>
  }

  return (
    <>
      {!data ? (
        <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#32E4B5] border-t-transparent" />
        </div>
      ) : (
        <TenantProvider key={`${slug}:${JSON.stringify(data.org.modules ?? {})}`} slug={slug} data={data}>
          <TenantHead org={data.org} slug={slug} />
          <TenantAuthSync organizationId={data.org.id} />
          <TenantSplash />
          <OrgThemeProvider org={data.org}>{children}</OrgThemeProvider>
        </TenantProvider>
      )}
    </>
  )
}
