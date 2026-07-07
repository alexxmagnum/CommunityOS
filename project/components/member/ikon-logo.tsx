'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { IKON_BRAND } from '@/lib/org/ikon-brand'
import { cn } from '@/lib/utils'

const WORD = 'IKON'

function SpreadText({
  text,
  width,
  className,
}: {
  text: string
  width?: number | null
  className?: string
}) {
  if (width == null) {
    return <p className={cn('invisible h-[1em]', className)} aria-hidden>{text}</p>
  }

  return (
    <p className={cn('flex w-full justify-between uppercase leading-none', className)} style={{ width }}>
      {text.split('').map((char, index) => (
        <span key={`${char}-${index}`}>{char === ' ' ? '\u00A0' : char}</span>
      ))}
    </p>
  )
}

type IkonLogoProps = {
  size?: 'header' | 'sm' | 'md' | 'lg'
  className?: string
}

export function IkonLogo({ size = 'sm', className }: IkonLogoProps) {
  const isHero = size === 'lg'
  const containerRef = useRef<HTMLDivElement>(null)
  const [blockWidth, setBlockWidth] = useState<number | null>(null)
  const letters = WORD.split('')
  const line2 = IKON_BRAND.logoLine2.toUpperCase()
  const line3 = IKON_BRAND.logoLine3.toUpperCase()

  useLayoutEffect(() => {
    if (!isHero) return

    const measure = () => {
      if (containerRef.current) {
        setBlockWidth(containerRef.current.offsetWidth)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [isHero])

  if (isHero) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'hero-logo-text flex w-[clamp(10.5rem,28vw,17.5rem)] flex-col items-start text-white',
          className,
        )}
        aria-label="IKON Sports & Lounge Sant Jordi"
      >
        <div
          className={cn(
            'ikon-logo-word flex w-full justify-between uppercase leading-[0.9] text-white transition-opacity duration-200',
            blockWidth == null && 'opacity-0',
          )}
          style={{ fontSize: 'clamp(2.35rem, 5vw, 3.35rem)' }}
        >
          {letters.map((char, index) => (
            <span key={`${char}-${index}`}>{char}</span>
          ))}
        </div>

        <SpreadText
          text={line2}
          width={blockWidth}
          className="ikon-logo-sub mt-[0.55rem] text-[9px] font-extralight text-white sm:text-[10px]"
        />

        <SpreadText
          text={line3}
          width={blockWidth}
          className="ikon-logo-sub mt-[0.35rem] text-[9px] font-extralight text-white sm:text-[10px]"
        />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col text-white', className)} aria-label="IKON Sports & Lounge Sant Jordi">
      <div
        className={cn(
          'ikon-logo-word flex uppercase leading-none text-white',
          size === 'header' && 'gap-[0.38em] text-[21px]',
          size === 'sm' && 'gap-[0.42em] text-[15px]',
          size === 'md' && 'justify-center gap-[0.5em] text-[28px]',
        )}
      >
        {letters.map((char, index) => (
          <span key={`${char}-${index}`}>{char}</span>
        ))}
      </div>

      <p
        className={cn(
          'ikon-logo-sub uppercase leading-none text-white',
          size === 'header' && 'mt-0.5 text-[8px] tracking-[0.4em]',
          size === 'sm' && 'mt-1 text-[7px] tracking-[0.38em]',
          size === 'md' && 'mt-2 text-[9px] tracking-[0.42em]',
        )}
      >
        {line2}
      </p>

      <p
        className={cn(
          'ikon-logo-sub uppercase leading-none text-white',
          size === 'header' && 'mt-0.5 text-[8px] tracking-[0.4em]',
          size === 'sm' && 'mt-0.5 text-[7px] tracking-[0.38em]',
          size === 'md' && 'mt-1 text-[9px] tracking-[0.42em]',
        )}
      >
        {line3}
      </p>
    </div>
  )
}
