'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IKON_BRAND } from '@/lib/org/ikon-brand'
import { bindGolfHitAudio, playGolfHitSound, unlockSplashAudio } from '@/lib/splash/golf-hit-sound'
import { forceUnlockBodyScroll, lockBodyScroll, unlockBodyScroll } from '@/lib/dom/body-scroll-lock'
import { cn } from '@/lib/utils'
import { GolfGrassBurst } from '@/components/member/golf-grass-burst'

const LETTERS = ['I', 'K', 'O', 'N'] as const
const LINE2 = IKON_BRAND.logoLine2.toUpperCase()
const LINE3 = IKON_BRAND.logoLine3.toUpperCase()
const TYPE_MS = 48
const SPREAD_MS = 900
const STAGGER_MS = 90
const SPLASH_PAD = 32
const LOGO_BLOCK_WIDTH = 17.5
const GOLF_BALL_IMAGE = '/splash/golf-ball.png'
const GOLF_BALL_MOBILE = '/splash/golf-ball-mobile.jpg?v=2'
const GOLF_IMPACT_IMAGE = '/splash/golf-ball-impact.png'
const GOLF_IMPACT_MOBILE = '/splash/golf-ball-impact-mobile.jpg?v=2'
const MOBILE_MEDIA = '(max-width: 768px), (max-aspect-ratio: 3/4)'
const SPLASH_SEEN_KEY = 'ikon-splash-seen'
const MAX_SPLASH_MS = 9000

function shouldSkipSplash() {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem(SPLASH_SEEN_KEY)) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function SpreadReveal({
  text,
  revealCount,
  className,
  active,
}: {
  text: string
  revealCount: number
  className?: string
  active: boolean
}) {
  return (
    <p className={cn('flex w-full justify-between uppercase leading-none', className)}>
      {text.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={cn(
            'transition-opacity duration-150',
            active && index < revealCount ? 'opacity-100' : 'opacity-0',
          )}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </p>
  )
}

type Phase =
  | 'measure'
  | 'spread'
  | 'line2'
  | 'line3'
  | 'hold'
  | 'golf'
  | 'impact'
  | 'exit'

function preloadImages(sources: string[]) {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = src
        }),
    ),
  )
}

export function IkonSplash() {
  const blockRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLDivElement>(null)
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
  const impactHandled = useRef(false)
  const [offsets, setOffsets] = useState<number[] | null>(null)
  const [phase, setPhase] = useState<Phase>('measure')
  const [line2Count, setLine2Count] = useState(0)
  const [line3Count, setLine3Count] = useState(0)
  const [mounted, setMounted] = useState(() => !shouldSkipSplash())
  const [scale, setScale] = useState(1)
  const [imagesReady, setImagesReady] = useState(false)

  const showLogo = phase !== 'impact' && phase !== 'exit'
  const showGolf =
    imagesReady &&
    (phase === 'hold' || phase === 'golf' || phase === 'impact' || phase === 'exit')

  const fitToViewport = useCallback(() => {
    const block = blockRef.current
    if (!block || !showLogo) return

    const width = block.offsetWidth
    const height = block.offsetHeight
    if (!width || !height) return

    const maxW = window.innerWidth - SPLASH_PAD * 2
    const maxH = window.innerHeight - SPLASH_PAD * 2
    setScale(Math.min(maxW / width, maxH / height))
  }, [showLogo])

  useEffect(() => {
    const unlock = () => unlockSplashAudio()

    document.addEventListener('pointerdown', unlock, { passive: true })
    document.addEventListener('touchstart', unlock, { passive: true })
    document.addEventListener('keydown', unlock)

    void preloadImages([
      GOLF_BALL_IMAGE,
      GOLF_BALL_MOBILE,
      GOLF_IMPACT_IMAGE,
      GOLF_IMPACT_MOBILE,
    ]).then(() => setImagesReady(true))

    return () => {
      document.removeEventListener('pointerdown', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])

  useLayoutEffect(() => {
    const wordRow = wordRef.current
    const block = blockRef.current
    if (!wordRow || !block) return

    const measure = () => {
      const rowCenter = wordRow.offsetWidth / 2
      const next = LETTERS.map((_, index) => {
        const el = letterRefs.current[index]
        if (!el) return 0
        const rect = el.getBoundingClientRect()
        const parent = wordRow.getBoundingClientRect()
        const letterCenter = rect.left - parent.left + rect.width / 2
        return rowCenter - letterCenter
      })
      setOffsets(next)
    }

    measure()
    fitToViewport()

    const observer = new ResizeObserver(() => {
      measure()
      fitToViewport()
    })
    observer.observe(block)

    const onResize = () => {
      measure()
      fitToViewport()
    }
    window.addEventListener('resize', onResize)
    requestAnimationFrame(() => setPhase('spread'))

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [fitToViewport])

  const finish = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    }
    forceUnlockBodyScroll()
    setMounted(false)
  }, [])

  useEffect(() => {
    if (!mounted) return
    lockBodyScroll()
    const maxTimer = window.setTimeout(() => finish(), MAX_SPLASH_MS)
    return () => {
      window.clearTimeout(maxTimer)
      unlockBodyScroll()
    }
  }, [mounted, finish])

  useEffect(() => {
    fitToViewport()
  }, [fitToViewport, phase, line2Count, line3Count])

  useEffect(() => {
    if (phase !== 'spread') return
    const timer = window.setTimeout(
      () => setPhase('line2'),
      SPREAD_MS + STAGGER_MS * (LETTERS.length - 1) + 120,
    )
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'line2') return
    if (line2Count >= LINE2.length) {
      setPhase('line3')
      return
    }
    const timer = window.setTimeout(() => setLine2Count((count) => count + 1), TYPE_MS)
    return () => window.clearTimeout(timer)
  }, [phase, line2Count])

  useEffect(() => {
    if (phase !== 'line3') return
    if (line3Count >= LINE3.length) {
      const timer = window.setTimeout(() => setPhase('hold'), 450)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setLine3Count((count) => count + 1), TYPE_MS)
    return () => window.clearTimeout(timer)
  }, [phase, line3Count])

  useEffect(() => {
    if (phase !== 'hold' || !imagesReady) return
    const timer = window.setTimeout(() => setPhase('golf'), 650)
    return () => window.clearTimeout(timer)
  }, [phase, imagesReady])

  useEffect(() => {
    if (phase !== 'golf') return
    const timer = window.setTimeout(() => setPhase('impact'), 1400)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'impact' || impactHandled.current) return
    impactHandled.current = true
    playGolfHitSound()
    const timer = window.setTimeout(() => setPhase('exit'), 520)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'exit') return
    const timer = window.setTimeout(() => finish(), 720)
    return () => window.clearTimeout(timer)
  }, [phase, finish])

  if (!mounted) return null

  const spreadActive = phase !== 'measure' && offsets != null
  const line2Active = phase === 'line2' || phase === 'line3' || phase === 'hold'
  const line3Active = phase === 'line3' || phase === 'hold'
  const isImpact = phase === 'impact' || phase === 'exit'

  return (
    <div
      className={cn(
        'ikon-splash fixed inset-0 z-[100] h-[100dvh] w-full overflow-hidden bg-black',
        phase === 'exit' && 'ikon-splash--exit',
      )}
      aria-hidden={phase === 'exit'}
      onPointerDown={() => {
        unlockSplashAudio()
        if (phase === 'hold' || phase === 'golf' || phase === 'line3') finish()
      }}
      onAnimationEnd={(event) => {
        if (phase === 'exit' && event.animationName === 'ikon-splash-fade-out') {
          finish()
        }
      }}
    >
      <audio
        ref={bindGolfHitAudio}
        src="/sounds/golf-hit.mp3"
        preload="auto"
        playsInline
        className="hidden"
        aria-hidden
      />

      {showGolf && (
        <div
          className={cn(
            'ikon-splash-scene absolute inset-0 overflow-hidden bg-black',
            phase === 'golf' && 'ikon-splash-scene--breathe',
            isImpact && 'ikon-splash-scene--impact',
            phase === 'exit' && 'ikon-splash-scene--fly-away',
          )}
        >
          <picture>
            <source media={MOBILE_MEDIA} srcSet={GOLF_BALL_MOBILE} />
            <img
              src={GOLF_BALL_IMAGE}
              alt=""
              className={cn(
                'ikon-splash-frame ikon-splash-frame--rest',
                isImpact && 'ikon-splash-frame--hide',
              )}
              fetchPriority="high"
              decoding="sync"
            />
          </picture>

          <picture>
            <source media={MOBILE_MEDIA} srcSet={GOLF_IMPACT_MOBILE} />
            <img
              src={GOLF_IMPACT_IMAGE}
              alt=""
              className={cn(
                'ikon-splash-frame ikon-splash-frame--impact',
                isImpact && 'ikon-splash-frame--show',
              )}
              decoding="sync"
            />
          </picture>

          <GolfGrassBurst active={phase === 'impact'} />

          {phase === 'impact' && <div className="ikon-splash-flash pointer-events-none" aria-hidden />}
        </div>
      )}

      {showLogo && (
        <div
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center bg-black',
            (phase === 'hold' || phase === 'golf') && 'transition-opacity duration-500',
            phase === 'golf' && 'pointer-events-none opacity-0',
          )}
        >
          <div
            ref={blockRef}
            className="ikon-splash-logo flex flex-col items-center text-white"
            style={{
              width: `${LOGO_BLOCK_WIDTH}rem`,
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
            }}
            aria-label="IKON Sports & Lounge Sant Jordi"
          >
            <div
              ref={wordRef}
              className="ikon-splash-word flex w-full justify-between uppercase leading-[0.9] text-white"
              style={{ fontSize: '3.35rem' }}
            >
              {LETTERS.map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  ref={(el) => {
                    letterRefs.current[index] = el
                  }}
                  className="inline-block will-change-transform"
                  style={{
                    opacity: spreadActive ? 1 : 0,
                    transform: spreadActive
                      ? 'translateX(0)'
                      : `translateX(${offsets?.[index] ?? 0}px) scale(0.88)`,
                    transition: `transform ${SPREAD_MS}ms cubic-bezier(0.22, 1, 0.36, 1) ${index * STAGGER_MS}ms, opacity 520ms ease ${index * STAGGER_MS}ms`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>

            <SpreadReveal
              text={LINE2}
              revealCount={line2Count}
              active={line2Active}
              className="ikon-splash-sub mt-[0.55rem] text-[10px] leading-none"
            />

            <SpreadReveal
              text={LINE3}
              revealCount={line3Count}
              active={line3Active}
              className="ikon-splash-sub mt-[0.35rem] text-[10px] leading-none"
            />
          </div>
        </div>
      )}
    </div>
  )
}
