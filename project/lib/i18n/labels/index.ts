import type { Locale } from '../types'
import * as de from './de'
import * as en from './en'
import * as es from './es'
import * as fr from './fr'
import * as it from './it'
import * as pt from './pt'

export type LabelCatalog = typeof es

const CATALOG: Record<Locale, LabelCatalog> = {
  es,
  en,
  fr,
  de,
  it,
  pt,
}

/** Etiquetas de sistema (enums, estados, roles) por idioma */
export function getLabels(locale: Locale): LabelCatalog {
  return CATALOG[locale] ?? CATALOG.es
}
