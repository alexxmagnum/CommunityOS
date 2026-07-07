'use client'

import { IKON_BRAND } from '@/lib/org/ikon-brand'

export function HeroIkonHeadline() {
  return (
    <>
      <p className="max-w-md text-[11px] font-medium uppercase leading-relaxed tracking-[0.22em] text-white md:leading-6">
        {IKON_BRAND.heroEyebrow}
      </p>

      <h1 className="font-display mt-10 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.15] text-white">
        <span className="block">{IKON_BRAND.heroTitleLine1}</span>
        <span className="mt-3 block md:mt-4">{IKON_BRAND.heroTitleLine2}</span>
      </h1>
    </>
  )
}
