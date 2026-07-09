'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[tenant]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0c0f14] px-6 text-center text-white">
      <h1 className="text-2xl font-semibold">Algo falló al cargar</h1>
      <p className="max-w-md text-sm text-white/60">{error.message}</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" className="border-white/20 text-white" onClick={() => window.location.assign('/o/ikon')}>
          Ir a IKON
        </Button>
      </div>
    </div>
  )
}
