'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale, useLabels } from '@/contexts/LocaleContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Calendar,
  Utensils,
  Trophy,
  TrendingUp,
  Clock,
  MapPin,
  ArrowUpRight,
  Activity
} from 'lucide-react'
import { localizeActivity, localizeEvent } from '@/lib/i18n/content'

interface DashboardStats {
  todayEvents: number
  upcomingEvents: number
  totalMembers: number
  activeMembers: number
  todayReservations: number
  activeTournaments: number
  recentActivities: any[]
  todaySchedule: any[]
}

export default function OrgDashboard() {
  const { activeOrganization } = useAuth()
  const { locale } = useLocale()
  const { labelEventType, labelActivityType } = useLabels()
  const [stats, setStats] = useState<DashboardStats>({
    todayEvents: 0,
    upcomingEvents: 0,
    totalMembers: 0,
    activeMembers: 0,
    todayReservations: 0,
    activeTournaments: 0,
    recentActivities: [],
    todaySchedule: [],
  })
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    async function loadDashboard() {
      if (!activeOrganization) return

      try {
        const orgId = activeOrganization.organization_id
        const today = new Date().toISOString().split('T')[0]
        const todayStart = `${today}T00:00:00`
        const todayEnd = `${today}T23:59:59`

        const { count: todayEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('starts_at', todayStart)
          .lte('starts_at', todayEnd)
          .eq('status', 'published')

        const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        const { count: upcomingEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('starts_at', todayStart)
          .lte('starts_at', `${weekEnd}T23:59:59`)
          .eq('status', 'published')

        const { count: totalMembers } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)

        const { count: activeMembers } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('status', 'active')
        const { count: todayReservations } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('reserved_date', today)
          .in('status', ['pending', 'confirmed'])

        // Get active tournaments
        const { count: activeTournaments } = await supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['registration', 'check_in', 'in_progress'])

        // Get recent activity
        const { data: recentActivities } = await supabase
          .from('activity_feed')
          .select('id, title, description, activity_type, created_at')
          .eq('organization_id', orgId)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(5)

        const { data: todaySchedule } = await supabase
          .from('events')
          .select('id, title, starts_at, type, cover_image_url')
          .eq('organization_id', orgId)
          .gte('starts_at', todayStart)
          .lte('starts_at', todayEnd)
          .eq('status', 'published')
          .order('starts_at', { ascending: true })

        setStats({
          todayEvents: todayEvents || 0,
          upcomingEvents: upcomingEvents || 0,
          totalMembers: totalMembers || 0,
          activeMembers: activeMembers || 0,
          todayReservations: todayReservations || 0,
          activeTournaments: activeTournaments || 0,
          recentActivities: (recentActivities || []).map((a) => localizeActivity(locale, a)),
          todaySchedule: (todaySchedule || []).map((e) => localizeEvent(locale, e)),
        })
      } catch (error) {
        console.error('Error loading dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [activeOrganization, locale])

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
        <h1 className="text-2xl font-semibold tracking-tight">
          {getTimeOfDay()}, {activeOrganization?.organization?.name}
        </h1>
        <p className="text-slate-500 mt-1">Esto es lo que ocurre hoy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Eventos de hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.todayEvents}</div>
            <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">
              {stats.upcomingEvents} próximos esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Miembros</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeMembers}</div>
            <p className="text-sm text-slate-500 mt-1">
              {stats.totalMembers - stats.activeMembers} inactivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Reservas de hoy</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.todayReservations}</div>
            <p className="text-sm text-slate-500 mt-1">
              Restaurante e instalaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Torneos activos</CardTitle>
            <Trophy className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeTournaments}</div>
            <p className="text-sm text-slate-500 mt-1">
              En curso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Agenda de hoy
            </CardTitle>
            <CardDescription>Eventos programados para hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.todaySchedule.length > 0 ? (
                stats.todaySchedule.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-4">
                    <div className="w-12 text-center text-sm">
                      <span className="font-medium">
                        {new Date(event.starts_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{labelEventType(event.type)}</Badge>
                        <span className="font-medium">{event.title}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No hay eventos programados hoy
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" />
              Actividad reciente
            </CardTitle>
            <CardDescription>Lo último en tu comunidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-slate-500">
                        {activity.description || labelActivityType(activity.activity_type)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(activity.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Sin actividad reciente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Calendar className="h-8 w-8 text-blue-600 mb-2" />
              <span className="font-medium">Crear evento</span>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Utensils className="h-8 w-8 text-orange-600 mb-2" />
              <span className="font-medium">Añadir plato</span>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Trophy className="h-8 w-8 text-amber-600 mb-2" />
              <span className="font-medium">Nuevo torneo</span>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <span className="font-medium">Invitar miembro</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}
