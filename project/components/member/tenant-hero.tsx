'use client'

import Link from 'next/link'
import type { TenantEvent, TenantOrg } from '@/lib/org/types'
import { getCinematicHeroCopy } from '@/lib/org/tenant-experience'
import { formatEventDate } from '@/lib/format/dates'

interface TenantHeroProps {
  org: TenantOrg
  featured?: TenantEvent | null
  path: (subpath?: string) => string
}

function todayLabel() {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

export function TenantHero({ org, featured, path }: TenantHeroProps) {
  const copy = getCinematicHeroCopy(org)
  const heroImage =
    org.hero_image_url ??
    copy.heroImage ??
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=80'

  const titleLines = copy.titleLines
  const hasCustomTitle = titleLines.length > 0 && titleLines[0] !== `Bienvenido a ${org.name}`

  return (
    <section className="relative min-h-[72vh] overflow-hidden">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center transition-transform duration-700"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="scrim-hero absolute inset-0" />
      <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-center px-6 py-24 lg:px-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-white/50">
          {copy.eyebrowKicker || org.city || ''}
          {copy.eyebrowKicker && copy.eyebrow ? ' · ' : ''}
          {copy.eyebrow || todayLabel()}
        </p>
        <h1 className="font-display mt-4 max-w-[16ch] text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] text-white">
          {hasCustomTitle ? (
            titleLines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))
          ) : (
            <>
              Bienvenido
              <br />a {org.name}
            </>
          )}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 md:text-lg">
          {copy.subtitle}
        </p>
        {featured && (
          <p className="mt-4 text-sm text-white/55">
            Próximo: {featured.title} · {formatEventDate(featured.starts_at)}
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href={path('/reservations')} className="btn-hero-cta-fill">
            Reservar
          </Link>
          <Link href={path('/carta')} className="btn-hero-cta-outline">
            Ver carta
          </Link>
        </div>
      </div>
    </section>
  )
}
