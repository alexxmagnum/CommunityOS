'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Building2, Shield } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { labelRole } from '@/lib/i18n/es'
import { useTenantDashboard } from '@/hooks/use-tenant-dashboard'

export default function SettingsPage() {
  const { activeOrganization, user, isOrgAdmin } = useAuth()
  const { dashboardPath } = useTenantDashboard()
  const org = activeOrganization?.organization

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2"><Settings className="h-6 w-6" />Configuración</h1>
        <p className="text-muted-foreground mt-1">Ajustes de la organización</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Organización</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Nombre</span><span className="font-medium">{org?.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Identificador URL</span><code className="text-xs bg-muted px-2 py-0.5 rounded">{org?.slug}</code></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tu rol</span><Badge>{labelRole(activeOrganization?.role?.name, activeOrganization?.role?.display_name)}</Badge></div>
          {isOrgAdmin() && (
            <Link href={dashboardPath('branding')}><Button variant="outline" size="sm" className="mt-2">Editar marca →</Button></Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Cuenta</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Correo</span><span>{user?.email}</span></div>
          <Link href="/profile"><Button variant="outline" size="sm">Ver perfil de miembro</Button></Link>
        </CardContent>
      </Card>
    </div>
  )
}
