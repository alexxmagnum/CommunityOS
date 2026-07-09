/** Idiomas soportados — añadir código aquí y en messages/ + labels/ + content/ */
export const LOCALE_CODES = ['es', 'en', 'fr', 'de', 'it', 'pt'] as const
export type Locale = (typeof LOCALE_CODES)[number]

export const DEFAULT_LOCALE: Locale = 'es'

export const SUPPORTED_LOCALES: { code: Locale; label: string; intl: string }[] = [
  { code: 'es', label: 'Español', intl: 'es-ES' },
  { code: 'en', label: 'English', intl: 'en-GB' },
  { code: 'fr', label: 'Français', intl: 'fr-FR' },
  { code: 'de', label: 'Deutsch', intl: 'de-DE' },
  { code: 'it', label: 'Italiano', intl: 'it-IT' },
  { code: 'pt', label: 'Português', intl: 'pt-PT' },
]

export function isLocale(value: string | null | undefined): value is Locale {
  return (LOCALE_CODES as readonly string[]).includes(value ?? '')
}

export function intlLocaleFor(locale: Locale): string {
  return SUPPORTED_LOCALES.find((l) => l.code === locale)?.intl ?? 'es-ES'
}

/** Resuelve BCP-47 o código corto → Locale */
export function resolveLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE
  if (isLocale(input)) return input
  const lower = input.toLowerCase()
  if (lower.startsWith('en')) return 'en'
  if (lower.startsWith('fr')) return 'fr'
  if (lower.startsWith('de')) return 'de'
  if (lower.startsWith('it')) return 'it'
  if (lower.startsWith('pt')) return 'pt'
  if (lower.startsWith('es')) return 'es'
  return DEFAULT_LOCALE
}

export function localeFromOrg(orgLocale?: string | null): Locale {
  return resolveLocale(orgLocale)
}
