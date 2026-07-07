import { parseBookingConfig } from './booking-config'

export interface CreateReservationInput {
  organizationId: string
  userId: string
  reservationType: 'facility' | 'restaurant' | 'space'
  facilityId?: string
  restaurantId?: string
  spaceId?: string
  date: string
  startIso: string
  endIso: string
  partySize: number
  notes?: string
  bookingConfig?: unknown
}

async function notifyUser(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseClient>,
  input: { organizationId: string; userId: string; title: string; body: string; link?: string }
) {
  await supabase.from('notifications').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    type: 'reservation',
    title: input.title,
    body: input.body,
    link: input.link ?? null,
  })
}

async function notifyOrgAdmins(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseClient>,
  organizationId: string,
  title: string,
  body: string,
  link?: string
) {
  const { data: admins } = await supabase
    .from('organization_members')
    .select('user_id, role:roles(name)')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  const adminIds = (admins || [])
    .filter((m) => {
      const role = Array.isArray(m.role) ? m.role[0] : m.role
      return role?.name === 'org_owner' || role?.name === 'org_admin'
    })
    .map((m) => m.user_id)

  if (!adminIds.length) return

  await supabase.from('notifications').insert(
    adminIds.map((userId) => ({
      organization_id: organizationId,
      user_id: userId,
      type: 'reservation_admin',
      title,
      body,
      link: link ?? '/dashboard/reservations',
    })) as never
  )
}

export async function createReservation(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseClient>,
  input: CreateReservationInput
) {
  const config = parseBookingConfig(input.bookingConfig)
  const startTime = new Date(input.startIso)
  const endTime = new Date(input.endIso)

  const payload = {
    organization_id: input.organizationId,
    user_id: input.userId,
    reservation_type: input.reservationType,
    reference_code: '',
    reserved_date: input.date,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    party_size: input.partySize,
    special_requests: input.notes || null,
    status: 'pending' as const,
    total_amount: (config.price_per_hour / 60) * config.duration_minutes,
    currency: 'EUR',
  } as Record<string, unknown>

  if (input.facilityId) payload.facility_id = input.facilityId
  if (input.restaurantId) payload.restaurant_id = input.restaurantId
  if (input.spaceId) payload.space_id = input.spaceId

  const { data, error } = await supabase
    .from('reservations')
    .insert(payload as never)
    .select('id, reference_code, status')
    .single()

  if (error) return { error }

  await supabase.from('activity_feed').insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    activity_type: 'reservation',
    title: input.reservationType === 'restaurant' ? 'Nueva reserva de mesa' : 'Nueva reserva de instalación',
    description: `${input.date} · ${input.partySize} personas`,
    is_public: true,
  })

  await notifyUser(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    title: 'Reserva solicitada',
    body: `Tu reserva ${data.reference_code} está pendiente de confirmación.`,
    link: '/reservations',
  })

  await notifyOrgAdmins(
    supabase,
    input.organizationId,
    'Nueva reserva',
    `Reserva ${data.reference_code} — ${input.partySize} personas`,
    '/dashboard/reservations'
  )

  return { data, error: null }
}

export async function updateReservationStatus(
  supabase: ReturnType<typeof import('@/lib/supabase/client').getSupabaseClient>,
  reservationId: string,
  organizationId: string,
  userId: string,
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show',
  referenceCode: string
) {
  const patch: Record<string, unknown> = { status }
  if (status === 'confirmed') patch.confirmed_at = new Date().toISOString()
  if (status === 'cancelled') patch.cancelled_at = new Date().toISOString()

  const { error } = await supabase
    .from('reservations')
    .update(patch as never)
    .eq('id', reservationId)
    .eq('organization_id', organizationId)

  if (error) return { error }

  const labels: Record<string, string> = {
    confirmed: 'confirmada',
    cancelled: 'cancelada',
    completed: 'completada',
    no_show: 'marcada como no presentado',
  }

  await notifyUser(supabase, {
    organizationId,
    userId,
    title: 'Actualización de reserva',
    body: `Tu reserva ${referenceCode} ha sido ${labels[status]}.`,
    link: '/reservations',
  })

  return { error: null }
}
