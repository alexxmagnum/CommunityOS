'use client'

import Link from 'next/link'
import type { DiscoveryPrompt } from '@/lib/org/types'
import { ArrowRight } from 'lucide-react'

export function DiscoveryFeed({
  prompts,
  showHeader = true,
}: {
  prompts: DiscoveryPrompt[]
  showHeader?: boolean
}) {
  if (prompts.length === 0) return null

  return (
    <section aria-label="Descubrir experiencias">
      {showHeader && (
        <div className="mb-8">
          <p className="label-caps">Ahora mismo</p>
          <h2 className="font-display mt-3 text-4xl text-foreground md:text-5xl">
            ¿Qué te apetece hoy?
          </h2>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {prompts.map((prompt) => (
          <Link
            key={prompt.id}
            href={prompt.href}
            className="group relative snap-start flex min-w-[300px] max-w-[340px] flex-col justify-end overflow-hidden rounded-3xl bg-neutral-900 p-6 min-h-[220px]"
          >
            {prompt.image_url && (
              <>
                <img src={prompt.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              </>
            )}
            {!prompt.image_url && (
              <div className="absolute inset-0 bg-neutral-800" />
            )}
            <div className="relative">
              <p className="text-lg font-medium leading-snug text-white">{prompt.message}</p>
              {prompt.subtext && (
                <p className="mt-1.5 text-sm text-white/60">{prompt.subtext}</p>
              )}
              <span className="mt-5 inline-flex items-center text-[12px] font-medium uppercase tracking-wider text-motanos">
                Reservar <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
