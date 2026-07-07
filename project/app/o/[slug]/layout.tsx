'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { loadTenantHome } from '@/lib/org/load-tenant-home'
import { TenantProvider } from '@/contexts/TenantContext'
import { OrgThemeProvider } from '@/components/member/org-theme-provider'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { IkonSplash } from '@/components/member/ikon-splash'
import type { TenantHomeData } from '@/lib/org/types'

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const [data, setData] = useState<TenantHomeData | null>(null)

  useEffect(() => {
    setData(null)
    loadTenantHome(slug).then(setData)
  }, [slug])

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a962] border-t-transparent" />
      </div>
    )
  }

  return (
    <TenantProvider slug={slug} data={data}>
      <LocaleProvider defaultLocale={data.org.locale}>
        <OrgThemeProvider org={data.org}>
          {slug === 'ikon' && <IkonSplash />}
          {children}
        </OrgThemeProvider>
      </LocaleProvider>
    </TenantProvider>
  )
}
