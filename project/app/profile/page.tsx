import { redirect } from 'next/navigation'
import { DEFAULT_TENANT_SLUG, tenantPath } from '@/lib/org/tenant-path'

export default function LegacyProfileRedirect() {
  redirect(tenantPath(DEFAULT_TENANT_SLUG, '/profile'))
}
