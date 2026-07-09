'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSupabaseClient } from '@/lib/supabase/client'
import { updateReservationStatus } from '@/lib/reservations/create-reservation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarCheck, Loader2 } from 'lucide-react'
import { labelReservationStatus, labelReservationType } from '@/lib/i18n/es'
import { toast } from 'sonner'

interface ReservationRow {
  id: string
  reference_code: string
  reservation_type: string
  reserved_date: string | null
  start_time: string | null
  party_size: number
  status: string
  user_id: string | null
  facility: { name: string } | null
  restaurant: { name: string } | null
  space: { name: string } | null
  profile: { full_name: string | null } | null
}

export default function AdminReservationsPage() {
  const { activeOrganization } = useAuth()
  const [rows, setRows] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  async function load() {
    if (!activeOrganization) return
    const orgId = activeOrganization.organization_id

    let query = supabase
      .from('reservations')
      .select(`
        id, reference_code, reservation_type, reserved_date, start_time,
        party_size, status, user_id,
        facility:facilities(name),
        restaurant:restaurants(name),
        space:spaces(name)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') query = query.eq('status', filter)

    const { data } = await query

    const enriched = await Promise.all((data || []).map(async (r) => {
      let profile = null
      if (r.user_id) {
        const { data: p } = await supabase.from('profiles').select('full_name').eq('user_id', r.user_id).maybeSingle()
        profile = p
      }
      return {
        ...r,
        facility: Array.isArray(r.facility) ? r.facility[0] : r.facility,
        restaurant: Array.isArray(r.restaurant) ? r.restaurant[0] : r.restaurant,
        space: Array.isArray(r.space) ? r.space[0] : r.space,
        profile,
      } as ReservationRow
    }))

    setRows(enriched)
    setLoading(false)
  }

  useEffect(() => { load() }, [activeOrganization, filter])

  async function changeStatus(row: ReservationRow, status: 'confirmed' | 'cancelled' | 'completed' | 'no_show') {
    if (!activeOrganization || !row.user_id) return
    setUpdating(row.id)
    const { error } = await updateReservationStatus(
      supabase,
      row.id,
      activeOrganization.organization_id,
      row.user_id,
      status,
      row.reference_code
    )
    if (error) toast.error(error.message)
    else {
      toast.success('Reserva actualizada')
      load()
    }
    setUpdating(null)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-500" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CalendarCheck className="h-6 w-6 text-amber-600" />
            Reservas
          </h1>
          <p className="mt-1 text-muted-foreground">Gestiona solicitudes y confirmaciones</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="confirmed">Confirmadas</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay reservas</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {r.facility?.name || r.space?.name || r.restaurant?.name || labelReservationType(r.reservation_type)}
                    </p>
                    <Badge variant="outline">{r.reference_code}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.profile?.full_name || 'Miembro'} · {r.reserved_date}
                    {r.start_time && ` · ${new Date(r.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                    {' · '}{r.party_size} personas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{labelReservationStatus(r.status)}</Badge>
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" disabled={updating === r.id} onClick={() => changeStatus(r, 'confirmed')}>
                        Confirmar
                      </Button>
                      <Button size="sm" variant="outline" disabled={updating === r.id} onClick={() => changeStatus(r, 'cancelled')}>
                        Cancelar
                      </Button>
                    </>
                  )}
                  {r.status === 'confirmed' && (
                    <Button size="sm" variant="outline" disabled={updating === r.id} onClick={() => changeStatus(r, 'completed')}>
                      Completar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
