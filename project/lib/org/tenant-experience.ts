import type { TenantBranding, TenantOrg } from './types'

import { isDarkSurface } from './resolve-theme'



export type HeroStyle = 'standard' | 'cinematic'

export type SplashStyle = 'none' | 'reveal' | 'golf'



const DEFAULT_SUBTITLE =

  'Experiencias, deporte y gastronomía en un club diseñado para disfrutar cada momento.'



const DEFAULT_HERO_HIGHLIGHTS = ['Instalaciones', 'Eventos', 'Restaurante', 'Comunidad']



const DEFAULT_HERO_STATS: { value: string; label: string }[] = [

  { value: '100+', label: 'Socios' },

  { value: '10+', label: 'Actividades' },

  { value: '24/7', label: 'Acceso' },

  { value: '5★', label: 'Experiencia' },

]



/** UTF-8 leído como Latin-1 en SQL pegado con encoding roto (p. ej. pasiÃ³n). */

function looksLikeMojibake(value: string): boolean {

  return /Ã.|Â./u.test(value)

}



function pickBrandingText(db: string | null | undefined, fallback: string): string {

  if (!db || looksLikeMojibake(db)) return fallback

  return db

}



function pickBrandingLines(

  db: string[] | null | undefined,

  fallback: readonly string[],

): string[] {

  if (!db?.length || db.some(looksLikeMojibake)) return [...fallback]

  return db

}



/** Referencia para seeds SQL y demos — no se aplica en runtime por slug. */

export { IKON_BRAND } from './ikon-brand'



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

  experience?: Partial<TenantBranding>,

): TenantBranding | undefined {

  const merged = { ...hero, ...experience }

  if (Object.keys(merged).length === 0) return undefined

  return merged

}



export function usesCinematicHero(org: TenantOrg): boolean {

  return org.branding?.hero_style === 'cinematic'

}



export function usesGolfSplash(org: TenantOrg): boolean {

  return org.branding?.splash_style === 'golf'

}



export function usesRevealSplash(org: TenantOrg): boolean {

  return org.branding?.splash_style === 'reveal'

}



export function getGolfSplashCopy(org: TenantOrg) {

  const word = (org.name.trim().split(/\s+/)[0] ?? org.name).toUpperCase()

  const letters = word.slice(0, 6).split('')

  const tagline = org.branding?.tagline ?? ''

  const segments = tagline.split(/[·•|/]/).map((s) => s.trim()).filter(Boolean)

  return {

    letters,

    line2: (segments[0] ?? '').toUpperCase(),

    line3: (segments[1] ?? org.city ?? '').toUpperCase(),

  }

}



export function getHeroHighlights(org: TenantOrg): string[] {

  if (org.branding?.hero_highlights && org.branding.hero_highlights.length > 0) {

    return org.branding.hero_highlights

  }

  return [...DEFAULT_HERO_HIGHLIGHTS]

}



export function getHeroStats(org: TenantOrg): { value: string; label: string }[] {

  if (org.branding?.hero_stats && org.branding.hero_stats.length > 0) {

    return org.branding.hero_stats

  }

  return DEFAULT_HERO_STATS

}



export function preferDarkChrome(org: TenantOrg): boolean {

  if (usesCinematicHero(org)) return true

  if (org.theme_mode === 'dark') return true

  return isDarkSurface(org.primary_color)

}



export function getCinematicHeroCopy(org: TenantOrg) {

  const branding = org.branding

  const titleLines = pickBrandingLines(branding?.hero_title_lines, [`Bienvenido a ${org.name}`])



  return {

    eyebrowKicker: pickBrandingText(branding?.hero_eyebrow_kicker, org.city ?? ''),

    eyebrow: pickBrandingText(branding?.hero_eyebrow, ''),

    titleLines,

    titleMobile: pickBrandingText(

      branding?.hero_title_mobile,

      titleLines.length >= 2 ? `${titleLines[0]} ${titleLines[1]}.` : titleLines[0],

    ),

    subtitle: pickBrandingText(branding?.hero_tagline ?? org.hero_tagline, DEFAULT_SUBTITLE),

    tagline: pickBrandingText(branding?.tagline, ''),

    heroImage: branding?.hero_image_url ?? org.hero_image_url ?? null,

  }

}


