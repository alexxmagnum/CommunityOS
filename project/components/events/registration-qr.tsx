'use client'

interface RegistrationQrProps {
  token: string
  eventTitle: string
  slug: string
  appOrigin?: string
}

export function RegistrationQr({ token, eventTitle, slug, appOrigin }: RegistrationQrProps) {
  const origin =
    appOrigin?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const checkInUrl = `${origin}/o/${slug}/acreditacion/${token}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkInUrl)}`

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="text-sm font-medium">Tu código de acreditación</p>
      <p className="mt-1 text-xs text-muted-foreground">{eventTitle}</p>
      <img src={qrSrc} alt="QR de acreditación" className="mx-auto mt-4 rounded-lg" width={180} height={180} />
      <p className="mt-3 font-mono text-xs text-muted-foreground">{token.slice(0, 8)}…</p>
      <p className="mt-2 text-xs text-muted-foreground">Muestra este QR en la entrada del evento</p>
    </div>
  )
}
