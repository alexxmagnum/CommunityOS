/** Formatea importe según locale y moneda del tenant */
export function formatMoney(
  amount: number,
  options?: { locale?: string; currency?: string }
): string {
  const locale = options?.locale ?? 'es-ES'
  const currency = options?.currency ?? 'EUR'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}
