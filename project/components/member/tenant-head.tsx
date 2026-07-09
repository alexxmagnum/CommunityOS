'use client'

import { useEffect } from 'react'
import type { TenantOrg } from '@/lib/org/types'
import { getTenantLogoUrl } from '@/lib/org/resolve-theme'
import { tenantPath } from '@/lib/org/tenant-path'

/** Actualiza título, favicon y manifest PWA según el club activo. */
export function TenantHead({ org, slug }: { org: TenantOrg; slug: string }) {
  useEffect(() => {
    document.title = org.name

    const favicon = org.favicon_url ?? getTenantLogoUrl(org)
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (favicon) {
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = favicon
    }

    let manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const manifestHref = `${tenantPath(slug)}/manifest.webmanifest`
    if (!manifest) {
      manifest = document.createElement('link')
      manifest.rel = 'manifest'
      document.head.appendChild(manifest)
    }
    manifest.href = manifestHref

    const theme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (theme) theme.content = org.primary_color ?? '#0c0f14'
  }, [org, slug])

  return null
}
