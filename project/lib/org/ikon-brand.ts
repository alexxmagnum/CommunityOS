/** Paleta Motanos — cyan → teal → lime (referencia logo M) */
export const MOTANOS = {
  cyan: '#35CFFF',
  teal: '#32E4B5',
  lime: '#C8FF3D',
  gradient: 'linear-gradient(90deg, #35CFFF 0%, #32E4B5 45%, #C8FF3D 100%)',
  gradientSoft: 'linear-gradient(90deg, rgba(53,207,255,0.15) 0%, rgba(50,228,181,0.15) 45%, rgba(200,255,61,0.15) 100%)',
} as const

/** Identidad IKON — negro + blanco + acento Motanos */
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
