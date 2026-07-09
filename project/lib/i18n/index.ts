/**
 * i18n — arquitectura escalable
 *
 * Idiomas: es, en, fr, de, it, pt
 *
 * - `messages/`     → copy de UI (botones, títulos de pantalla)
 * - `labels/`       → enums y estados del sistema (getLabels(locale))
 * - `content/`      → fallback seed legacy + localize al cargar datos
 * - `types.ts`      → Locale, DEFAULT_LOCALE, resolveLocale
 *
 * Uso en componentes: `const { t, locale } = useLocale()` + `const labels = useLabels()`
 * Uso en loaders:     `resolveAppLocale({ orgLocale })` + `localizeFacility(locale, row)`
 */
import { messages as de } from './messages/de'
import { messages as en } from './messages/en'
import { messages as es } from './messages/es'
import { messages as fr } from './messages/fr'
import { messages as it } from './messages/it'
import { messages as pt } from './messages/pt'
import type { MessageTree } from './messages/es'
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  intlLocaleFor,
  isLocale,
  localeFromOrg,
  resolveLocale,
  type Locale,
} from './types'

export type { Locale, MessageTree }
export {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  intlLocaleFor,
  isLocale,
  localeFromOrg,
  resolveLocale,
  LOCALE_CODES,
} from './types'

export const LOCALES = SUPPORTED_LOCALES.map(({ code, label }) => ({ code, label }))

const CATALOG: Record<Locale, MessageTree> = { es, en, fr, de, it, pt }

const LOCALE_COOKIE = 'community_os_locale'

export function getMessages(locale: Locale): MessageTree {
  return CATALOG[locale]
}

export function t(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const parts = key.split('.')
  let node: unknown = CATALOG[locale]
  for (const part of parts) {
    if (node && typeof node === 'object' && part in (node as object)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return key
    }
  }
  if (typeof node !== 'string') return key
  if (!vars) return node
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
    node
  )
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const value = match?.[1]
  return isLocale(value) ? value : null
}

export function writeLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`
}

/** Prioridad: cookie usuario → locale org → español */
export function resolveAppLocale(input?: {
  orgLocale?: string | null
  userLocale?: Locale | null
}): Locale {
  if (input?.userLocale) return input.userLocale
  const cookie = readLocaleCookie()
  if (cookie) return cookie
  if (input?.orgLocale) return localeFromOrg(input.orgLocale)
  return DEFAULT_LOCALE
}

export { getLabels, type LabelCatalog } from './labels'
export {
  localizeContent,
  localizeFacility,
  localizeEvent,
  localizeMenuCategory,
  localizeDish,
  localizeActivity,
} from './content'

// Re-export español por defecto (imports legacy `@/lib/i18n/es`)
export {
  labelEventType,
  labelTier,
  labelMemberStatus,
  labelReservationStatus,
  labelRole,
  labelPlatformRole,
  labelSportName,
  labelReservationType,
  labelActivityType,
  labelEventStatus,
  formatBillingLimit,
  formatPlanLimits,
  translateEmailProviderError,
  translateAuthError,
  EVENT_TYPE_LABELS,
} from './labels/es'
