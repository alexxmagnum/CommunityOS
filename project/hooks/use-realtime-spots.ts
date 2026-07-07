'use client'

import { useEffect, useState } from 'react'

/**
 * Simula actualización en vivo de plazas (demo) o escucha Supabase Realtime en producción.
 */
export function useRealtimeSpots(eventId: string, initialSpots: number | null, demoMode: boolean) {
  const [spots, setSpots] = useState(initialSpots)

  useEffect(() => {
    setSpots(initialSpots)
  }, [initialSpots, eventId])

  useEffect(() => {
    if (initialSpots === null || initialSpots <= 0) return

    if (demoMode) {
      const interval = setInterval(() => {
        setSpots((prev) => {
          if (prev === null || prev <= 0) return prev
          return Math.random() > 0.7 ? Math.max(0, prev - 1) : prev
        })
      }, 12000)
      return () => clearInterval(interval)
    }

    // Con Supabase: canal realtime sobre events.available_spots
    let cancelled = false
    ;(async () => {
      try {
        const { getSupabaseClient } = await import('@/lib/supabase/client')
        const { isSupabaseConfigured } = await import('@/lib/org/is-supabase-configured')
        if (!isSupabaseConfigured() || cancelled) return

        const supabase = getSupabaseClient()
        const channel = supabase
          .channel(`event-spots-${eventId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
            (payload) => {
              const next = (payload.new as { available_spots?: number }).available_spots
              if (typeof next === 'number') setSpots(next)
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } catch {
        // fallback silencioso
      }
    })()

    return () => {
      cancelled = true
    }
  }, [eventId, demoMode, initialSpots])

  return spots
}
