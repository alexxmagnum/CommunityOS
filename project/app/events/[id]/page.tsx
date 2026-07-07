import { redirect } from 'next/navigation'
import { DEFAULT_TENANT_SLUG, tenantPath } from '@/lib/org/tenant-path'

export default async function LegacyEventDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(tenantPath(DEFAULT_TENANT_SLUG, `/events/${id}`))
}
