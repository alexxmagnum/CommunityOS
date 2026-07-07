'use client'

import Link from 'next/link'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { formatEventDate } from '@/lib/format/dates'
import { labelEventType } from '@/lib/i18n/es'
import { Calendar, Clock } from 'lucide-react'

export default function TenantEventsPage() {
  const { org, events, path } = useTenant()

  return (
    <>
      <MemberHeader />
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <p className="label-caps">Agenda del club</p>
        <h1 className="font-display mt-2 text-4xl text-[color:var(--org-primary)] md:text-5xl">Experiencias</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Torneos, catas, brunch y eventos exclusivos para socios de {org.name}.
        </p>

        {events.length === 0 ? (
          <div className="card-premium mt-12 p-12 text-center text-muted-foreground">
            No hay experiencias publicadas. Vuelve pronto.
          </div>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} href={path(`/events/${event.id}`)} className="card-premium group overflow-hidden">
                <div className="relative aspect-[16/10] bg-muted">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Calendar className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-cyan-400/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#35cfff]">
                    {labelEventType(event.type)}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl text-foreground group-hover:underline">{event.title}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />{formatEventDate(event.starts_at)}
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="font-semibold text-motanos">
                      {event.price > 0 ? `${event.price} €` : 'Socios'}
                    </span>
                    {event.available_spots != null && (
                      <span className="text-muted-foreground">
                        {event.available_spots > 0 ? `${event.available_spots} plazas` : 'Agotado'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
