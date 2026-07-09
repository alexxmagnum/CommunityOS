'use client'

import { useParams } from 'next/navigation'
import { LoginShell } from '@/components/auth/login-shell'
import { tenantDashboardPath, tenantPath } from '@/lib/org/tenant-path'

export default function TenantAdminLoginPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const clubName = slug.replace(/-/g, ' ')

  return (
    <LoginShell
      variant="org-admin"
      defaultRedirect={tenantDashboardPath(slug)}
      backHref={tenantPath(slug)}
      backLabel="Volver al club"
      badge={`Panel · ${clubName}`}
    />
  )
}
