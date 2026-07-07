'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  Users,
  Calendar,
  ArrowUpRight,
  Activity
} from 'lucide-react'
import { labelTier } from '@/lib/i18n/es'

interface Stats {
  totalOrganizations: number
  activeOrganizations: number
  trialOrganizations: number
  totalUsers: number
  activeUsers: number
  totalEvents: number
  activeEvents: number
}

export default function PlatformAdminDashboard() {
  const { platformAdmin } = useAuth()
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    trialOrganizations: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalEvents: 0,
    activeEvents: 0,
  })
  const [recentOrganizations, setRecentOrganizations] = useState<any[]>([])
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function loadStats() {
      try {
        // Get organization stats
        const { count: totalOrgs } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })

        const { count: activeOrgs } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)

        const { count: trialOrgs } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('subscription_tier', 'trial')

        // Get user stats
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const { count: activeUsers } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // Get event stats
        const { count: totalEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })

        const { count: activeEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')

        setStats({
          totalOrganizations: totalOrgs || 0,
          activeOrganizations: activeOrgs || 0,
          trialOrganizations: trialOrgs || 0,
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalEvents: totalEvents || 0,
          activeEvents: activeEvents || 0,
        })

        // Get recent organizations
        const { data: recentOrgs } = await supabase
          .from('organizations')
          .select('id, name, slug, subscription_tier, is_active, created_at')
          .order('created_at', { ascending: false })
          .limit(5)

        const { data: allOrgs } = await supabase.from('organizations').select('subscription_tier')
        const counts: Record<string, number> = { trial: 0, starter: 0, professional: 0, enterprise: 0 }
        ;(allOrgs || []).forEach((o) => { counts[o.subscription_tier] = (counts[o.subscription_tier] || 0) + 1 })

        setRecentOrganizations(recentOrgs || [])
        setTierCounts(counts)
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Resumen de la plataforma</h1>
        <p className="text-slate-500 mt-1">Supervisa y gestiona todas las organizaciones en Community OS</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Organizaciones totales</CardTitle>
            <Building2 className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrganizations}</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {stats.activeOrganizations}
              </span>
              <span className="text-slate-400">activas</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Usuarios de la plataforma</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-green-600 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                {stats.activeUsers}
              </span>
              <span className="text-slate-400">miembros activos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Eventos creados</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalEvents}</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-blue-600">{stats.activeEvents}</span>
              <span className="text-slate-400">publicados</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Cuentas de prueba</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.trialOrganizations}</div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-amber-600">En prueba</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de suscripciones</CardTitle>
            <CardDescription>Organizaciones por plan de suscripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {(['trial', 'starter', 'professional', 'enterprise'] as const).map((tier) => (
                <div key={tier}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{labelTier(tier)}</span>
                    <span className="text-sm text-slate-500">{tierCounts[tier] || 0}</span>
                  </div>
                  <Progress value={stats.totalOrganizations ? ((tierCounts[tier] || 0) / stats.totalOrganizations) * 100 : 0} className="mt-1 h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Organizations */}
        <Card>
          <CardHeader>
            <CardTitle>Organizaciones recientes</CardTitle>
            <CardDescription>Organizaciones más recientes en la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrganizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-xs text-slate-500">{org.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={org.is_active ? 'default' : 'secondary'}>
                      {labelTier(org.subscription_tier)}
                    </Badge>
                    <span className={`w-2 h-2 rounded-full ${org.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                </div>
              ))}
              {recentOrganizations.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Aún no hay organizaciones
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
