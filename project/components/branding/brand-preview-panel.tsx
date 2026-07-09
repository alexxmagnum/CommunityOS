'use client'

import type { CSSProperties } from 'react'
import type { BrandingFormState } from '@/lib/org/brand-templates'
import { resolveOrgTheme } from '@/lib/org/resolve-theme'
import type { TenantOrg } from '@/lib/org/types'
import { labelHeroStyle, labelSplashStyle } from '@/lib/i18n/es'
import { cn } from '@/lib/utils'

type BrandPreviewPanelProps = {
  branding: BrandingFormState
  slug?: string
  className?: string
}

export function BrandPreviewPanel({ branding, slug, className }: BrandPreviewPanelProps) {
  const org: TenantOrg = {
    id: 'preview',
    name: branding.name || 'Tu club',
    slug: slug || 'preview',
    logo_url: branding.logo_url || null,
    primary_color: branding.primary_color,
    secondary_color: branding.secondary_color,
    accent_color: branding.accent_color,
    font_family: branding.font_family,
    theme_mode: branding.theme_mode,
    hero_image_url: branding.hero_image_url || null,
    hero_tagline: branding.hero_tagline || null,
    branding: {
      hero_style: branding.hero_style,
      splash_style: branding.splash_style,
      tagline: branding.tagline || null,
      hero_eyebrow_kicker: branding.hero_eyebrow_kicker || null,
      hero_eyebrow: branding.hero_eyebrow || null,
      hero_title_lines: [
        branding.hero_title_line_1,
        branding.hero_title_line_2,
        branding.hero_title_line_3,
        branding.hero_title_line_4,
      ].filter(Boolean),
      hero_title_mobile: branding.hero_title_mobile || null,
    },
  }

  const themeStyle = resolveOrgTheme(org)
  const titleLines = org.branding?.hero_title_lines ?? []
  const isCinematic = branding.hero_style === 'cinematic'
  const heroImage =
    branding.hero_image_url ||
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80'

  return (
    <div className={cn('sticky top-6', className)}>
      <p className="mb-3 text-sm font-medium text-muted-foreground">Vista previa en vivo</p>
      <div
        className="overflow-hidden rounded-2xl border shadow-lg"
        style={themeStyle as CSSProperties}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: branding.secondary_color }}
        >
          <div className="flex items-center gap-2">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: branding.accent_color, color: branding.primary_color }}
              >
                {(branding.name || 'C')[0]}
              </div>
            )}
            <span
              className="text-sm font-medium"
              style={{
                fontFamily: `var(--org-font-display)`,
                color: 'var(--org-primary)',
              }}
            >
              {branding.name || 'Tu club'}
            </span>
          </div>
          {branding.tagline && (
            <span className="hidden text-[10px] uppercase tracking-wider text-white/50 sm:block">
              {branding.tagline}
            </span>
          )}
        </div>

        <div className="relative min-h-[280px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
          <div className="relative flex min-h-[280px] flex-col justify-end p-5">
            {isCinematic && branding.hero_eyebrow_kicker && (
              <p className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: branding.accent_color }}>
                {branding.hero_eyebrow_kicker}
              </p>
            )}
            <h2
              className="mt-2 text-2xl leading-tight text-white"
              style={{ fontFamily: `var(--org-font-display)` }}
            >
              {isCinematic && titleLines.length > 0
                ? titleLines.slice(0, 2).join(' ')
                : `Bienvenido a ${branding.name || 'tu club'}`}
            </h2>
            {branding.hero_tagline && (
              <p className="mt-2 line-clamp-2 text-xs text-white/65">{branding.hero_tagline}</p>
            )}
            <div className="mt-4 flex gap-2">
              <span
                className="rounded-full px-3 py-1.5 text-[10px] font-medium"
                style={{ backgroundColor: branding.accent_color, color: branding.primary_color }}
              >
                Reservar
              </span>
              <span className="rounded-full border border-white/30 px-3 py-1.5 text-[10px] text-white/80">
                Eventos
              </span>
            </div>
          </div>
        </div>

        <div
          className="grid grid-cols-4 gap-2 px-4 py-3 text-center"
          style={{ backgroundColor: branding.primary_color }}
        >
          {['Socios', 'Deporte', 'Eventos', '5★'].map((label) => (
            <div key={label}>
              <p className="text-xs font-semibold" style={{ color: branding.accent_color }}>
                —
              </p>
              <p className="text-[9px] uppercase tracking-wider text-white/45">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {labelHeroStyle(branding.hero_style)}
        {branding.splash_style !== 'none' && ` · ${labelSplashStyle(branding.splash_style)}`}
      </p>
    </div>
  )
}
