import type { CSSProperties } from 'react'
import type { TenantOrg } from './types'
import { MOTANOS } from './ikon-brand'

function hexLuminance(hex: string): number {
  const raw = hex.replace('#', '')
  if (raw.length < 6) return 0.5
  const r = parseInt(raw.slice(0, 2), 16) / 255
  const g = parseInt(raw.slice(2, 4), 16) / 255
  const b = parseInt(raw.slice(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function isDarkColor(hex: string) {
  return hexLuminance(hex) < 0.45
}

/** CSS variables from organization branding — no tenant-specific overrides. */
export function resolveOrgTheme(org: TenantOrg): CSSProperties {
  const surface = org.secondary_color || org.primary_color
  const dark =
    org.theme_mode === 'dark' ||
    (org.theme_mode !== 'light' && isDarkColor(org.primary_color))

  const textOnSurface = dark ? '#FAFAFA' : org.primary_color
  const accent = org.accent_color || MOTANOS.teal

  return {
    '--org-ink': org.primary_color,
    '--org-primary': textOnSurface,
    '--org-secondary': org.secondary_color || org.primary_color,
    '--org-accent': accent,
    '--org-accent-cyan': accent,
    '--org-accent-lime': accent,
    '--motanos-gradient': `linear-gradient(90deg, ${accent}, ${accent})`,
    '--org-surface': surface,
    '--btn-fill': dark ? org.primary_color : 'hsl(var(--background))',
    fontFamily: org.font_family ? `${org.font_family}, system-ui, sans-serif` : undefined,
  } as CSSProperties
}

export function getTenantLogoUrl(org: TenantOrg): string | null {
  return org.logo_url || null
}
