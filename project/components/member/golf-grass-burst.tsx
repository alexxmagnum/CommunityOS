'use client'

import { useMemo, type CSSProperties } from 'react'

const GRASS_COUNT = 36

function pseudoRandom(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function GolfGrassBurst({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: GRASS_COUNT }, (_, index) => {
        const angle = -Math.PI / 2 + (pseudoRandom(index + 1) - 0.5) * 1.35
        const distance = 48 + pseudoRandom(index + 11) * 120
        const size = 3 + pseudoRandom(index + 21) * 7
        const delay = pseudoRandom(index + 31) * 0.04
        const duration = 0.38 + pseudoRandom(index + 41) * 0.35
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance * -1
        const hue = 95 + pseudoRandom(index + 51) * 35

        return { id: index, dx, dy, size, delay, duration, hue }
      }),
    [],
  )

  if (!active) return null

  return (
    <div className="ikon-splash-grass-burst pointer-events-none" aria-hidden>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="ikon-splash-grass-particle"
          style={
            {
              '--dx': `${particle.dx}px`,
              '--dy': `${particle.dy}px`,
              '--size': `${particle.size}px`,
              '--delay': `${particle.delay}s`,
              '--duration': `${particle.duration}s`,
              '--hue': particle.hue,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
