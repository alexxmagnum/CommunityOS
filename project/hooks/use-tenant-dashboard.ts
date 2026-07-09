'use client'

import { useParams } from 'next/navigation'
import { tenantDashboardPath } from '@/lib/org/tenant-path'

export function useTenantDashboard() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug

  return {
    slug,
    dashboardPath: (segment = '') => tenantDashboardPath(slug, segment),
  }
}
