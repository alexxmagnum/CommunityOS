'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const HERO_IMAGE = '/hero/ikon-hero.jpg'
export const HERO_IMAGE_MOBILE = '/hero/ikon-hero-mobile.png'

export const HERO_IMAGE_FALLBACKS = [
  HERO_IMAGE,
  'https://images.unsplash.com/photo-1535131749006-ba7a34837537?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1592919505787-d974d9d6c9b2?auto=format&fit=crop&w=1920&q=80',
]

type HeroBackgroundProps = {
  className?: string
  /** Imagen concreta (p. ej. hero móvil). Si falla, usa fallbacks globales. */
  image?: string
}

/** Foto a ancho del marco, altura proporcional — sin zoom ni recorte */
export function HeroBackground({ className, image }: HeroBackgroundProps) {
  const sources = image ? [image, ...HERO_IMAGE_FALLBACKS] : HERO_IMAGE_FALLBACKS
  const [index, setIndex] = useState(0)
  const src = sources[index]
  const isLast = index >= sources.length - 1

  return (
    <img
      src={src}
      alt=""
      fetchPriority="high"
      decoding="async"
      width={1920}
      height={1080}
      className={cn('block w-full max-w-full', className ?? 'hero-image-natural')}
      onError={() => {
        if (!isLast) setIndex((i) => i + 1)
      }}
    />
  )
}
