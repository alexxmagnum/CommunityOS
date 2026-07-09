export type LegalPageKey = 'privacy' | 'terms' | 'cookies'

export interface LegalPageContent {
  title: string
  body: string
  updated_at: string
}

export type LegalPagesMap = Record<LegalPageKey, LegalPageContent>

const DEFAULT_LEGAL: LegalPagesMap = {
  privacy: {
    title: 'Política de privacidad',
    updated_at: '2026-07-01',
    body: `Respetamos tu privacidad. Recopilamos datos de cuenta y uso necesarios para operar el club. Los datos se almacenan de forma segura con aislamiento por organización.

Puedes solicitar acceso, rectificación o eliminación escribiendo al administrador del club.`,
  },
  terms: {
    title: 'Términos de uso',
    updated_at: '2026-07-01',
    body: `Al usar esta plataforma aceptas las normas del club y el uso responsable de las reservas y eventos.

Las cuentas son personales. El club puede suspender el acceso por incumplimiento de estas condiciones.`,
  },
  cookies: {
    title: 'Política de cookies',
    updated_at: '2026-07-01',
    body: `Usamos cookies esenciales para sesión y preferencias. Las cookies analíticas solo se activan si las aceptas en el banner correspondiente.`,
  },
}

const DEMO_LEGAL: Record<string, Partial<LegalPagesMap>> = {
  ikon: {
    privacy: {
      title: 'Privacidad — IKON Golf Club',
      updated_at: '2026-07-01',
      body: `IKON trata tus datos conforme al RGPD. Usamos tu información para gestionar tu membresía, reservas de salida en el campo, inscripciones a torneos y comunicaciones del club.

Contacto DPO: privacidad@ikon.club`,
    },
  },
  marina: {
    privacy: {
      title: 'Privacidad — Marina Beach Club',
      updated_at: '2026-07-01',
      body: `Marina Beach Club protege tus datos personales. Utilizamos la información para reservas de hamacas, actividades náuticas y eventos en la playa.

Contacto: privacidad@marina.club`,
    },
    terms: {
      title: 'Normas del club — Marina',
      updated_at: '2026-07-01',
      body: `El acceso a instalaciones náuticas y zona playa requiere cumplir las normas de seguridad marítima y convivencia del club.`,
    },
  },
}

export function getDefaultLegalPages(orgName: string, slug?: string): LegalPagesMap {
  const club = orgName || slug || 'el club'
  const demoOverrides = slug ? DEMO_LEGAL[slug] : undefined

  return {
    privacy: demoOverrides?.privacy ?? {
      ...DEFAULT_LEGAL.privacy,
      title: `Política de privacidad — ${club}`,
      body: `${club} trata tus datos conforme al RGPD. Usamos tu información para gestionar tu membresía, reservas, inscripciones a eventos y comunicaciones del club.

Puedes solicitar acceso, rectificación o eliminación escribiendo al administrador del club.`,
    },
    terms: demoOverrides?.terms ?? {
      ...DEFAULT_LEGAL.terms,
      title: `Términos de uso — ${club}`,
    },
    cookies: demoOverrides?.cookies ?? { ...DEFAULT_LEGAL.cookies },
  }
}

export const LEGAL_PAGE_LABELS: Record<LegalPageKey, string> = {
  privacy: 'Privacidad',
  terms: 'Términos',
  cookies: 'Cookies',
}
