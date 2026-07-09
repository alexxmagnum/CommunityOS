/** Formatea importe según locale y moneda del tenant */
import { DEFAULT_LOCALE, intlLocaleFor, type Locale } from './types'

export function formatMoney(
  amount: number,
  options?: { locale?: Locale | string; currency?: string }
): string {
  const locale =
    options?.locale && typeof options.locale === 'string' && options.locale.length === 2
      ? intlLocaleFor(options.locale as Locale)
      : options?.locale
        ? String(options.locale)
        : intlLocaleFor(DEFAULT_LOCALE)
  const currency = options?.currency ?? 'EUR'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}
