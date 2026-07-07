'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTenant } from '@/contexts/TenantContext'
import { generateDiscoveryPrompts } from '@/lib/discovery/generate-prompts'
import { generatePersonalizedPrompts } from '@/lib/discovery/generate-personalized-prompts'
import { loadMemberProfile } from '@/lib/community/load-member-profile'
import { getTenantLogoUrl } from '@/lib/org/resolve-theme'
import { labelEventType } from '@/lib/i18n/es'
import { formatEventDate, formatRelativeTime } from '@/lib/format/dates'
import { MemberHeader } from '@/components/member/member-header'
import { IkonHero } from '@/components/member/ikon-hero'
import { DiscoveryFeed } from '@/components/member/discovery-feed'
import { EmptySection } from '@/components/member/empty-section'
import { ForYouSection } from '@/components/member/for-you-section'
import { Calendar, Clock, Flag, MapPin, Users, UtensilsCrossed } from 'lucide-react'

function todayLabel() {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

export function TenantHomePage() {
  const { org, events, facilities, activities, stats, demoMode, path } = useTenant()
  const { user } = useAuth()
  const isIkon = org.slug === 'ikon'
  const [forYouPrompts, setForYouPrompts] = useState<ReturnType<typeof generateDiscoveryPrompts>>([])

  const prompts = generateDiscoveryPrompts(events, facilities, demoMode).map((p) => ({
    ...p,
    href: path(p.href),
  }))

  useEffect(() => {
    if (!user) {
      setForYouPrompts([])
      return
    }
    loadMemberProfile(org.id, user.id, demoMode).then((profile) => {
      const personalized = generatePersonalizedPrompts(events, facilities, demoMode, {
        favoriteSports: profile.preferences.favorite_sports,
        favoriteDishes: profile.preferences.favorite_dishes,
        recentEventTypes: profile.history.map((h) => h.type === 'tournament' ? 'tournament' : 'event'),
      }).map((p) => ({ ...p, href: path(p.href) }))
      setForYouPrompts(personalized)
    })
  }, [user, org.id, demoMode, events, facilities, path])
  const featured = events[0]
  const golfFacility = facilities.find((f) => f.sport?.name === 'golf')

  return (
    <>
      <div className="relative bg-ink">
        <MemberHeader variant="transparent" hideDemoBanner />

        {isIkon ? (
          <IkonHero
            featured={featured}
            demoMode={demoMode}
            golfFacilityId={golfFacility?.id}
            path={path}
          />
        ) : (
          <section className="relative min-h-[72vh] overflow-hidden">
            <div className="absolute inset-0 bg-neutral-900" />
            <div className="scrim-hero absolute inset-0" />
            <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-center px-6 py-24 lg:px-10">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/50">{todayLabel()}</p>
              <h1 className="font-display mt-4 max-w-[14ch] text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] text-white">
                Bienvenido<br />a {org.name}
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
                Experiencias, deporte y gastronomía en un club diseñado para disfrutar cada momento.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={path('/reservations')} className="btn-hero-cta-fill">Reservar</Link>
                <Link href={path('/carta')} className="btn-hero-cta-outline">Ver carta</Link>
              </div>
            </div>
          </section>
        )}

        {demoMode && isIkon && (
          <Link
            href="/setup"
            className="absolute bottom-8 left-6 z-20 hidden rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] text-white/55 backdrop-blur-md hover:text-white/80 lg:inline-flex"
          >
            Demo · conectar Supabase
          </Link>
        )}
      </div>

      <main className="mx-auto max-w-7xl space-y-24 px-6 py-20 lg:px-10 lg:py-28">
        {user && forYouPrompts.length > 0 && <ForYouSection prompts={forYouPrompts} />}
        <DiscoveryFeed prompts={prompts} />

        <section>
          <div className="mb-10">
            <p className="label-caps">El club</p>
            <h2 className="font-display mt-3 text-4xl text-foreground md:text-5xl">
              Reserva tu experiencia
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {golfFacility && (
              <Link
                href={path(`/reservations?facility=${golfFacility.id}`)}
                className="group relative min-h-[320px] overflow-hidden rounded-3xl lg:col-span-7"
              >
                <img
                  src="https://images.unsplash.com/photo-1535131749006-ba7a34837537?auto=format&fit=crop&w=1400&q=85"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="relative flex h-full min-h-[320px] flex-col justify-end p-8 md:p-10">
                  <Flag className="h-5 w-5 text-accent-solid" />
                  <h3 className="font-display mt-4 text-3xl text-white md:text-4xl">Campo de golf</h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
                    Championship course · salidas desde las 07:00 · caddie y buggy
                  </p>
                  <p className="mt-6 text-sm font-medium uppercase tracking-wider text-motanos">
                    {golfFacility.booking_config?.price_per_hour ? `Desde ${golfFacility.booking_config.price_per_hour} €` : 'Reservar'} →
                  </p>
                </div>
              </Link>
            )}

            <div className="flex flex-col gap-5 lg:col-span-5">
              <Link href={path('/carta')} className="group relative flex-1 overflow-hidden rounded-3xl">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85"
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 transition-colors group-hover:bg-black/40" />
                <div className="relative flex h-full min-h-[150px] flex-col justify-end p-7">
                  <UtensilsCrossed className="h-5 w-5 text-accent-solid" />
                  <h3 className="font-display mt-3 text-2xl text-white">Restaurante</h3>
                  <p className="mt-1 text-sm text-white/65">Carta · terraza con vistas al campo</p>
                </div>
              </Link>
              <Link href={path('/reservations?type=restaurant')} className="card-premium flex items-center justify-between p-6">
                <div>
                  <Calendar className="h-5 w-5 text-accent-solid" />
                  <h3 className="font-display mt-3 text-xl text-foreground">Mesa en terraza</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Brunch, cenas y eventos privados</p>
                </div>
                <span className="text-sm font-medium text-motanos">→</span>
              </Link>
            </div>
          </div>

          {facilities.filter((f) => f.sport?.name !== 'golf').length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {facilities.filter((f) => f.sport?.name !== 'golf').map((f) => (
                <Link
                  key={f.id}
                  href={path(`/reservations?facility=${f.id}`)}
                  className="card-premium flex items-center justify-between px-6 py-5"
                >
                  <div>
                    <p className="font-medium text-foreground">{f.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {f.sport?.display_name}
                      {f.booking_config?.price_per_hour ? ` · ${f.booking_config.price_per_hour} €/h` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-motanos">Reservar</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="label-caps">Agenda</p>
              <h2 className="font-display mt-3 text-4xl text-foreground md:text-5xl">
                Próximas experiencias
              </h2>
            </div>
            <Link href={path('/events')} className="shrink-0 text-sm font-medium uppercase tracking-wider text-motanos">
              Ver todo
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {events.length === 0 ? (
              <EmptySection
                title="No hay experiencias publicadas"
                description="Vuelve pronto o explora las reservas del club."
                actionLabel="Ver reservas"
                actionHref={path('/reservations')}
              />
            ) : events.slice(0, 4).map((event) => (
              <Link
                key={event.id}
                href={demoMode || event.id.startsWith('demo-') ? path('/events') : path(`/events/${event.id}`)}
                className="group overflow-hidden rounded-3xl bg-neutral-900 shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {event.cover_image_url ? (
                    <img src={event.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-neutral-800">
                      <Calendar className="h-10 w-10 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-motanos">{labelEventType(event.type)}</p>
                    <h3 className="font-display mt-2 text-2xl text-white">{event.title}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="space-y-1 text-xs text-white/50">
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{formatEventDate(event.starts_at)}</div>
                    {event.location_details && (
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.location_details}</div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-motanos">
                    {event.price > 0 ? `${event.price} €` : 'Socios'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="label-caps">Comunidad</p>
            <h2 className="font-display mt-3 mb-8 text-4xl text-foreground">Actividad reciente</h2>
            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-neutral-900">
              {activities.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Aún no hay actividad en el club.
                </div>
              ) : activities.map((a) => (
                <div key={a.id} className="px-6 py-5">
                  <p className="font-medium text-foreground">{a.title}</p>
                  {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">{formatRelativeTime(a.created_at)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="label-caps">El club</p>
            <div className="mt-6 grid gap-4">
              {[
                { icon: Calendar, value: stats.events, label: 'Experiencias activas' },
                { icon: Users, value: stats.members > 0 ? stats.members : '—', label: 'Socios activos' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-2xl bg-neutral-900 p-8 text-center">
                  <Icon className="mx-auto mb-4 h-5 w-5 text-accent-solid" />
                  <p className="font-display text-5xl text-white">{value}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black px-6 py-16 text-center">
        {getTenantLogoUrl(org) ? (
          <img
            src={getTenantLogoUrl(org)!}
            alt={org.name}
            className="mx-auto h-20 w-auto object-contain"
          />
        ) : (
          <p className="font-display text-4xl tracking-wide text-white">{org.name}</p>
        )}
        <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          {org.city || 'Private Club'}
        </p>
        <p className="mt-8 text-xs text-white/35">© {new Date().getFullYear()} {org.name}</p>
      </footer>
    </>
  )
}
