import { MOTANOS } from './motanos-brand'

export { MOTANOS }

/** Preset opcional del primer tenant demo (IKON). Los clubs reales usan `organizations` + settings. */
export const IKON_BRAND = {
  ink: '#0A0A0A',
  elevated: '#141414',
  /** Texto sobre fondo oscuro */
  primary: '#FAFAFA',
  secondary: '#141414',
  accent: MOTANOS.teal,
  accentCyan: MOTANOS.cyan,
  accentLime: MOTANOS.lime,
  gradient: MOTANOS.gradient,
  surface: '#0A0A0A',
  muted: '#737373',
  tagline: 'Sports & Lounge · Sant Jordi',
  logoLine2: 'Sports & Lounge',
  logoLine3: 'Sant Jordi',
  logoImage: '/brand/ikon-logo.png',
  heroEyebrowKicker: 'Panorámica Golf',
  heroEyebrow: 'Golf · Sports · Lounge',
  heroTitleLine1: 'Un estilo',
  heroTitleLine2: 'de vida.',
  heroTitleLine3: 'Una pasión',
  heroTitleLine4: 'eterna.',
  heroSubtitle:
    'Descubre un lugar mágico donde el deporte, la naturaleza y la exclusividad crean una experiencia única.',
} as const
