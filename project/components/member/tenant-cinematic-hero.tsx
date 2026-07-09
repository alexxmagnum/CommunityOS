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

function HeroSidePanel({
  org,
  featured,
  eventDate,
  eventHref,
  glassFeatures,
}: {
  org: TenantOrg
  featured?: TenantEvent | null
  eventDate: ReturnType<typeof formatEventCardDate> | null
  eventHref: string
  glassFeatures: string[]
}) {
  return (
    <aside className="hero-glass-card flex w-full flex-col lg:max-w-sm">
      <div>
        <p className="font-display text-lg tracking-wide text-white">{org.name}</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.32em] text-white/55">Club privado</p>
      </div>
      <div className="my-4 h-px bg-white/10" />
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-[9px] font-medium uppercase tracking-[0.14em] text-white/60">
        {glassFeatures.slice(0, 6).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {featured && eventDate && (
        <>
          <div className="my-4 h-px bg-white/10" />
          <p className="text-[9px] font-medium uppercase tracking-[0.26em] text-motanos">Próximo evento</p>
          <p className="mt-2 font-display text-base leading-snug text-white">{featured.title}</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-light leading-none text-white">{eventDate.day}</p>
              <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-white/55">{eventDate.month}</p>
            </div>
            <div className="text-right text-[11px] text-white/70">
              <p>{eventDate.time}</p>
              {featured.available_spots != null && (
                <p className="mt-0.5 text-[9px] text-white/45">{featured.available_spots} plazas</p>
              )}
            </div>
          </div>
          <Link href={eventHref} className="btn-hero-cta-fill mt-4 h-11 w-full justify-center text-center text-xs">
            Inscribirse
          </Link>
        </>
      )}
    </aside>
  )
}

function HeroStatsStrip({
  highlights,
  stats,
  className,
}: {
  highlights: string[]
  stats: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={cn('border-t border-white/10', className)}>
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-2 py-4 lg:py-5">
          {highlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/65"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      <div
        className={cn(
          'grid grid-cols-2 gap-x-8 gap-y-6 border-white/10 pb-6 pt-2 sm:grid-cols-4 lg:pb-8',
          highlights.length > 0 && 'border-t',
        )}
      >
        {stats.map(({ value, label }) => (
          <div key={label}>
            <p className="font-display text-2xl text-white lg:text-3xl">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</p>
          </div>
        ))}
      </div>
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

/** Hero cinemático — grid fijo: copy | panel lateral | franja de stats abajo. */
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
    <section className="hero-premium relative min-h-[100svh] bg-black lg:min-h-[92vh]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="hidden h-full lg:block">
          <HeroBackground className="hero-image-natural h-full w-full object-cover" preferredImage={copy.heroImage ?? undefined} />
        </div>
        <div className="h-full lg:hidden">
          <HeroBackground
            className="hero-image-mobile h-full w-full object-cover"
            image={HERO_IMAGE_MOBILE}
            preferredImage={copy.heroImage ?? undefined}
          />
        </div>
        <div className="scrim-hero absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col px-6 lg:px-8">
        <div className="flex flex-1 flex-col justify-end pb-6 pt-28 lg:justify-center lg:pb-8 lg:pt-32">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7 xl:col-span-7">
              <div className="hero-eyebrow-wrap hero-fade hero-fade-1 mb-6 lg:mb-8">
                <p className="hero-eyebrow-kicker text-motanos">{copy.eyebrowKicker}</p>
                <div className="hero-eyebrow-subwrap mt-2">
                  <p className="hero-eyebrow text-white/80">{copy.eyebrow}</p>
                  <div className="hero-eyebrow-line mt-2" aria-hidden />
                </div>
              </div>

              <h1 className="hero-title font-display hero-fade hero-fade-2 text-white">
                <span className="lg:hidden">
                  {mobileTitleParts.map((part, index) => (
                    <span key={index} className="block">
                      {part}
                    </span>
                  ))}
                </span>
                <span className="hidden lg:contents">
                  {copy.titleLines.map((line, index) => (
                    <span key={`${line}-${index}`} className={cn('block', index === 2 && 'mt-1 lg:mt-2')}>
                      {line}
                    </span>
                  ))}
                </span>
              </h1>

              <p className="hero-subtitle hero-fade hero-fade-3 mt-6 max-w-lg font-sans text-[17px] font-extralight leading-[1.75] tracking-[0.03em] text-white/60 lg:mt-8 lg:text-[20px] lg:leading-[1.8] lg:text-white/70">
                {copy.subtitle}
              </p>

              <div className="hero-fade hero-fade-4 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={primaryCta.href} className="btn-hero-cta-fill justify-center sm:w-auto">
                  {primaryCta.label}
                </Link>
                <Link href={path('/events')} className="btn-hero-cta-outline justify-center gap-2 sm:w-auto">
                  Conocer el club
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hero-fade hero-fade-5 lg:col-span-5 lg:flex lg:justify-end xl:col-span-5">
              <HeroSidePanel
                org={org}
                featured={featured}
                eventDate={eventDate}
                eventHref={eventHref}
                glassFeatures={glassFeatures}
              />
            </div>
          </div>
        </div>

        <HeroStatsStrip highlights={highlights} stats={stats} className="hero-fade hero-fade-6 mt-auto" />
      </div>
    </section>
  )
}
