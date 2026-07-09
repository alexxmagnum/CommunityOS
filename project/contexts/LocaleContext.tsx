'use client'

/**
 * Provider de idioma — español por defecto.
 * Idiomas: es, en, fr, de, it, pt
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  getMessages,
  getLabels,
  localeFromOrg,
  readLocaleCookie,
  resolveLocale,
  t as translate,
  writeLocaleCookie,
  type Locale,
} from '@/lib/i18n'
import type { LabelCatalog } from '@/lib/i18n/labels'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({
  defaultLocale,
  children,
}: {
  defaultLocale?: string | null
  children: React.ReactNode
}) {
  const orgLocale = localeFromOrg(defaultLocale)
  const [locale, setLocaleState] = useState<Locale>(orgLocale)

  useEffect(() => {
    const stored = readLocaleCookie()
    setLocaleState(stored ?? orgLocale)
  }, [orgLocale])

  const setLocale = (next: Locale) => {
    writeLocaleCookie(next)
    setLocaleState(next)
    document.documentElement.lang = next
  }

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale]
  )

  // Warm messages tree (ensures tree-shaking keeps all locales bundled)
  useEffect(() => {
    getMessages(locale)
    document.documentElement.lang = locale
  }, [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    return {
      locale: 'es' as Locale,
      setLocale: () => {},
      t: (key: string, vars?: Record<string, string | number>) => translate('es', key, vars),
    }
  }
  return ctx
}

/** Etiquetas de sistema (enums, estados) según el idioma activo */
export function useLabels(): LabelCatalog {
  const { locale } = useLocale()
  return useMemo(() => getLabels(locale), [locale])
}

export function useResolvedLocale(input?: string | null): Locale {
  return resolveLocale(input)
}
