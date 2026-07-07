'use client'

import { LOCALES } from '@/lib/i18n'
import { useLocale } from '@/contexts/LocaleContext'
import { cn } from '@/lib/utils'

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale()

  return (
    <div className={cn('flex items-center gap-1 rounded-full border border-white/15 bg-black/20 p-0.5', className)}>
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
            locale === code ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'
          )}
          aria-label={label}
        >
          {code}
        </button>
      ))}
    </div>
  )
}
