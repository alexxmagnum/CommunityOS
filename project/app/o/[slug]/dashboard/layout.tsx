'use client'

import { useParams } from 'next/navigation'
import { TenantDashboardLayout } from '@/components/admin/tenant-dashboard-layout'

export default function TenantDashboardRouteLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ slug: string }>()
  return <TenantDashboardLayout slug={params.slug}>{children}</TenantDashboardLayout>
}
