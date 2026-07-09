'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { CheckInScanner } from '@/components/events/check-in-scanner'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ScanLine } from 'lucide-react'
import { tenantDashboardPath } from '@/lib/org/tenant-path'

export default function EventCheckInPage() {
  const { activeOrganization } = useAuth()
  const slug = activeOrganization?.organization?.slug

  if (!activeOrganization) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <ScanLine className="h-6 w-6 text-blue-600" />
            Acreditación de eventos
          </h1>
          <p className="mt-1 text-muted-foreground">
            Escanea el QR del socio o introduce el código manualmente
          </p>
        </div>
        {slug && (
          <Button variant="outline" size="sm" asChild>
            <Link href={tenantDashboardPath(slug, 'events')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Eventos
            </Link>
          </Button>
        )}
      </div>

      <CheckInScanner organizationId={activeOrganization.organization_id} />
    </div>
  )
}
