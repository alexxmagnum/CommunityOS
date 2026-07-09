'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Camera, CameraOff, Loader2, ScanLine } from 'lucide-react'
import { parseCheckInToken } from '@/lib/events/parse-check-in-token'
import { toast } from 'sonner'

type CheckInSuccess = {
  eventTitle: string
  attendeeName: string
  checkedInAt: string
}

interface CheckInScannerProps {
  organizationId: string
}

export function CheckInScanner({ organizationId }: CheckInScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [manualToken, setManualToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastSuccess, setLastSuccess] = useState<CheckInSuccess | null>(null)
  const [cameraSupported, setCameraSupported] = useState(false)

  const submitToken = useCallback(
    async (raw: string) => {
      const token = parseCheckInToken(raw)
      if (!token) {
        toast.error('Código no reconocido')
        return
      }

      setSubmitting(true)
      try {
        const response = await fetch('/api/events/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, organizationId }),
        })
        const payload = (await response.json()) as CheckInSuccess & { error?: string }

        if (!response.ok) {
          toast.error(payload.error || 'No se pudo acreditar')
          return
        }

        setLastSuccess({
          eventTitle: payload.eventTitle,
          attendeeName: payload.attendeeName,
          checkedInAt: payload.checkedInAt,
        })
        setManualToken('')
        toast.success(`${payload.attendeeName} acreditado`)
      } catch {
        toast.error('Error de red')
      } finally {
        setSubmitting(false)
      }
    },
    [organizationId]
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (typeof window === 'undefined') return

    const Detector = window.BarcodeDetector
    if (!Detector || !navigator.mediaDevices?.getUserMedia) {
      toast.info('Tu navegador no soporta escaneo con cámara. Usa el código manual.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)

      const detector = new Detector({ formats: ['qr_code'] })
      let cancelled = false

      const tick = async () => {
        if (cancelled || !videoRef.current || videoRef.current.readyState < 2) {
          if (!cancelled) requestAnimationFrame(() => void tick())
          return
        }

        try {
          const codes = await detector.detect(videoRef.current)
          const value = codes[0]?.rawValue
          if (value) {
            cancelled = true
            stopCamera()
            await submitToken(value)
            return
          }
        } catch {
          // seguir escaneando
        }

        if (!cancelled) requestAnimationFrame(() => void tick())
      }

      void tick()

      return () => {
        cancelled = true
      }
    } catch {
      toast.error('No se pudo acceder a la cámara')
    }
  }, [stopCamera, submitToken])

  useEffect(() => {
    const Detector = window.BarcodeDetector
    setCameraSupported(Boolean(Detector && navigator.mediaDevices?.getUserMedia))
    return () => stopCamera()
  }, [stopCamera])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ScanLine className="h-5 w-5 text-blue-600" />
            Escanear QR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanning ? (
            <div className="relative overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="aspect-[4/3] w-full object-cover" playsInline muted />
              <div className="absolute inset-0 border-2 border-dashed border-white/40 m-8 rounded-lg pointer-events-none" />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed bg-slate-50 text-sm text-muted-foreground">
              Activa la cámara para escanear el QR del socio
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {scanning ? (
              <Button type="button" variant="outline" onClick={stopCamera}>
                <CameraOff className="mr-2 h-4 w-4" />
                Detener cámara
              </Button>
            ) : (
              <Button type="button" onClick={() => void startCamera()} disabled={!cameraSupported}>
                <Camera className="mr-2 h-4 w-4" />
                {cameraSupported ? 'Activar cámara' : 'Cámara no disponible'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Código manual</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Pega el código o la URL del QR"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submitToken(manualToken)
            }}
          />
          <Button
            type="button"
            disabled={submitting || !manualToken.trim()}
            onClick={() => void submitToken(manualToken)}
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Acreditar
          </Button>
        </CardContent>
      </Card>

      {lastSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">{lastSuccess.attendeeName}</p>
              <p className="text-sm text-green-800">{lastSuccess.eventTitle}</p>
              <p className="mt-1 text-xs text-green-700">
                {new Date(lastSuccess.checkedInAt).toLocaleString('es-ES')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
