import { redirect } from 'next/navigation'
import { DEFAULT_TENANT_SLUG, tenantPath } from '@/lib/org/tenant-path'

export default function LegacyReservationsRedirect() {
  redirect(tenantPath(DEFAULT_TENANT_SLUG, '/reservations'))
}
