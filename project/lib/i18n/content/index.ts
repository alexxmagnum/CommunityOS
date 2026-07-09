import { DEFAULT_LOCALE, type Locale } from '../types'
import { LEGACY_SEED_BY_LOCALE } from './legacy-seed'

/** Traduce una cadena de contenido tenant (fallback seed legacy). */
export function localizeContent(locale: Locale, value?: string | null): string {
  if (!value) return ''
  if (locale === 'en') return value
  return LEGACY_SEED_BY_LOCALE[locale][value] ?? value
}

export function localizeFacility<T extends { name: string; description?: string | null }>(
  locale: Locale,
  row: T
): T {
  return {
    ...row,
    name: localizeContent(locale, row.name),
    description: row.description ? localizeContent(locale, row.description) : row.description,
  }
}

export function localizeEvent<
  T extends { title: string; description?: string | null; location_details?: string | null },
>(locale: Locale, row: T): T {
  return {
    ...row,
    title: localizeContent(locale, row.title),
    description: row.description ? localizeContent(locale, row.description) : row.description,
    location_details: row.location_details
      ? localizeContent(locale, row.location_details)
      : row.location_details,
  }
}

export function localizeMenuCategory<T extends { name: string }>(locale: Locale, row: T): T {
  return { ...row, name: localizeContent(locale, row.name) }
}

export function localizeDish<T extends { name: string; description?: string | null }>(
  locale: Locale,
  row: T
): T {
  return {
    ...row,
    name: localizeContent(locale, row.name),
    description: row.description ? localizeContent(locale, row.description) : row.description,
  }
}

export function localizeActivity<T extends { title?: string | null; description?: string | null }>(
  locale: Locale,
  row: T
): T {
  return {
    ...row,
    title: row.title ? localizeContent(locale, row.title) : row.title,
    description: row.description ? localizeContent(locale, row.description) : row.description,
  }
}

/** Atajos con locale por defecto (español) — compatibilidad con imports antiguos */
export function localizeSeedContent(value?: string | null, locale: Locale = DEFAULT_LOCALE) {
  return localizeContent(locale, value)
}

export function localizeFacilityRow<T extends { name: string; description?: string | null }>(
  row: T,
  locale: Locale = DEFAULT_LOCALE
) {
  return localizeFacility(locale, row)
}

export function localizeEventRow<
  T extends { title: string; description?: string | null; location_details?: string | null },
>(row: T, locale: Locale = DEFAULT_LOCALE) {
  return localizeEvent(locale, row)
}

export function localizeMenuCategoryRow<T extends { name: string }>(
  row: T,
  locale: Locale = DEFAULT_LOCALE
) {
  return localizeMenuCategory(locale, row)
}

export function localizeDishRow<T extends { name: string; description?: string | null }>(
  row: T,
  locale: Locale = DEFAULT_LOCALE
) {
  return localizeDish(locale, row)
}

export function localizeActivityRow<
  T extends { title?: string | null; description?: string | null },
>(row: T, locale: Locale = DEFAULT_LOCALE) {
  return localizeActivity(locale, row)
}
