'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { getDemoIntegrations, type IntegrationConfig } from '@/lib/integrations/catalog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plug, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function IntegrationsPage() {
  const { activeOrganization } = useAuth()
  const [items, setItems] = useState<IntegrationConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!activeOrganization) return

      if (!isSupabaseConfigured()) {
        setItems(getDemoIntegrations())
        setLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from('organization_settings')
        .select('key, value, updated_at')
        .eq('organization_id', activeOrganization.organization_id)
        .like('key', 'integration_%')

      const connected = new Map(
        (data ?? []).map((row) => [row.key.replace('integration_', ''), row])
      )

      setItems(
        getDemoIntegrations().map((item) => {
          const row = connected.get(item.provider)
          const value = row?.value as { connected?: boolean } | null
          return {
            ...item,
            connected: Boolean(value?.connected),
            lastSyncAt: row?.updated_at ?? null,
          }
        })
      )
      setLoading(false)
    }

    load()
  }, [activeOrganization])

  async function toggle(provider: IntegrationConfig['provider'], connect: boolean) {
    if (!activeOrganization) return

    if (!isSupabaseConfigured()) {
      setItems((prev) =>
        prev.map((i) => (i.provider === provider ? { ...i, connected: connect } : i))
      )
      toast.success(connect ? 'Conectado (demo)' : 'Desconectado (demo)')
      return
    }

    const supabase = getSupabaseClient()
    const key = `integration_${provider}`
    const { data: existing } = await supabase
      .from('organization_settings')
      .select('id')
      .eq('organization_id', activeOrganization.organization_id)
      .eq('key', key)
      .maybeSingle()

    const value = { connected: connect, provider }

    if (existing?.id) {
      await supabase
        .from('organization_settings')
        .update({ value: value as never, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('organization_settings').insert({
        organization_id: activeOrganization.organization_id,
        key,
        value: value as never,
      })
    }

    setItems((prev) =>
      prev.map((i) =>
        i.provider === provider
          ? { ...i, connected: connect, lastSyncAt: new Date().toISOString() }
          : i
      )
    )
    toast.success(connect ? 'Integración conectada' : 'Integración desconectada')
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Plug className="h-6 w-6 text-violet-600" />
          Integraciones
        </h1>
        <p className="mt-1 text-slate-500">Conecta herramientas externas con tu club</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.provider}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
                <Badge variant={item.connected ? 'default' : 'secondary'}>
                  {item.connected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              {item.lastSyncAt && (
                <p className="text-xs text-muted-foreground">
                  Última sincronización: {new Date(item.lastSyncAt).toLocaleString('es-ES')}
                </p>
              )}
              <div className="ml-auto flex gap-2">
                {item.connected && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => toast.info('Sincronización manual — próximamente')}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sincronizar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={item.connected ? 'outline' : 'default'}
                  onClick={() => toggle(item.provider, !item.connected)}
                >
                  {item.connected ? 'Desconectar' : 'Conectar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
