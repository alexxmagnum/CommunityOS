'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { SlotPicker } from '@/components/member/slot-picker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Flag, UtensilsCrossed } from 'lucide-react'
import { labelReservationStatus } from '@/lib/i18n/es'
import { generateDaySlots, generateDemoSlots, type AvailableSlot } from '@/lib/reservations/availability'
import { parseBookingConfig, isDateBookable } from '@/lib/reservations/booking-config'
import { createReservation } from '@/lib/reservations/create-reservation'
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
  const [spaces, setSpaces] = useState<any[]>([])
  const [restaurant, setRestaurant] = useState<any>(null)
  const [myReservations, setMyReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [form, setForm] = useState({
    facility_id: facilityParam || '',
    space_id: '',
    date: '',
    party_size: '2',
    notes: '',
  })

  const selectedFacility = facilities.find((f) => f.id === form.facility_id)
  const selectedSpace = spaces.find((s) => s.id === form.space_id)
  const bookingConfig = isRestaurant
    ? selectedSpace?.booking_config || restaurant?.reservation_config
    : selectedFacility?.booking_config

  async function loadReservations() {
    if (!user || demoMode) return
    const supabase = getSupabaseClient()
    const { data: res } = await supabase
      .from('reservations')
      .select('*, facility:facilities(name), restaurant:restaurants(name), space:spaces(name)')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setMyReservations(res || [])
  }

  useEffect(() => {
    async function load() {
      if (demoMode) {
        const { DEMO_FACILITIES } = await import('@/lib/org/demo-tenant')
        setFacilities(DEMO_FACILITIES)
        setRestaurant({ id: 'demo-restaurant', name: 'Terraza', reservation_config: {} })
        setSpaces([{ id: 'demo-terrace', name: 'Terraza', type: 'terrace', booking_config: {} }])
        setLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      const { data: facs } = await supabase
        .from('facilities')
        .select('id, name, booking_config, sport:sports(display_name)')
        .eq('organization_id', org.id)
        .eq('is_active', true)
      setFacilities((facs || []).map((f) => ({
        ...f,
        sport: Array.isArray(f.sport) ? f.sport[0] : f.sport,
      })))

      const { data: rest } = await supabase
        .from('restaurants')
        .select('id, name, reservation_config')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      setRestaurant(rest)

      const { data: spaceRows } = await supabase
        .from('spaces')
        .select('id, name, type, booking_config')
        .eq('organization_id', org.id)
        .eq('is_active', true)
        .eq('is_bookable', true)
        .in('type', ['terrace', 'restaurant', 'private_room'])
      setSpaces(spaceRows || [])

      await loadReservations()
      setLoading(false)
    }
    load()
  }, [user, org.id, demoMode])

  useEffect(() => {
    if (facilityParam) setForm((f) => ({ ...f, facility_id: facilityParam }))
    else if (sportParam && facilities.length) {
      const match = facilities.find((f) => f.sport?.name === sportParam)
      if (match) setForm((f) => ({ ...f, facility_id: match.id }))
    }
  }, [facilityParam, sportParam, facilities])

  useEffect(() => {
    setSelectedSlot(null)
    if (!form.date) {
      setSlots([])
      return
    }

    const config = parseBookingConfig(bookingConfig)
    if (!isDateBookable(form.date, config)) {
      setSlots([])
      return
    }

    async function loadSlots() {
      setSlotsLoading(true)
      if (demoMode) {
        setSlots(generateDemoSlots(form.date))
        setSlotsLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      let query = supabase
        .from('reservations')
        .select('start_time, end_time, status')
        .eq('organization_id', org.id)
        .eq('reserved_date', form.date)
        .in('status', ['pending', 'confirmed'])

      if (isRestaurant && restaurant?.id) {
        query = query.eq('restaurant_id', restaurant.id)
        if (form.space_id) query = query.eq('space_id', form.space_id)
      } else if (form.facility_id) {
        query = query.eq('facility_id', form.facility_id)
      }

      const { data: existing } = await query
      setSlots(generateDaySlots(form.date, bookingConfig, existing || []))
      setSlotsLoading(false)
    }

    loadSlots()
  }, [form.date, form.facility_id, form.space_id, bookingConfig, demoMode, isRestaurant, org.id, restaurant?.id])

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
    if (!form.date || !selectedSlot) {
      toast.error('Selecciona fecha y horario')
      return
    }

    setSubmitting(true)
    const supabase = getSupabaseClient()
    const result = await createReservation(supabase, {
      organizationId: org.id,
      userId: user.id,
      reservationType: isRestaurant ? (form.space_id ? 'space' : 'restaurant') : 'facility',
      facilityId: !isRestaurant ? form.facility_id : undefined,
      restaurantId: isRestaurant ? restaurant?.id : undefined,
      spaceId: isRestaurant && form.space_id ? form.space_id : undefined,
      date: form.date,
      startIso: selectedSlot.startIso,
      endIso: selectedSlot.endIso,
      partySize: parseInt(form.party_size, 10),
      notes: form.notes || undefined,
      bookingConfig,
    })

    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success(`Reserva solicitada · ${(result.data as { reference_code?: string })?.reference_code ?? ''}`)
      await loadReservations()
      setForm((f) => ({ ...f, notes: '' }))
      setSelectedSlot(null)
    }
    setSubmitting(false)
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const minDate = new Date().toISOString().slice(0, 10)

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
        <form onSubmit={handleBook} className="max-w-lg space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
                <option key={f.id} value={f.id}>
                  {f.name} {f.sport?.display_name ? `(${f.sport.display_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" min={minDate} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </div>
          {form.date && form.facility_id && (
            <div className="space-y-2">
              <Label>Horario disponible</Label>
              <SlotPicker slots={slots} value={selectedSlot?.id ?? null} onChange={setSelectedSlot} loading={slotsLoading} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Personas</Label>
            <Input type="number" min={1} max={8} value={form.party_size} onChange={(e) => setForm((f) => ({ ...f, party_size: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Input placeholder="Opcional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button type="submit" variant="ghost" disabled={submitting || !selectedSlot} className="btn-motanos w-full">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reservar instalación
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="restaurant" className="mt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Mesa en {restaurant?.name || 'restaurante'} · terraza y salón
          </p>
          <Link href={path('/carta')} className="shrink-0 text-sm font-medium text-motanos">
            Ver carta →
          </Link>
        </div>
        <form onSubmit={handleBook} className="max-w-lg space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {spaces.length > 0 && (
            <div className="space-y-2">
              <Label>Zona</Label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.space_id}
                onChange={(e) => setForm((f) => ({ ...f, space_id: e.target.value }))}
              >
                <option value="">Cualquier zona</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" min={minDate} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
          </div>
          {form.date && (
            <div className="space-y-2">
              <Label>Horario disponible</Label>
              <SlotPicker slots={slots} value={selectedSlot?.id ?? null} onChange={setSelectedSlot} loading={slotsLoading} />
            </div>
          )}
          <div className="space-y-2">
            <Label>Comensales</Label>
            <Input type="number" min={1} max={12} value={form.party_size} onChange={(e) => setForm((f) => ({ ...f, party_size: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Preferencias</Label>
            <Input placeholder="Terraza, cumpleaños, alergias..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <Button type="submit" variant="ghost" disabled={submitting || !selectedSlot} className="btn-motanos w-full">
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
              <p className="font-medium">{r.facility?.name || r.space?.name || r.restaurant?.name || 'Reserva'}</p>
              <p className="text-sm text-muted-foreground">
                {r.reserved_date}
                {r.start_time && ` · ${new Date(r.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                {' · '}{r.reference_code}
              </p>
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
        <p className="mt-3 text-muted-foreground">Tee times, pistas y mesa en terraza — elige un hueco libre.</p>
        <Suspense fallback={<Loader2 className="mx-auto mt-8 h-8 w-8 animate-spin" />}>
          <ReservationsContent />
        </Suspense>
      </div>
    </>
  )
}
