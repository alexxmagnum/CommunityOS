'use client'

import Link from 'next/link'
import { getCinematicHeroCopy, getHeroHighlights, getHeroStats } from '@/lib/org/tenant-experience'
import type { TenantEvent, TenantFacility, TenantOrg } from '@/lib/org/types'
import { HeroBackground, HERO_IMAGE_MOBILE } from '@/components/member/hero-background'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const GLASS_FEATURES_FALLBACK = [
  'Instalaciones',
  'Eventos',
  'Restaurante',
  'Comunidad',
] as const

function formatEventCardDate(iso: string) {
  const d = new Date(iso)
  const day = d.toLocaleDateString('es-ES', { day: 'numeric' }).toUpperCase()
  const month = d.toLocaleDateString('es-ES', { month: 'long' }).toUpperCase()
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return { day, month, time }
}

function resolvePrimaryCta(
  path: (segment?: string) => string,
  facilities: TenantFacility[],
  golfFacilityId?: string,
) {
  if (golfFacilityId) {
    return {
      href: path(`/reservations?facility=${golfFacilityId}`),
      label: 'Reservar salida',
    }
  }
  const first = facilities[0]
  if (first) {
    return {
      href: path(`/reservations?facility=${first.id}`),
      label: 'Reservar',
    }
  }
  return { href: path('/reservations'), label: 'Reservar' }
}

function HeroGlassCard({
  org,
  featured,
  eventDate,
  eventHref,
  className,
  glassFeatures,
}: {
  org: TenantOrg
  featured?: TenantEvent | null
  eventDate: ReturnType<typeof formatEventCardDate> | null
  eventHref: string
  className?: string
  glassFeatures: string[]
}) {
  return (
    <div className={className ?? 'hero-glass-card w-full max-w-[280px] lg:w-[260px] lg:max-w-none'}>
      <div className="text-center">
        <p className="font-display text-lg tracking-wide text-white">{org.name}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-[0.32em] text-white/55">Club privado</p>
      </div>
      <div className="my-3 h-px bg-white/10" />
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[8px] font-medium uppercase tracking-[0.12em] text-white/60">
        {glassFeatures.slice(0, 6).map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
      {featured && eventDate && (
        <>
          <div className="my-3 h-px bg-white/10" />
          <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-motanos">Próximo evento</p>
          <p className="mt-1.5 font-display text-sm text-white">{featured.title}</p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div>
              <p className="text-lg font-light leading-none text-white">{eventDate.day}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/55">{eventDate.month}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/80">{eventDate.time}</p>
              {featured.available_spots != null && (
                <p className="mt-0.5 text-[9px] text-white/50">{featured.available_spots} plazas</p>
              )}
            </div>
          </div>
          <Link href={eventHref} className="btn-hero-cta-fill mt-3 h-10 w-full justify-center text-center text-xs">
            Inscribirse
          </Link>
        </>
      )}
    </div>
  )
}

function HeroEventTeaser({
  featured,
  eventDate,
  eventHref,
  className,
}: {
  featured: TenantEvent
  eventDate: ReturnType<typeof formatEventCardDate>
  eventHref: string
  className?: string
}) {
  return (
    <Link
      href={eventHref}
      className={cn(
        'hero-event-teaser group block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.05] lg:p-5',
        className,
      )}
    >
      <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-motanos lg:text-[10px]">
        Próximo evento
      </p>
      <div className="mt-2 flex items-end justify-between gap-3 lg:block">
        <div className="min-w-0">
          <p className="font-display text-lg leading-snug text-white lg:mt-2 lg:text-xl">{featured.title}</p>
          <p className="mt-1 text-[12px] text-white/50 lg:mt-2 lg:text-[13px]">
            {eventDate.day} {eventDate.month} · {eventDate.time}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/60 transition-colors group-hover:text-white lg:mt-4 lg:text-[11px] lg:tracking-[0.16em]">
          <span className="lg:hidden">Ver</span>
          <span className="hidden lg:inline">Ver detalles</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  )
}

function HeroFooter({
  className,
  variant = 'full',
  indicators,
  stats,
}: {
  className?: string
  variant?: 'full' | 'stats'
  indicators: string[]
  stats: { value: string; label: string }[]
}) {
  return (
    <div className={className}>
      {variant === 'full' && indicators.length > 0 && (
        <div className="hero-indicators-track overflow-x-auto pb-1">
          <p className="hero-fade hero-fade-5 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.18em] text-white/65">
            {indicators.join('  ·  ')}
          </p>
        </div>
      )}
      <div className={`hero-fade hero-fade-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4 sm:gap-8 ${variant === 'full' ? 'mt-5' : ''}`}>
        {stats.map(({ value, label }) => (
          <div key={label}>
            <p className="font-display text-xl text-white lg:text-3xl">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</p>
          </div>
        ))}
      </div>
      {variant === 'full' && (
        <div className="hero-scroll-indicator hero-fade hero-fade-8 pointer-events-none mt-6 hidden text-center lg:block">
          <p className="hero-scroll-arrow text-lg text-white/50">↓</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.35em] text-white/40">Bajar</p>
        </div>
      )}
    </div>
  )
}

export type TenantCinematicHeroProps = {
  org: TenantOrg
  featured?: TenantEvent | null
  demoMode: boolean
  golfFacilityId?: string
  facilities?: TenantFacility[]
  path: (segment?: string) => string
}

/** Hero cinemático genérico — copy y stats desde `organization_settings` / branding del club. */
export function TenantCinematicHero({
  org,
  featured,
  demoMode,
  golfFacilityId,
  facilities = [],
  path,
}: TenantCinematicHeroProps) {
  const copy = getCinematicHeroCopy(org)
  const highlights = getHeroHighlights(org)
  const stats = getHeroStats(org)
  const glassFeatures = highlights.length > 0 ? highlights : [...GLASS_FEATURES_FALLBACK]
  const primaryCta = resolvePrimaryCta(path, facilities, golfFacilityId)
  const eventHref = featured && !demoMode ? path(`/events/${featured.id}`) : path('/events')
  const eventDate = featured ? formatEventCardDate(featured.starts_at) : null

  const mobileTitleParts = (copy.titleMobile || copy.titleLines.join(' '))
    .split(/(?<=\.)\s+/)
    .filter(Boolean)

  return (
    <>
      <section className="hero-premium bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="hero-shell relative bg-black">
            <div className="hero-media relative hidden overflow-hidden lg:block lg:overflow-visible">
              <HeroBackground className="hero-image-natural" preferredImage={copy.heroImage ?? undefined} />
              <div className="scrim-hero pointer-events-none absolute inset-0" aria-hidden />
            </div>

            <div className="relative z-10 flex flex-col lg:absolute lg:inset-0">
              <div className="flex flex-1 flex-col lg:flex-row">
                <div className="relative w-full lg:max-w-[52%] lg:pr-8">
                  <div
                    className="hero-text-backdrop pointer-events-none absolute inset-y-0 -left-6 right-0 hidden lg:block lg:-left-8 lg:-right-12"
                    aria-hidden
                  />
                  <div className="relative">
                    <div className="hero-eyebrow-anchor absolute inset-x-0 z-10 flex justify-center lg:justify-start">
                      <div className="hero-eyebrow-wrap hero-fade hero-fade-1">
                        <p className="hero-eyebrow-kicker text-motanos">{copy.eyebrowKicker}</p>
                        <div className="hero-eyebrow-subwrap">
                          <p className="hero-eyebrow text-white/70 lg:text-white/85">{copy.eyebrow}</p>
                          <div className="hero-eyebrow-line" aria-hidden />
                        </div>
                      </div>
                    </div>

                    <div className="hero-main-copy pt-[6.5rem] lg:pt-[7.5rem]">
                      <h1 className="hero-title font-display hero-fade hero-fade-2 mt-4 text-white lg:mt-10">
                        <span className="lg:hidden">
                          {mobileTitleParts.map((part, index) => (
                            <span key={index} className="block">
                              {part}
                            </span>
                          ))}
                        </span>
                        <span className="hidden lg:contents">
                          {copy.titleLines.map((line, index) => (
                            <span
                              key={`${line}-${index}`}
                              className={cn('block', index === 2 && 'mt-1 lg:mt-2')}
                            >
                              {line}
                            </span>
                          ))}
                        </span>
                      </h1>

                      <div className="hero-media hero-media-inline relative mt-7 overflow-hidden lg:hidden">
                        <HeroBackground
                          className="hero-image-mobile"
                          image={HERO_IMAGE_MOBILE}
                          preferredImage={copy.heroImage ?? undefined}
                        />
                      </div>

                      <p className="hero-subtitle hero-fade hero-fade-3 mt-6 max-w-md font-sans text-[17px] font-extralight leading-[1.75] tracking-[0.03em] text-white/55 lg:mt-10 lg:max-w-lg lg:text-[20px] lg:leading-[1.8] lg:text-white/70">
                        {copy.subtitle}
                      </p>

                      <div className="hero-cta-mobile hero-fade hero-fade-4 mt-4 flex flex-row items-stretch gap-2.5 lg:hidden">
                        <Link href={primaryCta.href} className="btn-hero-cta-fill min-w-0 flex-1 justify-center px-3 text-center">
                          {primaryCta.label}
                        </Link>
                        <Link href={path('/events')} className="btn-hero-cta-outline min-w-0 flex-1 justify-center gap-1 px-3 text-center">
                          Conocer el club
                          <ArrowRight className="h-3 w-3 shrink-0" />
                        </Link>
                      </div>

                      {featured && eventDate && (
                        <HeroEventTeaser
                          featured={featured}
                          eventDate={eventDate}
                          eventHref={eventHref}
                          className="hero-fade hero-fade-5 mt-5 lg:hidden"
                        />
                      )}

                      <div className="hero-cta-desktop hero-fade hero-fade-4 mt-4 hidden flex-row items-center gap-3 lg:flex">
                        <Link href={primaryCta.href} className="btn-hero-cta-fill justify-center lg:w-auto">
                          {primaryCta.label}
                        </Link>
                        <Link href={path('/events')} className="btn-hero-cta-outline gap-2">
                          Conocer el club
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative hidden flex-1 lg:block">
                  <div className="absolute bottom-8 right-0">
                    <HeroGlassCard
                      org={org}
                      featured={featured}
                      eventDate={eventDate}
                      eventHref={eventHref}
                      glassFeatures={glassFeatures}
                    />
                  </div>
                </div>
              </div>

              <HeroFooter
                className="hero-footer-scrim mt-auto hidden border-t border-white/15 py-6 lg:block lg:py-7"
                indicators={highlights}
                stats={stats}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="hero-mobile-extras mx-auto max-w-7xl bg-black px-6 pb-10 pt-8 lg:hidden">
        <HeroFooter variant="stats" className="border-t border-white/10 pt-8" indicators={highlights} stats={stats} />
      </div>
    </>
  )
}
