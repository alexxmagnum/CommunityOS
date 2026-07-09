/** Normaliza dominio custom: sin protocolo, sin www, minúsculas. */
export function normalizeCustomDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null

  try {
    const withProto = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    const host = new URL(withProto).hostname
    return host.replace(/^www\./, '')
  } catch {
    const host = trimmed.split('/')[0]?.split(':')[0]?.replace(/^www\./, '')
    return host || null
  }
}

/** Host al que debe apuntar el CNAME del cliente (tu despliegue). */
export function getPlatformCnameTarget(): string {
  const explicit = process.env.NEXT_PUBLIC_PLATFORM_CNAME_TARGET
  if (explicit) return explicit.replace(/^www\./, '')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      return new URL(appUrl).hostname.replace(/^www\./, '')
    } catch {
      // ignore
    }
  }

  return 'tu-app.vercel.app'
}

export function parseHostname(host: string | null): string | null {
  if (!host) return null
  const hostname = host.split(':')[0].toLowerCase()
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') return null
  return hostname
}

export function isPlatformHostname(hostname: string): boolean {
  const target = getPlatformCnameTarget().toLowerCase()
  if (hostname === target) return true

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    try {
      if (hostname === new URL(appUrl).hostname.toLowerCase()) return true
    } catch {
      // ignore
    }
  }

  return false
}
