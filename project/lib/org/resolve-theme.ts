import type { CSSProperties } from 'react'
import type { TenantOrg } from './types'
import { IKON_BRAND } from './ikon-brand'
import { MOTANOS } from './motanos-brand'

function isIkonOrg(org: TenantOrg) {
  return org.slug === 'ikon'
}

export function hexLuminance(hex: string): number {
  const raw = hex.replace('#', '')
  if (raw.length < 6) return 0.5
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isDarkSurface(hex: string) {
  return hexLuminance(hex) < 0.45
}

/** Convierte #RRGGBB → "H S% L%" para variables CSS de shadcn. */
export function hexToHslString(hex: string): string {
  const raw = hex.replace('#', '')
  if (raw.length < 6) return '0 0% 50%'

  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      default:
        h = ((r - g) / d + 4) / 6
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function adjustHslLightness(hsl: string, delta: number): string {
  const match = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/)
  if (!match) return hsl
  const nextL = Math.min(96, Math.max(4, parseInt(match[3], 10) + delta))
  return `${match[1]} ${match[2]}% ${nextL}%`
}

function darkSemanticTokens(surfaceHex: string, accentHex: string): Record<string, string> {
  const bg = hexToHslString(surfaceHex)
  const card = adjustHslLightness(bg, 6)
  const muted = adjustHslLightness(bg, 4)
  const border = adjustHslLightness(bg, 12)
  const accent = hexToHslString(accentHex)

  return {
    '--background': bg,
    '--foreground': '210 20% 96%',
    '--card': card,
    '--card-foreground': '210 20% 96%',
    '--popover': card,
    '--popover-foreground': '210 20% 96%',
    '--primary': '210 20% 98%',
    '--primary-foreground': bg,
    '--secondary': muted,
    '--secondary-foreground': '210 20% 96%',
    '--muted': muted,
    '--muted-foreground': '210 14% 68%',
    '--accent': accent,
    '--accent-foreground': bg,
    '--border': border,
    '--input': border,
    '--ring': accent,
  }
}

function lightSemanticTokens(surfaceHex: string, inkHex: string, accentHex: string): Record<string, string> {
  const bg = hexToHslString(surfaceHex)
  const ink = hexToHslString(inkHex)
  const accent = hexToHslString(accentHex)
  const muted = adjustHslLightness(bg, -3)

  return {
    '--background': bg,
    '--foreground': ink,
    '--card': '0 0% 100%',
    '--card-foreground': ink,
    '--popover': '0 0% 100%',
    '--popover-foreground': ink,
    '--primary': ink,
    '--primary-foreground': bg,
    '--secondary': muted,
    '--secondary-foreground': ink,
    '--muted': muted,
    '--muted-foreground': '220 10% 42%',
    '--accent': accent,
    '--accent-foreground': '0 0% 100%',
    '--border': '220 14% 90%',
    '--input': '220 14% 90%',
    '--ring': accent,
  }
}

export function isTenantDark(org: TenantOrg): boolean {
  if (isIkonOrg(org)) return true
  if (org.theme_mode === 'dark') return true
  if (org.theme_mode === 'light') return false
  return isDarkSurface(org.primary_color) || isDarkSurface(org.secondary_color || org.primary_color)
}

export type ResolvedTenantTheme = {
  style: CSSProperties
  isDark: boolean
}

/** Tema completo: colores de marca + tokens semánticos (texto, tarjetas, bordes). */
export function resolveTenantTheme(org: TenantOrg): ResolvedTenantTheme {
  const ikon = isIkonOrg(org)
  const dark = isTenantDark(org)

  const ink = ikon ? IKON_BRAND.ink : org.primary_color
  const surface = ikon ? IKON_BRAND.ink : org.secondary_color || org.primary_color
  const elevated = ikon ? IKON_BRAND.elevated : adjustHslLightness(hexToHslString(surface), 6)
  const accent = ikon ? IKON_BRAND.accent : org.accent_color || MOTANOS.teal
  const textOnSurface = dark ? '#FAFAFA' : org.primary_color

  const semantic = dark
    ? darkSemanticTokens(surface, accent)
    : lightSemanticTokens(surface, ink, accent)

  return {
    isDark: dark,
    style: {
      ...semantic,
      '--org-ink': ink,
      '--org-primary': textOnSurface,
      '--org-secondary': ikon ? IKON_BRAND.elevated : org.secondary_color || org.primary_color,
      '--org-accent': accent,
      '--org-accent-cyan': accent,
      '--org-accent-lime': accent,
      '--motanos-gradient': `linear-gradient(90deg, ${accent}, ${accent})`,
      '--org-surface': surface,
      '--org-elevated': ikon ? IKON_BRAND.elevated : elevated,
      '--org-font-display': org.font_family
        ? `"${org.font_family}", ui-serif, Georgia, serif`
        : 'var(--font-serif), ui-serif, Georgia, serif',
      '--btn-fill': dark ? (ikon ? IKON_BRAND.ink : ink) : 'hsl(var(--background))',
    } as CSSProperties,
  }
}

/** @deprecated Usa resolveTenantTheme */
export function resolveOrgTheme(org: TenantOrg): CSSProperties {
  return resolveTenantTheme(org).style
}

export function getTenantLogoUrl(org: TenantOrg): string | null {
  return org.logo_url || null
}
