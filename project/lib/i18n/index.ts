import { messages as en } from './messages/en'
import { messages as es } from './messages/es'
import { messages as pt } from './messages/pt'
import type { MessageTree } from './messages/es'

export type Locale = 'es' | 'en' | 'pt'

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
]

const CATALOG: Record<Locale, MessageTree> = { es, en, pt }

const LOCALE_COOKIE = 'community_os_locale'

export function resolveLocale(input?: string | null): Locale {
  if (input === 'en' || input === 'en-US' || input === 'en-GB') return 'en'
  if (input === 'pt' || input === 'pt-PT' || input === 'pt-BR') return 'pt'
  return 'es'
}

export function localeFromOrg(orgLocale?: string | null): Locale {
  if (!orgLocale) return 'es'
  if (orgLocale.startsWith('en')) return 'en'
  if (orgLocale.startsWith('pt')) return 'pt'
  return 'es'
}

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
  return value === 'en' || value === 'pt' || value === 'es' ? value : null
}

export function writeLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`
}

// Re-export label helpers from es module (backward compatible)
export {
  labelEventType,
  labelTier,
  labelMemberStatus,
  labelReservationStatus,
  EVENT_TYPE_LABELS,
} from './es'
