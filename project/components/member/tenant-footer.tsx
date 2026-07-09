'use client'

import Link from 'next/link'
import { useTenant } from '@/contexts/TenantContext'
import { LEGAL_PAGE_LABELS, type LegalPageKey } from '@/lib/org/legal-content'

const LEGAL_KEYS: LegalPageKey[] = ['privacy', 'terms', 'cookies']

export function TenantFooter() {
  const { org, path } = useTenant()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-black/5 bg-[var(--org-surface,hsl(var(--background)))] px-6 py-12 dark:border-white/10 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg text-[var(--org-primary,var(--org-ink))]">{org.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            © {year} {org.name}. Todos los derechos reservados.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {LEGAL_KEYS.map((key) => (
            <Link
              key={key}
              href={path(`/legal/${key}`)}
              className="text-muted-foreground transition-colors hover:text-[var(--org-accent)]"
            >
              {LEGAL_PAGE_LABELS[key]}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
