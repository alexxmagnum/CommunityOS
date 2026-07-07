'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { RegistrationQr } from '@/components/events/registration-qr'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { labelEventType } from '@/lib/i18n/es'
import { formatEventDate } from '@/lib/format/dates'
import { DEMO_TOURNAMENT_ID } from '@/lib/tournaments/demo-tournament'
import { LiveSpotsBadge } from '@/components/events/live-spots-badge'
import { useRealtimeSpots } from '@/hooks/use-realtime-spots'
import { Check, Clock, Loader2, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function TenantEventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { org, demoMode, path, events: tenantEvents } = useTenant()
  const { user } = useAuth()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [registered, setRegistered] = useState(false)
  const [waitlisted, setWaitlisted] = useState(false)
  const [checkInToken, setCheckInToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const liveSpots = useRealtimeSpots(id, event?.available_spots ?? null, demoMode)

  useEffect(() => {
    async function load() {
      if (demoMode || id.startsWith('demo-')) {
        const match = tenantEvents.find((e) => e.id === id)
        setEvent(match || null)
        setLoading(false)
        return
      }

      const supabase = getSupabaseClient()
      const { data: eventData } = await supabase.from('events').select('*').eq('id', id).eq('organization_id', org.id).maybeSingle()
      setEvent(eventData)

      if (user && eventData) {
        const { data: reg } = await supabase.from('event_participants')
          .select('id, check_in_token').eq('event_id', id).eq('user_id', user.id).maybeSingle()
        setRegistered(!!reg)
        setCheckInToken(reg?.check_in_token ?? null)

        const { data: wait } = await supabase.from('event_waitlist')
          .select('id').eq('event_id', id).eq('user_id', user.id).maybeSingle()
        setWaitlisted(!!wait)
      }
      setLoading(false)
    }
    load()
  }, [id, user, org.id, demoMode, tenantEvents])

  async function handleRegister() {
    if (demoMode) {
      setRegistered(true)
      setCheckInToken('demo-checkin-' + id)
      toast.success('Inscripción demo confirmada')
      return
    }
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path(`/events/${id}`))}`)
      return
    }
    if (!event) return

    setRegistering(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.from('event_participants').insert({
      organization_id: org.id,
      event_id: event.id,
      user_id: user.id,
      status: 'registered',
    }).select('check_in_token').single()

    if (error) {
      toast.error(error.message)
    } else {
      if (event.available_spots != null && event.available_spots > 0) {
        await supabase.from('events').update({ available_spots: event.available_spots - 1 }).eq('id', event.id)
      }
      await supabase.from('activity_feed').insert({
        organization_id: org.id,
        user_id: user.id,
        activity_type: 'event_join',
        title: `${user.email?.split('@')[0]} se apuntó a ${event.title}`,
        is_public: true,
      })
      setRegistered(true)
      setCheckInToken(data?.check_in_token ?? null)
      toast.success('Inscripción confirmada')
    }
    setRegistering(false)
  }

  async function handleWaitlist() {
    if (demoMode) {
      setWaitlisted(true)
      toast.success('Añadido a lista de espera (demo)')
      return
    }
    if (!user) {
      router.push(`/auth/login?redirect=${encodeURIComponent(path(`/events/${id}`))}`)
      return
    }
    if (!event) return

    setRegistering(true)
    const supabase = getSupabaseClient()
    const { error } = await supabase.from('event_waitlist').insert({
      organization_id: org.id,
      event_id: event.id,
      user_id: user.id,
    })

    if (error) toast.error(error.message)
    else {
      setWaitlisted(true)
      toast.success('Estás en la lista de espera')
    }
    setRegistering(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!event) {
    return (
      <>
        <MemberHeader />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p>Experiencia no encontrada</p>
          <Link href={path('/events')} className="mt-4 inline-block text-sm text-motanos">← Volver</Link>
        </div>
      </>
    )
  }

  const soldOut = liveSpots === 0
  const isTournament = event.type === 'tournament'

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href={path('/events')} className="text-sm text-muted-foreground hover:text-foreground">← Experiencias</Link>
        {event.cover_image_url && (
          <div className="mt-6 aspect-[21/9] overflow-hidden rounded-2xl">
            <img src={event.cover_image_url} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <Badge className="mt-6">{labelEventType(event.type)}</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{event.title}</h1>
        {event.description && <p className="mt-4 leading-relaxed text-muted-foreground">{event.description}</p>}

        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatEventDate(event.starts_at)}</div>
          {event.location_details && <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{event.location_details}</div>}
          {event.capacity != null && (
            <div className="flex items-center gap-2"><Users className="h-4 w-4" />{liveSpots ?? event.available_spots}/{event.capacity} plazas</div>
          )}
          {event.capacity == null && liveSpots != null && (
            <LiveSpotsBadge spots={liveSpots} className="mt-1" />
          )}
        </div>

        {isTournament && (
          <Link href={path(`/tournaments/${demoMode ? DEMO_TOURNAMENT_ID : DEMO_TOURNAMENT_ID}`)} className="mt-4 inline-block text-sm font-medium text-motanos hover:underline">
            Ver bracket del torneo →
          </Link>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-2xl font-semibold text-motanos">
            {event.price > 0 ? `${event.price} €` : 'Incluido'}
          </span>
          {registered ? (
            <Button disabled variant="secondary"><Check className="mr-2 h-4 w-4" /> Inscrito</Button>
          ) : waitlisted ? (
            <Button disabled variant="secondary">En lista de espera</Button>
          ) : soldOut ? (
            <Button variant="ghost" className="btn-motanos" disabled={registering} onClick={handleWaitlist}>
              {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unirme a lista de espera
            </Button>
          ) : (
            <Button variant="ghost" disabled={registering} className="btn-motanos" onClick={handleRegister}>
              {registering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Participar
            </Button>
          )}
        </div>

        {registered && checkInToken && (
          <div className="mt-8">
            <RegistrationQr token={checkInToken} eventTitle={event.title} />
          </div>
        )}
      </div>
    </>
  )
}
