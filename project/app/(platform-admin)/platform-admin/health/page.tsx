'use client'

import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import { DEMO_PLATFORM_HEALTH, type PlatformHealthStats } from '@/lib/platform/demo-health-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Building2, CalendarCheck, AlertTriangle } from 'lucide-react'
import { labelTier } from '@/lib/i18n/es'

export default function PlatformHealthPage() {
  const [stats, setStats] = useState<PlatformHealthStats>(DEMO_PLATFORM_HEALTH)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured()) {
        setStats(DEMO_PLATFORM_HEALTH)
        setLoading(false)
        return
      }

      try {
        const supabase = getSupabaseClient()
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const [orgsTotal, orgsActive, reservationsToday, eventsLive, tiers] = await Promise.all([
          supabase.from('organizations').select('*', { count: 'exact', head: true }),
          supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
          supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabase.from('organizations').select('subscription_tier'),
        ])

        const tierBreakdown = { trial: 0, starter: 0, professional: 0, enterprise: 0 }
        for (const row of tiers.data ?? []) {
          const t = row.subscription_tier as keyof typeof tierBreakdown
          if (t in tierBreakdown) tierBreakdown[t]++
        }

        setStats({
          organizationsTotal: orgsTotal.count ?? 0,
          organizationsActive: orgsActive.count ?? 0,
          reservationsToday: reservationsToday.count ?? 0,
          eventsLive: eventsLive.count ?? 0,
          errorRatePercent: 0,
          tierBreakdown,
          generatedAt: new Date().toISOString(),
        })
      } catch {
        setStats(DEMO_PLATFORM_HEALTH)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    )
  }

  const cards = [
    { label: 'Orgs activas', value: stats.organizationsActive, sub: `de ${stats.organizationsTotal}`, icon: Building2 },
    { label: 'Reservas hoy', value: stats.reservationsToday, icon: CalendarCheck },
    { label: 'Eventos publicados', value: stats.eventsLive, icon: Activity },
    { label: 'Tasa de error', value: `${stats.errorRatePercent}%`, icon: AlertTriangle },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Salud de plataforma</h1>
        <p className="mt-1 text-slate-500">
          Métricas operativas · actualizado {new Date(stats.generatedAt).toLocaleString('es-ES')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribución por plan</CardTitle>
          <CardDescription>Organizaciones por tier de suscripción</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {Object.entries(stats.tierBreakdown).map(([tier, count]) => (
            <div key={tier} className="rounded-lg border p-4 text-center">
              <p className="text-2xl font-semibold">{count}</p>
              <p className="text-sm capitalize text-muted-foreground">{labelTier(tier)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
