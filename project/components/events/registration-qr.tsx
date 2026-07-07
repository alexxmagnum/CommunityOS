'use client'

interface RegistrationQrProps {
  token: string
  eventTitle: string
}

export function RegistrationQr({ token, eventTitle }: RegistrationQrProps) {
  const checkInUrl = `ikon://checkin/${token}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(checkInUrl)}`

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="text-sm font-medium">Tu código de check-in</p>
      <p className="mt-1 text-xs text-muted-foreground">{eventTitle}</p>
      <img src={qrSrc} alt="QR check-in" className="mx-auto mt-4 rounded-lg" width={180} height={180} />
      <p className="mt-3 font-mono text-xs text-muted-foreground">{token.slice(0, 8)}…</p>
      <p className="mt-2 text-xs text-muted-foreground">Muestra este QR en la entrada</p>
    </div>
  )
}
