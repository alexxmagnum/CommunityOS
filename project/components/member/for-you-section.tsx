'use client'

import Link from 'next/link'
import type { DiscoveryPrompt } from '@/lib/org/types'

export function ForYouSection({ prompts, title = 'Para ti' }: { prompts: DiscoveryPrompt[]; title?: string }) {
  if (!prompts.length) return null

  return (
    <section>
      <div className="mb-6">
        <p className="label-caps">Personalizado</p>
        <h2 className="font-display mt-2 text-3xl text-foreground md:text-4xl">{title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.slice(0, 3).map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="font-medium text-foreground group-hover:text-motanos">{p.message}</p>
            {p.subtext && <p className="mt-1 text-sm text-muted-foreground">{p.subtext}</p>}
          </Link>
        ))}
      </div>
    </section>
  )
}
