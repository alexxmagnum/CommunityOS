'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTenant } from '@/contexts/TenantContext'
import { MemberHeader } from '@/components/member/member-header'
import { loadLegalPages, isLegalPageKey } from '@/lib/org/load-legal-pages'
import { LEGAL_PAGE_LABELS } from '@/lib/org/legal-content'
import type { LegalPageContent } from '@/lib/org/legal-content'

export default function LegalPage() {
  const params = useParams<{ page: string }>()
  const { org, path } = useTenant()
  const [content, setContent] = useState<LegalPageContent | null>(null)

  const pageKey = isLegalPageKey(params.page) ? params.page : null

  useEffect(() => {
    if (!pageKey) return
    loadLegalPages(org.id, org.slug, org.name).then((pages) => setContent(pages[pageKey]))
  }, [org.id, org.slug, org.name, pageKey])

  if (!pageKey) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-muted-foreground">Página no encontrada.</p>
        <Link href={path()} className="mt-4 inline-block text-sm text-motanos hover:underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <>
      <MemberHeader />
      <article className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{org.name}</p>
        <h1 className="font-display mt-2 text-3xl md:text-4xl">
          {content?.title ?? LEGAL_PAGE_LABELS[pageKey]}
        </h1>
        {content?.updated_at && (
          <p className="mt-2 text-sm text-muted-foreground">Actualizado: {content.updated_at}</p>
        )}
        <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert">
          {(content?.body ?? '').split('\n\n').map((para, i) => (
            <p key={i} className="leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </div>
        <Link href={path()} className="mt-12 inline-block text-sm font-medium text-motanos hover:underline">
          ← Volver al club
        </Link>
      </article>
    </>
  )
}
