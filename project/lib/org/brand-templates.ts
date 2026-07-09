import type { TenantBranding } from './types'

export type BrandTemplateId =
  | 'luxe-dark'
  | 'coastal'
  | 'classic-light'
  | 'sport-energy'
  | 'blank'

export interface BrandTemplate {
  id: BrandTemplateId
  name: string
  description: string
  tier: 'premium' | 'standard'
  preview: { primary: string; secondary: string; accent: string }
  org: {
    primary_color: string
    secondary_color: string
    accent_color: string
    font_family: string
    theme_mode: 'light' | 'dark' | 'system'
  }
  hero: {
    hero_image_url: string
    hero_tagline: string
  }
  experience: TenantBranding & {
    hero_style: 'standard' | 'cinematic'
    splash_style: 'none' | 'reveal' | 'golf'
  }
}

/** Plantillas curadas — un club nuevo elige una y personaliza sin tocar código. */
export const BRAND_TEMPLATES: BrandTemplate[] = [
  {
    id: 'luxe-dark',
    name: 'Luxe Oscuro',
    description: 'Oscuro, serif elegante, hero cinemático. Ideal golf & lifestyle.',
    tier: 'premium',
    preview: { primary: '#0A0A0A', secondary: '#141414', accent: '#32E4B5' },
    org: {
      primary_color: '#0A0A0A',
      secondary_color: '#141414',
      accent_color: '#32E4B5',
      font_family: 'Instrument Serif',
      theme_mode: 'dark',
    },
    hero: {
      hero_image_url: '',
      hero_tagline:
        'Descubre un lugar donde el deporte, la naturaleza y la exclusividad crean una experiencia única.',
    },
    experience: {
      hero_style: 'cinematic',
      splash_style: 'reveal',
      tagline: 'Sports & Lounge',
      hero_eyebrow_kicker: 'Club privado',
      hero_eyebrow: 'Deporte · Gastronomía · Eventos',
      hero_title_lines: ['Un estilo', 'de vida.', 'Una pasión', 'eterna.'],
      hero_title_mobile: 'Un estilo de vida. Una pasión eterna.',
      hero_highlights: ['Campo', 'Restaurante', 'Eventos', 'Academia', 'Lounge'],
      hero_stats: [
        { value: '500+', label: 'Socios' },
        { value: '18', label: 'Hoyos' },
        { value: '365', label: 'Días abierto' },
        { value: '4.9★', label: 'Valoración' },
      ],
    },
  },
  {
    id: 'coastal',
    name: 'Costa Premium',
    description: 'Azul profundo, acentos turquesa, sensación marina de lujo.',
    tier: 'premium',
    preview: { primary: '#050C12', secondary: '#0A1620', accent: '#3FE0D4' },
    org: {
      primary_color: '#050C12',
      secondary_color: '#0A1620',
      accent_color: '#3FE0D4',
      font_family: 'Playfair Display',
      theme_mode: 'dark',
    },
    hero: {
      hero_image_url:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80',
      hero_tagline:
        'Sol, mar y experiencias exclusivas en un club diseñado para disfrutar cada momento.',
    },
    experience: {
      hero_style: 'cinematic',
      splash_style: 'reveal',
      tagline: 'Beach Club · Mediterráneo',
      hero_eyebrow_kicker: 'Frente al mar',
      hero_eyebrow: 'Playa · Deporte · Gastronomía',
      hero_title_lines: ['Vive el', 'Mediterráneo.', 'Sin', 'límites.'],
      hero_title_mobile: 'Vive el Mediterráneo sin límites.',
      hero_highlights: ['Hamacas VIP', 'Paddle', 'Regatas', 'Restaurante', 'Spa'],
      hero_stats: [
        { value: '200+', label: 'Socios' },
        { value: '8', label: 'Pistas' },
        { value: '12', label: 'Meses temporada' },
        { value: '5★', label: 'Experiencia' },
      ],
    },
  },
  {
    id: 'classic-light',
    name: 'Clásico Claro',
    description: 'Claro y atemporal. Perfecto para clubs tradicionales.',
    tier: 'standard',
    preview: { primary: '#1F2937', secondary: '#F8FAFC', accent: '#2563EB' },
    org: {
      primary_color: '#1F2937',
      secondary_color: '#F8FAFC',
      accent_color: '#2563EB',
      font_family: 'Playfair Display',
      theme_mode: 'light',
    },
    hero: {
      hero_image_url:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80',
      hero_tagline: 'Tradición, deporte y comunidad en un entorno excepcional.',
    },
    experience: {
      hero_style: 'standard',
      splash_style: 'none',
      tagline: 'Club deportivo',
      hero_eyebrow_kicker: 'Bienvenido',
      hero_eyebrow: 'Deporte · Comunidad',
      hero_title_lines: ['Tu club,', 'tu estilo', 'de vida.'],
      hero_title_mobile: 'Tu club, tu estilo de vida.',
      hero_highlights: ['Instalaciones', 'Torneos', 'Restaurante', 'Eventos'],
      hero_stats: [
        { value: '300+', label: 'Socios' },
        { value: '10+', label: 'Deportes' },
        { value: '50+', label: 'Eventos/año' },
        { value: '4.8★', label: 'Valoración' },
      ],
    },
  },
  {
    id: 'sport-energy',
    name: 'Energía Deportiva',
    description: 'Dinámico, vibrante. Pádel, tenis y fitness.',
    tier: 'standard',
    preview: { primary: '#0A0A0B', secondary: '#121214', accent: '#FF8A3D' },
    org: {
      primary_color: '#0A0A0B',
      secondary_color: '#121214',
      accent_color: '#FF8A3D',
      font_family: 'Poppins',
      theme_mode: 'dark',
    },
    hero: {
      hero_image_url:
        'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1920&q=80',
      hero_tagline: 'Entrena, compite y conecta en el club deportivo más activo de la zona.',
    },
    experience: {
      hero_style: 'cinematic',
      splash_style: 'reveal',
      tagline: 'Deporte · Comunidad',
      hero_eyebrow_kicker: 'Alto rendimiento',
      hero_eyebrow: 'Pádel · Tenis · Fitness',
      hero_title_lines: ['Juega', 'más fuerte.', 'Vive', 'mejor.'],
      hero_title_mobile: 'Juega más fuerte. Vive mejor.',
      hero_highlights: ['Pádel', 'Tenis', 'Fitness', 'Torneos', 'Pro shop'],
      hero_stats: [
        { value: '12', label: 'Pistas' },
        { value: '1.2k', label: 'Socios' },
        { value: '24/7', label: 'Gimnasio' },
        { value: '4.9★', label: 'Valoración' },
      ],
    },
  },
  {
    id: 'blank',
    name: 'En blanco',
    description: 'Empieza desde cero con valores neutros.',
    tier: 'standard',
    preview: { primary: '#18181B', secondary: '#FAFAFA', accent: '#3B82F6' },
    org: {
      primary_color: '#18181B',
      secondary_color: '#FAFAFA',
      accent_color: '#3B82F6',
      font_family: 'Inter',
      theme_mode: 'light',
    },
    hero: {
      hero_image_url: '',
      hero_tagline: '',
    },
    experience: {
      hero_style: 'standard',
      splash_style: 'none',
      tagline: '',
      hero_eyebrow_kicker: '',
      hero_eyebrow: '',
      hero_title_lines: [],
      hero_title_mobile: '',
      hero_highlights: [],
      hero_stats: [],
    },
  },
]

export function getBrandTemplate(id: BrandTemplateId): BrandTemplate | undefined {
  return BRAND_TEMPLATES.find((t) => t.id === id)
}

export type BrandingFormState = {
  name: string
  logo_url: string
  favicon_url: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  theme_mode: 'light' | 'dark' | 'system'
  hero_image_url: string
  hero_tagline: string
  hero_style: 'standard' | 'cinematic'
  splash_style: 'none' | 'reveal' | 'golf'
  tagline: string
  hero_eyebrow_kicker: string
  hero_eyebrow: string
  hero_title_line_1: string
  hero_title_line_2: string
  hero_title_line_3: string
  hero_title_line_4: string
  hero_title_mobile: string
  hero_highlights: string
  hero_stats: string
}

export function applyBrandTemplate(
  template: BrandTemplate,
  currentName: string
): BrandingFormState {
  const lines = template.experience.hero_title_lines ?? []
  const stats = template.experience.hero_stats ?? []
  return {
    name: currentName || '',
    logo_url: '',
    favicon_url: '',
    ...template.org,
    hero_image_url: template.hero.hero_image_url,
    hero_tagline: template.hero.hero_tagline,
    hero_style: template.experience.hero_style,
    splash_style: template.experience.splash_style,
    tagline: template.experience.tagline ?? '',
    hero_eyebrow_kicker: template.experience.hero_eyebrow_kicker ?? '',
    hero_eyebrow: template.experience.hero_eyebrow ?? '',
    hero_title_line_1: lines[0] ?? '',
    hero_title_line_2: lines[1] ?? '',
    hero_title_line_3: lines[2] ?? '',
    hero_title_line_4: lines[3] ?? '',
    hero_title_mobile: template.experience.hero_title_mobile ?? '',
    hero_highlights: (template.experience.hero_highlights ?? []).join(', '),
    hero_stats: stats.map((s) => `${s.value}|${s.label}`).join('\n'),
  }
}

export function brandingFormToExperience(
  form: BrandingFormState
): TenantBranding & { hero_style: 'standard' | 'cinematic'; splash_style: 'none' | 'reveal' | 'golf' } {
  const titleLines = [
    form.hero_title_line_1,
    form.hero_title_line_2,
    form.hero_title_line_3,
    form.hero_title_line_4,
  ].filter(Boolean)

  const highlights = form.hero_highlights
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const stats = form.hero_stats
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split('|')
      return { value: value?.trim() ?? '', label: rest.join('|').trim() }
    })
    .filter((s) => s.value && s.label)

  return {
    hero_style: form.hero_style,
    splash_style: form.splash_style,
    tagline: form.tagline || null,
    hero_eyebrow_kicker: form.hero_eyebrow_kicker || null,
    hero_eyebrow: form.hero_eyebrow || null,
    hero_title_lines: titleLines.length > 0 ? titleLines : undefined,
    hero_title_mobile: form.hero_title_mobile || null,
    hero_highlights: highlights.length > 0 ? highlights : undefined,
    hero_stats: stats.length > 0 ? stats : undefined,
  }
}

export function experienceToBrandingForm(
  experience: Partial<TenantBranding> & {
    hero_style?: 'standard' | 'cinematic'
    splash_style?: 'none' | 'reveal' | 'golf'
  }
): Partial<BrandingFormState> {
  const lines = experience.hero_title_lines ?? []
  return {
    hero_style: experience.hero_style ?? 'standard',
    splash_style: experience.splash_style ?? 'none',
    tagline: experience.tagline ?? '',
    hero_eyebrow_kicker: experience.hero_eyebrow_kicker ?? '',
    hero_eyebrow: experience.hero_eyebrow ?? '',
    hero_title_line_1: lines[0] ?? '',
    hero_title_line_2: lines[1] ?? '',
    hero_title_line_3: lines[2] ?? '',
    hero_title_line_4: lines[3] ?? '',
    hero_title_mobile: experience.hero_title_mobile ?? '',
    hero_highlights: (experience.hero_highlights ?? []).join(', '),
    hero_stats: (experience.hero_stats ?? []).map((s) => `${s.value}|${s.label}`).join('\n'),
  }
}
