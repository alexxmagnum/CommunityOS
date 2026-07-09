export function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const fromAddress = extractEmailAddress(process.env.EMAIL_FROM?.trim()) || 'onboarding@resend.dev'

  return {
    apiKey,
    fromAddress,
    isConfigured: Boolean(apiKey && !apiKey.includes('placeholder')),
  }
}

/**
 * Construye el remitente con el nombre del club como nombre visible.
 * Ej: senderFrom('IKON', 'invitaciones@midominio.com') -> 'IKON <invitaciones@midominio.com>'
 * La dirección debe pertenecer a un dominio verificado en Resend.
 */
export function senderFrom(displayName: string, fromAddress: string): string {
  const clean = displayName.replace(/[<>"\r\n]/g, '').trim()
  if (!clean) return fromAddress
  return `${clean} <${fromAddress}>`
}

function extractEmailAddress(value?: string): string | null {
  if (!value) return null
  const match = value.match(/<([^>]+)>/)
  if (match) return match[1].trim()
  if (value.includes('@')) return value.trim()
  return null
}

export function getAppOrigin(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  if (host) return `${proto}://${host}`

  return 'http://localhost:3000'
}
