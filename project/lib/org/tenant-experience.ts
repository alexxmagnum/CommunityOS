import type { TenantBranding, TenantOrg } from './types'
import { IKON_BRAND } from './ikon-brand'
import { isDarkSurface } from './resolve-theme'

export type HeroStyle = 'standard' | 'cinematic'
export type SplashStyle = 'none' | 'reveal' | 'golf'

const DEFAULT_SUBTITLE =
  'Experiencias, deporte y gastronomía en un club diseñado para disfrutar cada momento.'

/** Preset visual IKON — se aplica siempre al slug `ikon` (cliente histórico). */
export const IKON_PRESET_BRANDING: TenantBranding = {
  hero_style: 'cinematic',
  splash_style: 'golf',
  tagline: IKON_BRAND.tagline,
  hero_eyebrow_kicker: IKON_BRAND.heroEyebrowKicker,
  hero_eyebrow: IKON_BRAND.heroEyebrow,
  hero_title_lines: [
    IKON_BRAND.heroTitleLine1,
    IKON_BRAND.heroTitleLine2,
    IKON_BRAND.heroTitleLine3,
    IKON_BRAND.heroTitleLine4,
  ],
  hero_title_mobile: 'Un estilo de vida. Una pasión eterna.',
  hero_tagline: IKON_BRAND.heroSubtitle,
}

export function isIkonTenant(org: Pick<TenantOrg, 'slug'>): boolean {
  return org.slug === 'ikon'
}

export function parseBrandingHero(value: unknown): Partial<TenantBranding> {
  if (!value || typeof value !== 'object') return {}
  const raw = value as Record<string, unknown>
  return {
    hero_image_url: typeof raw.hero_image_url === 'string' ? raw.hero_image_url : null,
    hero_tagline: typeof raw.hero_tagline === 'string' ? raw.hero_tagline : null,
  }
}

export function parseBrandingExperience(value: unknown): Partial<TenantBranding> {
  if (!value || typeof value !== 'object') return {}
  const raw = value as Record<string, unknown>
  const heroStyle =
    raw.hero_style === 'cinematic' ? 'cinematic' : raw.hero_style === 'standard' ? 'standard' : undefined
  const splashStyle =
    raw.splash_style === 'golf'
      ? 'golf'
      : raw.splash_style === 'reveal'
        ? 'reveal'
        : raw.splash_style === 'none'
          ? 'none'
          : undefined

  const heroHighlights = Array.isArray(raw.hero_highlights)
    ? raw.hero_highlights.filter((item): item is string => typeof item === 'string')
    : undefined

  const heroStats = Array.isArray(raw.hero_stats)
    ? raw.hero_stats
        .filter((item): item is { value: string; label: string } => {
          return (
            !!item &&
            typeof item === 'object' &&
            typeof (item as { value?: unknown }).value === 'string' &&
            typeof (item as { label?: unknown }).label === 'string'
          )
        })
    : undefined

  return {
    hero_style: heroStyle,
    splash_style: splashStyle,
    tagline: typeof raw.tagline === 'string' ? raw.tagline : null,
    hero_eyebrow_kicker: typeof raw.hero_eyebrow_kicker === 'string' ? raw.hero_eyebrow_kicker : null,
    hero_eyebrow: typeof raw.hero_eyebrow === 'string' ? raw.hero_eyebrow : null,
    hero_title_lines: Array.isArray(raw.hero_title_lines)
      ? raw.hero_title_lines.filter((line): line is string => typeof line === 'string')
      : undefined,
    hero_title_mobile: typeof raw.hero_title_mobile === 'string' ? raw.hero_title_mobile : null,
    hero_highlights: heroHighlights,
    hero_stats: heroStats,
  }
}

export function mergeTenantBranding(
  hero?: Partial<TenantBranding>,
  experience?: Partial<TenantBranding>
): TenantBranding | undefined {
  const merged = { ...hero, ...experience }
  if (Object.keys(merged).length === 0) return undefined
  return merged
}

/** Asegura que IKON conserve su identidad aunque falte config en Supabase. */
export function withIkonPreset(org: TenantOrg): TenantOrg {
  if (!isIkonTenant(org)) return org

  const branding = mergeTenantBranding(
    {
      hero_image_url: org.branding?.hero_image_url ?? org.hero_image_url ?? null,
      hero_tagline: org.branding?.hero_tagline ?? org.hero_tagline ?? IKON_BRAND.heroSubtitle,
    },
    { ...IKON_PRESET_BRANDING, ...org.branding }
  )

  return {
    ...org,
    logo_url: org.logo_url || '/brand/ikon-logo.png',
    primary_color: IKON_BRAND.ink,
    secondary_color: IKON_BRAND.ink,
    accent_color: IKON_BRAND.accent,
    font_family: 'Instrument Serif',
    theme_mode: 'dark',
    hero_image_url: org.hero_image_url ?? branding?.hero_image_url ?? undefined,
    hero_tagline: org.hero_tagline ?? branding?.hero_tagline ?? IKON_BRAND.heroSubtitle,
    branding,
  }
}

export function usesCinematicHero(org: TenantOrg): boolean {
  return isIkonTenant(org) || org.branding?.hero_style === 'cinematic'
}

export function usesGolfSplash(org: TenantOrg): boolean {
  return isIkonTenant(org) || org.branding?.splash_style === 'golf'
}

export function usesRevealSplash(org: TenantOrg): boolean {
  if (isIkonTenant(org)) return false
  return org.branding?.splash_style === 'reveal'
}

export function getHeroHighlights(org: TenantOrg): string[] {
  if (org.branding?.hero_highlights && org.branding.hero_highlights.length > 0) {
    return org.branding.hero_highlights
  }
  if (isIkonTenant(org)) {
    return ['18 Hoyos', 'Campo de prácticas', 'Restaurante', 'Eventos', 'Academia']
  }
  return ['Instalaciones', 'Eventos', 'Restaurante', 'Comunidad']
}

export function getHeroStats(org: TenantOrg): { value: string; label: string }[] {
  if (org.branding?.hero_stats && org.branding.hero_stats.length > 0) {
    return org.branding.hero_stats
  }
  if (isIkonTenant(org)) {
    return [
      { value: '500+', label: 'Socios' },
      { value: '18', label: 'Hoyos' },
      { value: '365', label: 'Días abierto' },
      { value: '4.9★', label: 'Valoración' },
    ]
  }
  return [
    { value: '100+', label: 'Socios' },
    { value: '10+', label: 'Actividades' },
    { value: '24/7', label: 'Acceso' },
    { value: '5★', label: 'Experiencia' },
  ]
}

export function preferDarkChrome(org: TenantOrg): boolean {
  if (isIkonTenant(org)) return true
  if (usesCinematicHero(org)) return true
  if (org.theme_mode === 'dark') return true
  return isDarkSurface(org.primary_color)
}

export function getCinematicHeroCopy(org: TenantOrg) {
  const ikon = isIkonTenant(org)
  const branding = ikon ? { ...IKON_PRESET_BRANDING, ...org.branding } : org.branding

  const titleLines =
    branding?.hero_title_lines && branding.hero_title_lines.length > 0
      ? branding.hero_title_lines
      : ikon
        ? IKON_PRESET_BRANDING.hero_title_lines!
        : [`Bienvenido a ${org.name}`]

  return {
    eyebrowKicker: branding?.hero_eyebrow_kicker ?? (ikon ? IKON_BRAND.heroEyebrowKicker : org.city ?? ''),
    eyebrow: branding?.hero_eyebrow ?? (ikon ? IKON_BRAND.heroEyebrow : ''),
    titleLines,
    titleMobile:
      branding?.hero_title_mobile ??
      (ikon ? 'Un estilo de vida. Una pasión eterna.' : titleLines.length >= 2 ? `${titleLines[0]} ${titleLines[1]}.` : titleLines[0]),
    subtitle: branding?.hero_tagline ?? org.hero_tagline ?? (ikon ? IKON_BRAND.heroSubtitle : DEFAULT_SUBTITLE),
    tagline: branding?.tagline ?? (ikon ? IKON_BRAND.tagline : ''),
    heroImage: branding?.hero_image_url ?? org.hero_image_url ?? (ikon ? '/hero/ikon-hero.jpg' : null),
  }
}
