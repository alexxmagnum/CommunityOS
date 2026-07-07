'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Flag, UtensilsCrossed } from 'lucide-react'
import { labelReservationStatus } from '@/lib/i18n/es'
import { toast } from 'sonner'

function ReservationsContent() {
  const { user } = useAuth()
  const { org, demoMode, path } = useTenant()
  const searchParams = useSearchParams()
  const router = useRouter()

  const typeParam = searchParams.get('type')
  const facilityParam = searchParams.get('facility')
  const sportParam = searchParams.get('sport')
  const isRestaurant = typeParam === 'restaurant'

  const [facilities, setFacilities] = useState<any[]>([])
  const [restaurant, setRestaurant] = useState<any>(null)
  const [myReservations, setMyReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    facility_id: facilityParam || '',
    date: '',
    time: '',
    party_size: '2',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      if (demoMode) {
        const { DEMO_FACILITIES } = await import('@/lib/org/demo-tenant')
        setFacilities(DEMO_FACILITIES)
        setRestaurant({ id: 'demo-restaurant', name: 'Terraza' })
        setLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      const { data: facs } = await supabase.from('facilities')
        .select('id, name, sport:sports(display_name)')
        .eq('organization_id', org.id).eq('is_active', true)
      setFacilities((facs || []).map((f) => ({
        ...f,
        sport: Array.isArray(f.sport) ? f.sport[0] : f.sport,
      })))

      const { data: rest } = await supabase.from('restaurants')
        .select('id, name').eq('organization_id', org.id).eq('is_active', true).limit(1).maybeSingle()
      setRestaurant(rest)

      if (user) {
        const { data: res } = await supabase.from('reservations')
          .select('*, facility:facilities(name), restaurant:restaurants(name)')
          .eq('organization_id', org.id).eq('user_id', user.id)
          .order('created_at', { ascending: false }).limit(20)
        setMyReservations(res || [])
      }
      setLoading(false)
    }
    load()
  }, [user, org.id, demoMode])

  useEffect(() => {
    if (facilityParam) {
      setForm((f) => ({ ...f, facility_id: facilityParam }))
      return
    }
    if (sportParam && facilities.length) {
      const match = facilities.find((f) => f.sport?.name === sportParam)
      if (match) setForm((f) => ({ ...f, facility_id: match.id }))
    }
  }, [facilityParam, sportParam, facilities])

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path('/reservations'))}`)
      return
    }
    if (demoMode) {
      toast.info('Conecta Supabase para reservas reales')
      return
    }
    if (!form.date || !form.time) {
      toast.error('Indica fecha y hora')
      return
    }

    setSubmitting(true)
    const supabase = getSupabaseClient()
    const startTime = `${form.date}T${form.time}:00`

    if (!isRestaurant && !form.facility_id) {
      toast.error('Selecciona una instalación')
      setSubmitting(false)
      return
    }

    const { error } = isRestaurant
      ? await supabase.from('reservations').insert({
          organization_id: org.id,
          user_id: user.id,
          reservation_type: 'restaurant',
          restaurant_id: restaurant?.id,
          reserved_date: form.date,
          start_time: startTime,
          party_size: parseInt(form.party_size),
          special_requests: form.notes || null,
          status: 'pending',
        })
      : await supabase.from('reservations').insert({
          organization_id: org.id,
          user_id: user.id,
          reservation_type: 'facility',
          facility_id: form.facility_id,
          reserved_date: form.date,
          start_time: startTime,
          party_size: parseInt(form.party_size),
          special_requests: form.notes || null,
          status: 'pending',
        })

    if (error) {
      toast.error(error.message)
    } else {
      await supabase.from('activity_feed').insert({
        organization_id: org.id,
        user_id: user.id,
        activity_type: 'reservation',
        title: isRestaurant ? 'Reserva de mesa confirmada' : 'Nueva reserva de instalación',
        description: `${form.date} · ${form.party_size} personas`,
        is_public: true,
      })
      toast.success('Reserva solicitada')
      const { data: res } = await supabase.from('reservations')
        .select('*, facility:facilities(name), restaurant:restaurants(name)')
        .eq('organization_id', org.id).eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(20)
      setMyReservations(res || [])
      setForm((f) => ({ ...f, notes: '' }))
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <Tabs defaultValue={isRestaurant ? 'restaurant' : 'facility'} key={isRestaurant ? 'restaurant' : 'facility'} className="mt-8">
      <TabsList>
        <TabsTrigger value="facility" onClick={() => router.replace(path('/reservations'))}>
          <Flag className="mr-2 h-4 w-4" /> Golf & deporte
        </TabsTrigger>
        <TabsTrigger value="restaurant" onClick={() => router.replace(path('/reservations?type=restaurant'))}>
          <UtensilsCrossed className="mr-2 h-4 w-4" /> Restaurante
        </TabsTrigger>
        <TabsTrigger value="mine">Mis reservas ({myReservations.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="facility" className="mt-6">
        <form onSubmit={handleBook} className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label>Instalación</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.facility_id}
              onChange={(e) => setForm((f) => ({ ...f, facility_id: e.target.value }))}
              required
            >
              <option value="">Seleccionar...</option>
              {facilities.filter((f) => f.sport).map((f) => (
                <option key={f.id} value={f.id}>{f.name} {f.sport?.display_name ? `(${f.sport.display_name})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Personas</Label>
            <Input type="number" min={1} max={8} value={form.party_size} onChange={(e) => setForm((f) => ({ ...f, party_size: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Input placeholder="Opcional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button type="submit" variant="ghost" disabled={submitting} className="btn-motanos w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reservar instalación
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="restaurant" className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mesa en {restaurant?.name || 'restaurante'} · terraza y eventos gastronómicos
          </p>
          <Link href={path('/carta')} className="shrink-0 text-sm font-medium text-motanos">
            Ver carta →
          </Link>
        </div>
        <form onSubmit={handleBook} className="max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Comensales</Label>
            <Input type="number" min={1} max={12} value={form.party_size} onChange={(e) => setForm((f) => ({ ...f, party_size: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Preferencias</Label>
            <Input placeholder="Terraza, cumpleaños, alergias..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button type="submit" variant="ghost" disabled={submitting} className="btn-motanos w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reservar mesa
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="mine" className="mt-6 space-y-3">
        {myReservations.length === 0 ? (
          <p className="text-muted-foreground">No tienes reservas aún.</p>
        ) : myReservations.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div>
              <p className="font-medium">{r.facility?.name || r.restaurant?.name || 'Reserva'}</p>
              <p className="text-sm text-muted-foreground">{r.reserved_date} · {r.reference_code}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">{labelReservationStatus(r.status)}</span>
          </div>
        ))}
      </TabsContent>

      {!user && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href={`/auth/login?redirect=${encodeURIComponent(path('/reservations'))}`} className="text-motanos">
            Inicia sesión
          </Link>{' '}para reservar
        </p>
      )}
    </Tabs>
  )
}

export default function TenantReservationsPage() {
  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <p className="label-caps">Reservas</p>
        <h1 className="font-display mt-2 text-4xl text-[color:var(--org-primary)]">Tu próxima visita</h1>
        <p className="mt-3 text-muted-foreground">Tee times, pistas y mesa en terraza — reserva en segundos.</p>
        <Suspense fallback={<Loader2 className="mx-auto mt-8 h-8 w-8 animate-spin" />}>
          <ReservationsContent />
        </Suspense>
      </div>
    </>
  )
}
